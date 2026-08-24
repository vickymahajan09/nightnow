import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID?.trim();

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      console.error(
        "Razorpay keys missing:",
        {
          hasKeyId: !!keyId,
          hasKeySecret: !!keySecret,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay server keys are not configured in .env.local",
        },
        { status: 500 }
      );
    }

    const credentials =
      Buffer.from(
        `${keyId}:${keySecret}`
      ).toString("base64");

    const razorpayResponse =
      await fetch(
        "https://api.razorpay.com/v1/orders",
        {
          method: "POST",

          headers: {
            Authorization:
              `Basic ${credentials}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount:
              Math.round(amount * 100),

            currency: "INR",

            receipt:
              `nightnow_${Date.now()}`,
          }),

          cache: "no-store",
        }
      );

    const responseText =
      await razorpayResponse.text();

    let data: any = null;

    try {
      data =
        JSON.parse(responseText);
    } catch {
      data = null;
    }

    console.log(
      "Razorpay response:",
      {
        status:
          razorpayResponse.status,
        ok:
          razorpayResponse.ok,
        data,
      }
    );

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.description ||
            data?.error?.message ||
            "Razorpay rejected the order request.",
        },
        {
          status:
            razorpayResponse.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      amount: data.amount,
      currency:
        data.currency || "INR",
    });
  } catch (error: any) {
    console.error(
      "Razorpay create-order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to create Razorpay order",
      },
      { status: 500 }
    );
  }
}