import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = body?.razorpay_payment_id;
    const orderId = body?.razorpay_order_id;
    const signature = body?.razorpay_signature;

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Razorpay payment details",
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay server secret is not configured",
        },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const valid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
