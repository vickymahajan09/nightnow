import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, adminMessaging } from "../../../lib/firebaseAdmin";

/**
 * Completes a delivery and credits the rider's earning.
 *
 * This lives on the server for one reason: the payout amount is read
 * from admin settings and written with the Admin SDK. If the rider's
 * browser did this, they could edit the number before it was saved.
 */

type PayoutRules = {
  perOrder?: number;
  perKm?: number;
  nightBonus?: number;
  nightStartHour?: number;
  nightEndHour?: number;
};

const DEFAULT_PAYOUT: Required<PayoutRules> = {
  perOrder: 20,
  perKm: 0,
  nightBonus: 10,
  nightStartHour: 22,
  nightEndHour: 6,
};

// Straight-line distance in km (same formula as app/lib/distance.ts,
// duplicated here because that file is a client module).
const distanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export async function POST(req: NextRequest) {
  try {
    const idToken = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Missing auth token." },
        { status: 401 }
      );
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    const partnerId = decoded.uid;

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required." },
        { status: 400 }
      );
    }

    const db = adminFirestore();

    // --- Caller must be an active delivery partner -----------------
    const partnerRef = db.collection("deliveryPartners").doc(partnerId);
    const partnerSnap = await partnerRef.get();

    if (!partnerSnap.exists || partnerSnap.data()?.active !== true) {
      return NextResponse.json(
        { success: false, error: "Not an active delivery partner." },
        { status: 403 }
      );
    }

    // --- The order must actually be theirs -------------------------
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderSnap.data() as any;

    if (order.assignedPartnerId !== partnerId) {
      return NextResponse.json(
        { success: false, error: "This order is not assigned to you." },
        { status: 403 }
      );
    }

    if (order.status === "Delivered") {
      return NextResponse.json(
        { success: false, error: "This order is already delivered." },
        { status: 409 }
      );
    }

    if (order.status === "Cancelled") {
      return NextResponse.json(
        { success: false, error: "This order was cancelled." },
        { status: 409 }
      );
    }

    // --- Work out the payout ---------------------------------------
    const settingsSnap = await db.collection("settings").doc("store").get();
    const settings = (settingsSnap.exists ? settingsSnap.data() : {}) as any;

    const rules: Required<PayoutRules> = {
      ...DEFAULT_PAYOUT,
      ...(settings?.riderPayout || {}),
    };

    const base = Number(rules.perOrder) || 0;

    let km = 0;
    const shop = settings?.location;
    const drop = order?.location;

    if (
      shop?.lat != null &&
      shop?.lng != null &&
      drop?.lat != null &&
      drop?.lng != null
    ) {
      km = distanceKm(
        Number(shop.lat),
        Number(shop.lng),
        Number(drop.lat),
        Number(drop.lng)
      );
    }

    const distanceBonus =
      Math.round(km * (Number(rules.perKm) || 0) * 100) / 100;

    // Night shift bonus - NightNow's whole pitch is late-night
    // delivery, so riders working those hours get paid extra.
    const hour = new Date().getHours();
    const start = Number(rules.nightStartHour);
    const end = Number(rules.nightEndHour);
    const isNight = start > end ? hour >= start || hour < end : hour >= start && hour < end;
    const nightBonus = isNight ? Number(rules.nightBonus) || 0 : 0;

    const amount = Math.round((base + distanceBonus + nightBonus) * 100) / 100;

    // --- Write everything atomically -------------------------------
    const batch = db.batch();
    const now = new Date();

    batch.update(orderRef, {
      status: "Delivered",
      deliveredAt: now,
      updatedAt: now,
      riderEarning: amount,
    });

    batch.set(
      db.collection("deliveryTracking").doc(orderId),
      { active: false, endedAt: now },
      { merge: true }
    );

    // Keyed by orderId so a double-tap can never pay twice.
    batch.set(partnerRef.collection("earnings").doc(orderId), {
      orderId,
      amount,
      base,
      distanceBonus,
      nightBonus,
      distanceKm: Math.round(km * 100) / 100,
      orderTotal: Number(order.total ?? order.subtotal ?? 0),
      paid: false,
      createdAt: now,
    });

    batch.update(partnerRef, {
      currentOrderId: null,
      totalEarnings: (Number(partnerSnap.data()?.totalEarnings) || 0) + amount,
      unpaidEarnings:
        (Number(partnerSnap.data()?.unpaidEarnings) || 0) + amount,
      totalDeliveries: (Number(partnerSnap.data()?.totalDeliveries) || 0) + 1,
      lastDeliveryAt: now,
    });

    await batch.commit();

    // --- Tell the customer (best effort) ---------------------------
    try {
      if (order.userId) {
        const tokensSnap = await db
          .collection("pushTokens")
          .where("userId", "==", order.userId)
          .get();

        const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);

        if (tokens.length > 0) {
          await adminMessaging().sendEachForMulticast({
            tokens,
            notification: {
              title: "Order Delivered",
              body: "Your NightNow order has been delivered. Enjoy!",
            },
            webpush: {
              notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
              fcmOptions: { link: `/orders/${orderId}` },
            },
            data: { orderId, url: `/orders/${orderId}` },
          });
        }
      }
    } catch (pushError) {
      console.error("Delivered push failed:", pushError);
    }

    return NextResponse.json({ success: true, earning: amount });
  } catch (error: any) {
    console.error("Delivery complete error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
