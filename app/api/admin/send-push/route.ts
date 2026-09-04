import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminMessaging, adminFirestore } from "../../../lib/firebaseAdmin";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mahajanvicky04@gmail.com")
  .trim()
  .toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    const email = (decoded.email || "").trim().toLowerCase();

    if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: "Only admin can send this." }, { status: 403 });
    }

    const { userId, title, body, orderId, url } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { success: false, error: "userId, title and body are required." },
        { status: 400 }
      );
    }

    const db = adminFirestore();

    const tokensSnap = await db.collection("pushTokens").where("userId", "==", userId).get();
    const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);

    if (tokens.length === 0) {
      // Not an error — user just hasn't enabled push notifications yet.
      return NextResponse.json({ success: true, sent: 0, message: "No push tokens for this user." });
    }

    const messaging = adminMessaging();
    const linkUrl = url || (orderId ? `/orders/${orderId}` : "/");

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        },
        fcmOptions: { link: linkUrl },
      },
      data: {
        orderId: orderId || "",
        url: linkUrl,
      },
    });

    // Firebase tells us which tokens are dead (uninstalled app, cleared site data, etc).
    // Clean them up so future sends don't keep failing on the same tokens.
    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = (r.error as any)?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument")
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    await Promise.all(
      invalidTokens.map((t) => db.collection("pushTokens").doc(t).delete().catch(() => {}))
    );

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error: any) {
    console.error("send-push error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send push notification." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "Push notification endpoint is ready." });
}
