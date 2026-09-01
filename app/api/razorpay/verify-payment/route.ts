import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = String(
      body?.razorpay_payment_id || ""
    ).trim();

    const orderId = String(
      body?.razorpay_order_id || ""
    ).trim();

    const signature = String(
      body?.razorpay_signature || ""
    ).trim();

    const expectedAmount = Number(
      body?.expectedAmount
    );

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Missing Razorpay payment details",
        },
        { status: 400 }
      );
    }

    const secret =
      process.env.RAZORPAY_KEY_SECRET?.trim();

    const keyId =
      process.env.RAZORPAY_KEY_ID?.trim();

    if (!secret || !keyId) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Razorpay server credentials are not configured",
        },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (
      expectedSignature.length !==
      signature.length
    ) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    // Verify the Razorpay order itself from the server.
    const basicAuth = Buffer.from(
      `${keyId}:${secret}`
    ).toString("base64");

    const razorpayOrderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(
        orderId
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
        cache: "no-store",
      }
    );

    const orderText =
      await razorpayOrderResponse.text();

    let razorpayOrder: any = null;

    try {
      razorpayOrder = JSON.parse(orderText);
    } catch {
      razorpayOrder = null;
    }

    if (!razorpayOrderResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            razorpayOrder?.error?.description ||
            "Unable to verify Razorpay order",
        },
        { status: 400 }
      );
    }

    const razorpayAmount = Number(
      razorpayOrder?.amount
    );

    if (
      !Number.isFinite(razorpayAmount) ||
      razorpayAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Invalid Razorpay order amount",
        },
        { status: 400 }
      );
    }

    if (
      Number.isFinite(expectedAmount) &&
      expectedAmount > 0 &&
      razorpayAmount !==
        Math.round(expectedAmount)
    ) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Payment amount does not match the Razorpay order amount",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId,
      orderId,
      amount: razorpayAmount,
      currency:
        razorpayOrder?.currency || "INR",
      orderStatus:
        razorpayOrder?.status || null,
    });
  } catch (error: any) {
    console.error(
      "Razorpay verify-payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error:
          error?.message ||
          "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
