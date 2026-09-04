import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, adminMessaging } from "../../../lib/firebaseAdmin";

const TITLES: Record<string, string> = {
  "new-order": "🛒 New Order Received",
  "order-cancelled": "❌ Order Cancelled",
  "return-requested": "↩️ Return Requested",
  "exchange-requested": "🔄 Exchange Requested",
  "low-stock": "⚠️ Low Stock Alert",
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing auth token." }, { status: 401 });
    }

    // Just needs to be a signed-in user (a customer placing an order triggers
    // this to notify the admin) — verifyIdToken also protects against forged requests.
    await adminAuth().verifyIdToken(idToken);

    const { type, orderId, ...extra } = await req.json();

    const db = adminFirestore();
    const tokensSnap = await db.collection("adminPushTokens").where("enabled", "==", true).get();
    const tokens = tokensSnap.docs.map((d) => d.data()?.token).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No admin push tokens registered." });
    }

    const title = TITLES[type] || "Night Now Admin";
    const label = String(type || "update").replace(/-/g, " ");
    const body =
      type === "low-stock"
        ? `${extra?.productName || "A product"} — only ${extra?.stock ?? 0} left in stock`
        : orderId
        ? `Order #${String(orderId).slice(0, 8)} — ${label}`
        : label;

    const messaging = adminMessaging();
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: { icon: "/favicon.ico", badge: "/favicon.ico" },
        fcmOptions: { link: "/admin/orders" },
      },
      data: { orderId: orderId || "", type: type || "", ...extra },
    });

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error: any) {
    console.error("admin notification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to notify admin." },
      { status: 500 }
    );
  }
}
