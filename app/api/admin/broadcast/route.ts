import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminMessaging, adminFirestore } from "../../../lib/firebaseAdmin";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mahajanvicky04@gmail.com")
  .trim()
  .toLowerCase();

// FCM allows a max of 500 tokens per multicast call.
const BATCH_SIZE = 500;

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
      return NextResponse.json({ success: false, error: "Only admin can send a broadcast." }, { status: 403 });
    }

    const { title, body, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and message are required." }, { status: 400 });
    }

    const db = adminFirestore();
    const tokensSnap = await db.collection("pushTokens").get();
    const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No customers have push notifications enabled yet." });
    }

    const messaging = adminMessaging();
    const linkUrl = url || "/";

    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);

      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        webpush: {
          notification: { icon: "/favicon.ico", badge: "/favicon.ico" },
          fcmOptions: { link: linkUrl },
        },
        data: { url: linkUrl },
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = (r.error as any)?.code || "";
          if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
            invalidTokens.push(batch[idx]);
          }
        }
      });
    }

    await Promise.all(
      invalidTokens.map((t) => db.collection("pushTokens").doc(t).delete().catch(() => {}))
    );

    return NextResponse.json({ success: true, sent, failed, totalTokens: tokens.length });
  } catch (error: any) {
    console.error("broadcast error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send broadcast." },
      { status: 500 }
    );
  }
}
