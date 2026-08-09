import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay server keys are not configured",
        },
        { status: 500 }
      );
    }

    const auth = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString("base64");

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: `nightnow_${Date.now()}`,
          payment_capture: 1,
        }),
        cache: "no-store",
      }
    );

    const text = await razorpayResponse.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: "Razorpay returned a non-JSON response",
        raw: text.slice(0, 500),
      };
    }

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.description ||
            data?.error ||
            "Razorpay order creation failed",
        },
        { status: razorpayResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
