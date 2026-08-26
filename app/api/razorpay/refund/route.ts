import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

// =====================================================
// FIREBASE ADMIN
// =====================================================

const getFirebaseAdmin =
  () => {
    if (
      getApps().length
    ) {
      return getApps()[0];
    }

    const privateKey =
      process.env
        .FIREBASE_PRIVATE_KEY
        ?.replace(
          /\\n/g,
          "\n"
        );

    return initializeApp({
      credential:
        cert({
          projectId:
            process.env
              .FIREBASE_PROJECT_ID,

          clientEmail:
            process.env
              .FIREBASE_CLIENT_EMAIL,

          privateKey,
        }),
    });
  };

// =====================================================
// POST REFUND
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const app =
      getFirebaseAdmin();

    const authAdmin =
      getAuth(app);

    const db =
      getFirestore(app);

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const idToken =
      authorization.replace(
        "Bearer ",
        ""
      );

    const decoded =
      await authAdmin.verifyIdToken(
        idToken
      );

    const body =
      await request.json();

    const orderId =
      String(
        body?.orderId ||
          ""
      );

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const orderRef =
      db
        .collection("orders")
        .doc(orderId);

    const orderSnapshot =
      await orderRef.get();

    if (
      !orderSnapshot.exists
    ) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const order =
      orderSnapshot.data();

    if (
      order?.userId !==
      decoded.uid
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to refund this order.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      order?.paymentMethod !==
      "Online"
    ) {
      return NextResponse.json(
        {
          error:
            "This order was not paid online.",
        },
        {
          status: 400,
        }
      );
    }

    const paymentId =
      order?.payment?.razorpay_payment_id ||
      order?.payment?.payment_id ||
      "";

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Razorpay payment ID not found.",
        },
        {
          status: 400,
        }
      );
    }

    const existingRefundStatus =
      order?.refundStatus;

    if (
      existingRefundStatus ===
        "Processing" ||
      existingRefundStatus ===
        "Processed"
    ) {
      return NextResponse.json(
        {
          error:
            "Refund has already been initiated.",
        },
        {
          status: 409,
        }
      );
    }

    const requestedAmount =
      Number(
        body?.amount ??
          order?.total ??
          0
      );

    if (
      !Number.isFinite(
        requestedAmount
      ) ||
      requestedAmount <=
        0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid refund amount.",
        },
        {
          status: 400,
        }
      );
    }

    const amountInPaise =
      Math.round(
        requestedAmount *
          100
      );

    const razorpayKeyId =
      process.env
        .RAZORPAY_KEY_ID;

    const razorpaySecret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpaySecret
    ) {
      return NextResponse.json(
        {
          error:
            "Razorpay server credentials are not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const basicAuth =
      Buffer.from(
        `${razorpayKeyId}:${razorpaySecret}`
      ).toString(
        "base64"
      );

    const idempotencyKey =
      `refund_${orderId}_${amountInPaise}`;

    await orderRef.update({
      refundStatus:
        "Processing",

      refundAmount:
        requestedAmount,

      refundRequestedAt:
        new Date(),

      updatedAt:
        new Date(),
    });

    const razorpayResponse =
      await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(
          paymentId
        )}/refund`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Basic ${basicAuth}`,

            "Content-Type":
              "application/json",

            "X-Refund-Idempotency":
              idempotencyKey,
          },

          body:
            JSON.stringify({
              amount:
                amountInPaise,

              speed:
                "normal",

              receipt:
                `refund_${orderId}`,

              notes: {
                orderId,
              },
            }),
        }
      );

    const refundData =
      await razorpayResponse.json();

    if (
      !razorpayResponse.ok
    ) {
      await orderRef.update({
        refundStatus:
          "Failed",

        refundError:
          refundData,

        updatedAt:
          new Date(),
      });

      return NextResponse.json(
        {
          error:
            refundData?.error
              ?.description ||
            "Razorpay refund failed.",
        },
        {
          status:
            razorpayResponse.status ||
            500,
        }
      );
    }

    await orderRef.update({
      refundStatus:
        refundData?.status ===
        "processed"
          ? "Processed"
          : "Processing",

      refundId:
        refundData?.id ||
        null,

      refundPaymentId:
        paymentId,

      refundAmount:
        requestedAmount,

      refundData,

      refundProcessedAt:
        refundData?.status ===
        "processed"
          ? new Date()
          : null,

      updatedAt:
        new Date(),
    });

    return NextResponse.json(
      {
        success:
          true,

        refund:
          refundData,
      }
    );
  } catch (error: any) {
    console.error(
      "Razorpay refund error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Refund failed.",
      },
      {
        status: 500,
      }
    );
  }
}