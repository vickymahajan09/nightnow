"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { useCart } from "../context/CartContext";
import { auth } from "../lib/firebase";
import { addOrder } from "../services/orderService";
import {
  getProductById,
  updateProductStock,
} from "../services/productService";
import { getCoupons } from "../services/couponService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const {
    cart,
    cartTotal,
    deleteFromCart,
  } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const delivery = cartTotal >= 299 ? 0 : 30;

  const discountAmount = Math.round(
    (cartTotal * couponDiscount) / 100
  );

  const grandTotal = Math.max(
    0,
    cartTotal - discountAmount + delivery
  );

  // ==============================
  // LOAD COUPONS
  // ==============================

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await getCoupons();
        setCoupons(data);
      } catch (error) {
        console.error("Coupon loading failed:", error);
      }
    };

    loadCoupons();
  }, []);

  // ==============================
  // APPLY COUPON
  // ==============================

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponMessage("Enter coupon code");
      setCouponDiscount(0);
      return;
    }

    const coupon = coupons.find(
      (item: any) =>
        String(item.code || "").toUpperCase() === code &&
        item.active !== false
    );

    if (!coupon) {
      setCouponDiscount(0);
      setCouponMessage("Invalid coupon");
      return;
    }

    // Minimum order
    const minimumOrder = Number(
      coupon.minOrder || 0
    );

    if (cartTotal < minimumOrder) {
      setCouponDiscount(0);
      setCouponMessage(
        `Minimum order ₹${minimumOrder} required`
      );
      return;
    }

    // Expiry
    if (coupon.expiresAt) {
      try {
        const expiry = coupon.expiresAt?.toDate
          ? coupon.expiresAt.toDate()
          : new Date(coupon.expiresAt);

        if (
          !isNaN(expiry.getTime()) &&
          expiry.getTime() < Date.now()
        ) {
          setCouponDiscount(0);
          setCouponMessage("Coupon has expired");
          return;
        }
      } catch {
        // Ignore invalid expiry format
      }
    }

    const discount = Number(
      coupon.discount || 0
    );

    if (discount <= 0 || discount > 100) {
      setCouponDiscount(0);
      setCouponMessage("Invalid discount");
      return;
    }

    setCouponDiscount(discount);

    setCouponMessage(
      `${discount}% discount applied`
    );
  };

  // ==============================
  // REMOVE COUPON
  // ==============================

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponMessage("");
  };

  // ==============================
  // VALIDATE CHECKOUT
  // ==============================

  const validate = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return false;
    }

    if (!phone || phone.length !== 10) {
      alert("Enter valid 10 digit phone number");
      return false;
    }

    if (!address.trim()) {
      alert("Please enter delivery address");
      return false;
    }

    if (!city.trim()) {
      alert("Please enter city");
      return false;
    }

    if (!pincode || pincode.length !== 6) {
      alert("Enter valid 6 digit pincode");
      return false;
    }

    if (!cart || cart.length === 0) {
      alert("Cart is empty");
      return false;
    }

    if (grandTotal <= 0) {
      alert("Invalid order total");
      return false;
    }

    return true;
  };

  // ==============================
  // GET CURRENT USER EMAIL
  // ==============================

  const getCurrentEmail = async (): Promise<string> => {
    if (auth.currentUser?.email) {
      return auth.currentUser.email;
    }

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user?.email || "");
        }
      );
    });
  };

  // ==============================
  // UPDATE STOCK
  // ==============================

  const reduceStock = async () => {
    for (const item of cart) {
      try {
        const product = await getProductById(
          
          item.id
          
        );

        if (!product) {
          console.warn(
            "Product not found:",
            item.id
          );
          continue;
        }

        const currentStock = Number(
          product.stock || 0
        );

        const quantity = Number(
          item.quantity || 1
        );

        const newStock =
          currentStock - quantity;

        if (newStock < 0) {
          throw new Error(
            `${item.name || "Product"} is out of stock`
          );
        }

        await updateProductStock(
          item.id,
          newStock
        );
      } catch (error) {
        console.error(
          "Stock update failed:",
          error
        );
      }
    }
  };

  // ==============================
  // CLEAR CART
  // ==============================

  const clearCurrentCart = () => {
    cart.forEach((item: any) => {
      deleteFromCart(item.id);
    });
  };

  // ==============================
  // SAVE ORDER
  // ==============================

  const saveOrder = async (
    paymentMethod: string,
    paymentData: any = {}
  ) => {
    const email = await getCurrentEmail();

    const order = {
      customer: {
        name: name.trim(),
        email,
        phone,
        address: address.trim(),
        city: city.trim(),
        pincode,
      },

      items: cart,

      subtotal: cartTotal,

      discount: discountAmount,

      coupon:
        couponDiscount > 0
          ? couponCode.trim().toUpperCase()
          : "",

      delivery,

      total: grandTotal,

      paymentMethod,

      payment: paymentData,

      createdBy: email,
    };

    await addOrder(order);

    await reduceStock();

    clearCurrentCart();

    window.location.href = "/orders";
  };

  // ==============================
  // COD
  // ==============================

  const placeCODOrder = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await saveOrder("COD");
    } catch (error: any) {
      console.error(
        "COD order failed:",
        error
      );

      alert(
        error?.message ||
          "Failed to place order"
      );

      setLoading(false);
    }
  };

  // ==============================
  // LOAD RAZORPAY
  // ==============================

  const loadRazorpay = async () => {
    if (
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      )
    ) {
      return true;
    }

    return new Promise<boolean>(
      (resolve) => {
        const script =
          document.createElement("script");

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        script.onload = () => resolve(true);

        script.onerror = () =>
          resolve(false);

        document.body.appendChild(script);
      }
    );
  };

  // ==============================
  // ONLINE PAYMENT
  // ==============================

  const payOnline = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay could not be loaded"
        );
      }

      // Create Razorpay order
      const orderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount: grandTotal,
          }),
        }
      );

      const responseText =
        await orderResponse.text();

      let razorpayOrder: any;

      try {
        razorpayOrder =
          JSON.parse(responseText);
      } catch {
        console.error(
          "Invalid Razorpay API response:",
          responseText
        );

        throw new Error(
          "Payment server returned an invalid response"
        );
      }

      if (!orderResponse.ok) {
        throw new Error(
          razorpayOrder?.error ||
            "Razorpay order creation failed"
        );
      }

      if (!razorpayOrder?.id) {
        throw new Error(
          "Razorpay order ID missing"
        );
      }

      const razorpayKey =
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error(
          "Razorpay key is not configured"
        );
      }

      const options = {
        key: razorpayKey,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency ||
          "INR",

        name: "Night Now",

        description:
          "Night Now Order",

        order_id:
          razorpayOrder.id,

        prefill: {
          name: name.trim(),
          contact: `+91${phone}`,
        },

        notes: {
          address,
          city,
          pincode,

          coupon:
            couponDiscount > 0
              ? couponCode
                  .trim()
                  .toUpperCase()
              : "",
        },

        theme: {
          color: "#FFD700",
        },

        handler:
          async (response: any) => {
            try {
              const verifyResponse =
                await fetch(
                  "/api/razorpay/verify-payment",
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify(
                      response
                    ),
                  }
                );

              const verifyText =
                await verifyResponse.text();

              let verification: any;

              try {
                verification =
                  JSON.parse(
                    verifyText
                  );
              } catch {
                throw new Error(
                  "Payment verification server returned invalid response"
                );
              }

              if (
                !verifyResponse.ok ||
                !verification?.success
              ) {
                throw new Error(
                  verification?.error ||
                    "Payment verification failed"
                );
              }

              await saveOrder(
                "Razorpay",
                {
                  paymentId:
                    response.razorpay_payment_id,

                  razorpayOrderId:
                    response.razorpay_order_id,

                  signature:
                    response.razorpay_signature,
                }
              );
            } catch (error: any) {
              console.error(
                "Payment verification failed:",
                error
              );

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
        new window.Razorpay(
          options
        );

      razorpay.open();
    } catch (error: any) {
      console.error(
        "Online payment failed:",
        error
      );

      alert(
        error?.message ||
          "Unable to start online payment"
      );

      setLoading(false);
    }
  };

  // ==============================
  // EMPTY CART
  // ==============================

  if (!cart || cart.length === 0) {
    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-md text-center">
          <div className="text-7xl">
            🛒
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Cart is Empty
          </h1>

          <p className="mt-3 text-zinc-400">
            Add some products before checkout.
          </p>

          <Link href="/">
            <button className="mt-8 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black">
              Start Shopping
            </button>
          </Link>
        </div>
      </main>
    );
  }

  // ==============================
  // PAGE
  // ==============================

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <Link href="/cart">
          <button className="rounded-lg bg-zinc-800 px-4 py-2 font-semibold">
            ← Back to Cart
          </button>
        </Link>

        <h1 className="mt-6 text-3xl font-black">
          Checkout
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* DELIVERY DETAILS */}

          <div className="rounded-2xl bg-zinc-900 p-6">

            <h2 className="mb-6 text-xl font-bold">
              Delivery Details
            </h2>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
              />

              <textarea
                placeholder="Delivery Address"
                rows={4}
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
              />

              <div className="grid gap-4 sm:grid-cols-2">

                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
                />

                <input
                  type="text"
                  placeholder="Pincode"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
                />

              </div>

            </div>

          </div>

          {/* ORDER SUMMARY */}

          <div className="h-fit rounded-2xl bg-zinc-900 p-6">

            <h2 className="text-xl font-bold">
              Order Summary
            </h2>

            <div className="mt-5 space-y-4">

              {cart.map(
                (item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-zinc-800 pb-3"
                  >

                    <div className="min-w-0 pr-3">

                      <p className="font-semibold">
                        {item.name}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {item.quantity || 1}
                        {" × "}
                        ₹{item.price}
                      </p>

                    </div>

                    <p className="shrink-0 font-bold">
                      ₹
                      {Number(
                        item.price || 0
                      ) *
                        Number(
                          item.quantity || 1
                        )}
                    </p>

                  </div>
                )
              )}

              {/* COUPON */}

              <div className="pt-2">

                <p className="mb-2 text-sm text-zinc-400">
                  Coupon Code
                </p>

                <div className="flex gap-2">

                  <input
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Enter coupon"
                    disabled={
                      couponDiscount > 0
                    }
                    className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-3 outline-none"
                  />

                  {couponDiscount > 0 ? (
                    <button
                      onClick={removeCoupon}
                      className="rounded-lg bg-red-600 px-4 font-bold"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      className="rounded-lg bg-yellow-400 px-4 font-bold text-black"
                    >
                      Apply
                    </button>
                  )}

                </div>

                {couponMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      couponDiscount > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {couponMessage}
                  </p>
                )}

              </div>

              {/* TOTALS */}

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Subtotal
                </span>

                <span>
                  ₹{cartTotal}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>
                    Coupon Discount
                  </span>

                  <span>
                    -₹{discountAmount}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Delivery
                </span>

                <span>
                  {delivery === 0
                    ? "FREE"
                    : `₹${delivery}`}
                </span>
              </div>

              <div className="border-t border-zinc-700 pt-4">

                <div className="flex justify-between text-xl font-black">

                  <span>
                    Total
                  </span>

                  <span className="text-yellow-400">
                    ₹{grandTotal}
                  </span>

                </div>

              </div>

            </div>

            {/* ONLINE PAYMENT */}

            <button
              onClick={payOnline}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : `Pay Online • ₹${grandTotal}`}
            </button>

            {/* COD */}

            <button
              onClick={placeCODOrder}
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-zinc-800 py-4 font-bold disabled:opacity-50"
            >
              Cash on Delivery
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}