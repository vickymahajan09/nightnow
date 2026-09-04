import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, adminMessaging } from "../../../lib/firebaseAdmin";

/**
 * Pushes a "new order" alert to every registered delivery partner
 * the moment a customer places an order.
 *
 * This is the change that actually saves delivery time: the rider
 * starts moving toward the shop while the admin is still packing,
 * instead of finding out only after packing is done.
 */

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

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required." },
        { status: 400 }
      );
    }

    const db = adminFirestore();

    const orderSnap = await db.collection("orders").doc(orderId).get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderSnap.data() as any;

    // Only the person who placed the order can trigger this, so the
    // endpoint can't be used to spam riders with fake alerts.
    if (order.userId !== decoded.uid) {
      return NextResponse.json(
        { success: false, error: "Not your order." },
        { status: 403 }
      );
    }

    const tokensSnap = await db
      .collection("pushTokens")
      .where("role", "==", "partner")
      .get();

    const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No delivery partners have enabled notifications yet.",
      });
    }

    const itemCount = (order.items || []).reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 1),
      0
    );

    const area = order?.customer?.city || order?.customer?.area || "";

    const response = await adminMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "New order available",
        body: `${itemCount} ${itemCount === 1 ? "item" : "items"} - Rs ${Number(
          order.total ?? order.subtotal ?? 0
        )}${area ? ` - ${area}` : ""}. Tap to accept.`,
      },
      webpush: {
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true,
        },
        fcmOptions: { link: "/deliver/dashboard" },
      },
      data: { orderId, url: "/deliver/dashboard" },
    });

    // Clean up tokens the device has thrown away, otherwise the list
    // grows forever and every send wastes calls on dead entries.
    const stale: string[] = [];
    response.responses.forEach((result, index) => {
      const code = (result as any)?.error?.code || "";
      if (
        !result.success &&
        (code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument"))
      ) {
        stale.push(tokens[index]);
      }
    });

    await Promise.all(
      stale.map((token) =>
        db.collection("pushTokens").doc(token).delete().catch(() => null)
      )
    );

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error: any) {
    console.error("Rider notify error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
