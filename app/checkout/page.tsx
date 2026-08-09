// IMPORTANT PATCH:
// Keep your existing CheckoutPage UI and all existing code.
// Replace ONLY the JSON parsing inside payOnline() with this safer version.

const orderResponse = await fetch(
  "/api/razorpay/create-order",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: grandTotal,
    }),
  }
);

const responseText = await orderResponse.text();

let razorpayOrder: any;

try {
  razorpayOrder = JSON.parse(responseText);
} catch {
  console.error(
    "Create-order returned non-JSON:",
    responseText
  );

  throw new Error(
    "Payment server returned an invalid response. Check /api/razorpay/create-order."
  );
}

if (!orderResponse.ok || !razorpayOrder?.success) {
  throw new Error(
    razorpayOrder?.error ||
      "Razorpay order creation failed"
  );
}

// Use these values below in your existing Razorpay options:
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: razorpayOrder.amount,
  currency: "INR",
  name: "Night Now",
  description: "Night Now Order",
  order_id: razorpayOrder.id,
  prefill: {
    name,
    contact: `+91${phone}`,
  },
  notes: {
    address,
    city,
    pincode,
    coupon:
      couponDiscount > 0
        ? couponCode.toUpperCase()
        : "",
  },
  theme: {
    color: "#FFD700",
  },

  handler: async (response: any) => {
    try {
      const verifyResponse = await fetch(
        "/api/razorpay/verify-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(response),
        }
      );

      const verifyText =
        await verifyResponse.text();

      let verification: any;

      try {
        verification = JSON.parse(verifyText);
      } catch {
        console.error(
          "Verify returned non-JSON:",
          verifyText
        );

        throw new Error(
          "Payment verification server returned an invalid response."
        );
      }

      if (
        !verifyResponse.ok ||
        !verification.success
      ) {
        throw new Error(
          verification?.error ||
            "Payment verification failed"
        );
      }

      await saveOrder("Razorpay", {
        paymentId:
          response.razorpay_payment_id,
        razorpayOrderId:
          response.razorpay_order_id,
        signature:
          response.razorpay_signature,
      });
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "Payment verification failed"
      );
      setLoading(false);
    }
  },

  modal: {
    ondismiss: () => {
      setLoading(false);
    },
  },
};

const razorpay =
  new window.Razorpay(options);

razorpay.open();
