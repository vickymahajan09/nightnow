"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../lib/firebase";

import { useCart } from "../context/CartContext";

import { addOrder } from "../services/orderService";

import { getCoupons } from "../services/couponService";

import { getAddresses } from "../services/addressService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type SavedAddress = {
  id?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  label?: string;
  isDefault?: boolean;
};

type Coupon = {
  id: string;
  code: string;
  discount: number;
  minOrder?: number;
  expiresAt?: string;
  active?: boolean;
};

export default function CheckoutPage() {
  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart();

  const [user, setUser] =
    useState<any>(null);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [
    savedAddresses,
    setSavedAddresses,
  ] = useState<SavedAddress[]>([]);

  const [
    showAddresses,
    setShowAddresses,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  /* =====================================================
     COUPON
  ===================================================== */

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<Coupon | null>(null);

  const [
    couponDiscount,
    setCouponDiscount,
  ] = useState(0);

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    couponMessage,
    setCouponMessage,
  ] = useState("");

  const [
    couponError,
    setCouponError,
  ] = useState("");

  /* =====================================================
     TOTALS
  ===================================================== */

  const delivery =
    cartTotal >= 299 ? 0 : 30;

  const subtotalAfterCoupon =
    Math.max(
      0,
      cartTotal - couponDiscount
    );

  const grandTotal =
    subtotalAfterCoupon + delivery;

  /* =====================================================
     AUTH + SAVED ADDRESS
  ===================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            setSavedAddresses([]);
            return;
          }

          try {
            const addresses =
              await getAddresses();

            const normalized =
              addresses.map((item: any) => ({
                id: item.id,
                name: item.name || "",
                phone: item.phone || "",
                address: item.address || "",
                city: item.city || "",
                pincode: item.pincode || "",
                label: item.label || "",
                isDefault: Boolean(
                  item.isDefault
                ),
              }));

            setSavedAddresses(
              normalized
            );

            if (
              normalized.length > 0
            ) {
              const selected =
                normalized.find(
                  (item) =>
                    item.isDefault
                ) ||
                normalized[0];

              setName(
                selected.name || ""
              );

              setPhone(
                selected.phone || ""
              );

              setAddress(
                selected.address || ""
              );

              setCity(
                selected.city || ""
              );

              setPincode(
                selected.pincode || ""
              );
            }
          } catch (error) {
            console.error(
              "Address loading failed:",
              error
            );
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /* =====================================================
     SELECT ADDRESS
  ===================================================== */

  const selectAddress = (
    item: SavedAddress
  ) => {
    setName(item.name || "");
    setPhone(item.phone || "");
    setAddress(item.address || "");
    setCity(item.city || "");
    setPincode(item.pincode || "");

    try {
      localStorage.setItem(
        "nightnow-checkout-address",
        JSON.stringify(item)
      );
    } catch {
      // Ignore localStorage errors.
    }

    setShowAddresses(false);
  };

  /* =====================================================
     APPLY COUPON
  ===================================================== */

  const applyCoupon = async () => {
    const cleanCode =
      couponCode
        .trim()
        .toUpperCase();

    setCouponError("");
    setCouponMessage("");

    if (!cleanCode) {
      setCouponError(
        "Please enter coupon code."
      );
      return;
    }

    if (cartTotal <= 0) {
      setCouponError(
        "Cart is empty."
      );
      return;
    }

    setCouponLoading(true);

    try {
      const coupons =
        (await getCoupons()) as Coupon[];

      const coupon =
        coupons.find(
          (item) =>
            String(item.code || "")
              .trim()
              .toUpperCase() ===
            cleanCode
        );

      if (!coupon) {
        setCouponError(
          "Invalid coupon code."
        );

        setAppliedCoupon(null);
        setCouponDiscount(0);

        return;
      }

      if (coupon.active === false) {
        setCouponError(
          "This coupon is inactive."
        );

        setAppliedCoupon(null);
        setCouponDiscount(0);

        return;
      }

      const minOrder =
        Number(
          coupon.minOrder || 0
        );

      if (
        minOrder > 0 &&
        cartTotal < minOrder
      ) {
        setCouponError(
          `Minimum order value is ₹${minOrder}.`
        );

        setAppliedCoupon(null);
        setCouponDiscount(0);

        return;
      }

      if (coupon.expiresAt) {
        const expiryDate =
          new Date(
            coupon.expiresAt
          );

        if (
          !Number.isNaN(
            expiryDate.getTime()
          ) &&
          expiryDate < new Date()
        ) {
          setCouponError(
            "This coupon has expired."
          );

          setAppliedCoupon(null);
          setCouponDiscount(0);

          return;
        }
      }

      const discountPercent =
        Number(
          coupon.discount || 0
        );

      if (discountPercent <= 0) {
        setCouponError(
          "Invalid coupon discount."
        );

        setAppliedCoupon(null);
        setCouponDiscount(0);

        return;
      }

      const discountAmount =
        Math.round(
          (cartTotal *
            discountPercent) /
            100
        );

      const finalDiscount =
        Math.min(
          discountAmount,
          cartTotal
        );

      setAppliedCoupon(coupon);

      setCouponDiscount(
        finalDiscount
      );

      setCouponCode(coupon.code);

      setCouponMessage(
        `Coupon applied! You saved ₹${finalDiscount}.`
      );
    } catch (error) {
      console.error(
        "Coupon apply error:",
        error
      );

      setCouponError(
        "Unable to apply coupon. Please try again."
      );

      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  /* =====================================================
     REMOVE COUPON
  ===================================================== */

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  /* =====================================================
     VALIDATE
  ===================================================== */

  const validate = () => {
    if (!user) {
      alert(
        "Please login before placing an order."
      );

      return false;
    }

    if (!name.trim()) {
      alert(
        "Please enter your name"
      );

      return false;
    }

    const cleanPhone =
      phone.replace(/\D/g, "");

    if (
      cleanPhone.length !== 10
    ) {
      alert(
        "Enter valid 10 digit phone number"
      );

      return false;
    }

    if (!address.trim()) {
      alert(
        "Please enter delivery address"
      );

      return false;
    }

    if (!city.trim()) {
      alert(
        "Please enter city"
      );

      return false;
    }

    const cleanPincode =
      pincode.replace(/\D/g, "");

    if (
      cleanPincode.length !== 6
    ) {
      alert(
        "Enter valid 6 digit pincode"
      );

      return false;
    }

    if (
      !cart ||
      cart.length === 0
    ) {
      alert(
        "Cart is empty"
      );

      return false;
    }

    return true;
  };

  /* =====================================================
     OFFER SNAPSHOT
     
     Offer details are copied into the order.
     Future offer edits will NOT change old orders.
  ===================================================== */

  const buildOfferSnapshot = () => {
    return cart
      .filter(
        (item: any) =>
          item.offerType &&
          item.offerType !== "NONE"
      )
      .map((item: any) => ({
        productId:
          String(item.id || ""),

        productName:
          item.name || "Product",

        offerId:
          item.offerId || null,

        offerType:
          item.offerType || "NONE",

        offerLabel:
          item.offerLabel || "",

        offerDescription:
          item.offerDescription || "",

        buyQuantity:
          Number(
            item.offerBuyQuantity || 1
          ),

        freePerSet:
          Number(
            item.offerFreeQuantity || 0
          ),

        paidQuantity:
          Number(
            item.quantity || 1
          ),

        freeQuantity:
          Number(
            item.freeQuantity || 0
          ),

        totalQuantity:
          Number(
            item.totalQuantity ||
              item.quantity ||
              1
          ),

        unitPrice:
          Number(
            item.price || 0
          ),

        paidAmount:
          Number(item.price || 0) *
          Number(item.quantity || 1),

        freeAmount:
          Number(item.price || 0) *
          Number(item.freeQuantity || 0),
      }));
  };

  /* =====================================================
     GET MAIN OFFER
     
     If multiple products are under the same offer,
     take the first offer as the order-level snapshot.
  ===================================================== */

  const getPrimaryOffer = (
    offerSnapshot: any[]
  ) => {
    if (
      !offerSnapshot.length
    ) {
      return null;
    }

    return offerSnapshot[0];
  };

  /* =====================================================
     SAVE ORDER
  ===================================================== */

  const saveOrder = async (
    paymentMethod: string,
    paymentData: any = {}
  ) => {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "Please login before placing an order."
      );
    }

    const offerSnapshot =
      buildOfferSnapshot();

    const primaryOffer =
      getPrimaryOffer(
        offerSnapshot
      );

    /* =================================================
       ORDER ITEMS
    ================================================= */

    const orderItems =
      cart.map((item: any) => ({
        ...item,

        paidQuantity:
          Number(
            item.quantity || 1
          ),

        freeQuantity:
          Number(
            item.freeQuantity || 0
          ),

        totalQuantity:
          Number(
            item.totalQuantity ||
              item.quantity ||
              1
          ),

        offerSnapshot:
          item.offerType &&
          item.offerType !== "NONE"
            ? {
                offerId:
                  item.offerId ||
                  null,

                offerType:
                  item.offerType,

                offerLabel:
                  item.offerLabel ||
                  "",

                offerDescription:
                  item.offerDescription ||
                  "",

                offerBuyQuantity:
                  Number(
                    item.offerBuyQuantity ||
                      1
                  ),

                offerFreeQuantity:
                  Number(
                    item.offerFreeQuantity ||
                      0
                  ),

                paidQuantity:
                  Number(
                    item.quantity ||
                      1
                  ),

                freeQuantity:
                  Number(
                    item.freeQuantity ||
                      0
                  ),

                totalQuantity:
                  Number(
                    item.totalQuantity ||
                      item.quantity ||
                      1
                  ),
              }
            : null,
      }));

    /* =================================================
       ORDER DATA
    ================================================= */

    const order = {
      /* CUSTOMER */

      customer: {
        uid:
          currentUser.uid,

        userId:
          currentUser.uid,

        name:
          name.trim(),

        phone:
          phone.replace(/\D/g, ""),

        address:
          address.trim(),

        city:
          city.trim(),

        pincode:
          pincode.replace(
            /\D/g,
            ""
          ),
      },

      userId:
        currentUser.uid,

      customerEmail:
        currentUser.email || null,

      /* ITEMS */

      items:
        orderItems,

      /* =================================================
         OFFER INFORMATION
      ================================================= */

      isOfferOrder:
        offerSnapshot.length > 0,

      hasOffers:
        offerSnapshot.length > 0,

      offers:
        offerSnapshot,

      offerId:
        primaryOffer?.offerId ||
        null,

      offerType:
        primaryOffer?.offerType ||
        null,

      offerLabel:
        primaryOffer?.offerLabel ||
        null,

      offerTitle:
        primaryOffer?.offerLabel ||
        null,

      offerBuyQuantity:
        primaryOffer
          ? Number(
              primaryOffer.buyQuantity ||
                1
            )
          : 0,

      offerFreeQuantity:
        primaryOffer
          ? Number(
              primaryOffer.freePerSet ||
                0
            )
          : 0,

      offerDescription:
        primaryOffer?.offerDescription ||
        null,

      /* PRICE */

      subtotal:
        cartTotal,

      coupon:
        appliedCoupon
          ? {
              id:
                appliedCoupon.id,

              code:
                appliedCoupon.code,

              discountPercent:
                Number(
                  appliedCoupon.discount ||
                    0
                ),

              discountAmount:
                couponDiscount,
            }
          : null,

      couponCode:
        appliedCoupon?.code ||
        null,

      couponDiscount:
        couponDiscount,

      delivery:
        delivery,

      total:
        grandTotal,

      /* PAYMENT */

      paymentMethod:
        paymentMethod,

      payment:
        paymentData,

      /* STATUS */

      status:
        "Pending",

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    await addOrder(order);

    clearCart();

    window.location.href =
      "/orders";
  };

  /* =====================================================
     COD
  ===================================================== */

  const placeCOD = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await saveOrder("COD");
    } catch (error: any) {
      console.error(
        "COD order error:",
        error
      );

      alert(
        error?.message ||
          "Order Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     ONLINE PAYMENT
  ===================================================== */

  const payOnline = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      if (!window.Razorpay) {
        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        document.body.appendChild(
          script
        );

        await new Promise<void>(
          (
            resolve,
            reject
          ) => {
            script.onload = () =>
              resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Razorpay SDK failed to load."
                )
              );
          }
        );
      }

      const response =
        await fetch(
          "/api/razorpay/create-order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              amount:
                grandTotal,
            }),
          }
        );

      const razorpayOrder =
        await response.json();

      if (!response.ok) {
        throw new Error(
          razorpayOrder?.error ||
            razorpayOrder?.message ||
            "Razorpay order creation failed"
        );
      }

      if (
        !razorpayOrder?.id ||
        !razorpayOrder?.amount
      ) {
        throw new Error(
          "Razorpay order response is invalid."
        );
      }

      const razorpayKey =
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error(
          "Razorpay key is missing."
        );
      }

      const options = {
        key:
          razorpayKey,

        amount:
          razorpayOrder.amount,

        currency:
          "INR",

        name:
          "Night Now",

        description:
          "Night Now Order",

        order_id:
          razorpayOrder.id,

        prefill: {
          name:
            name.trim(),

          contact:
            `+91${phone}`,
        },

        notes: {
          address:
            address.trim(),

          city:
            city.trim(),

          pincode:
            pincode.trim(),

          coupon:
            appliedCoupon?.code ||
            "",
        },

        theme: {
          color:
            "#facc15",
        },

        handler:
          async (
            paymentResponse: any
          ) => {
            try {
              await saveOrder(
                "Online",
                paymentResponse
              );
            } catch (error) {
              console.error(
                "Order save after payment failed:",
                error
              );

              alert(
                "Payment successful but order saving failed. Please contact support."
              );
            }
          },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.open();
    } catch (error: any) {
      console.error(
        "Online payment error:",
        error
      );

      alert(
        error?.message ||
          "Online payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-black px-3 py-5 pb-10 text-white">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-5 flex items-center justify-between">

          <div>

            <Link
              href="/cart"
              className="text-xs font-bold text-zinc-500"
            >
              ← Back to Cart
            </Link>

            <h1 className="mt-2 text-3xl font-black">
              Checkout
            </h1>

          </div>

          <div className="rounded-2xl bg-yellow-400 px-4 py-2 text-black">

            <p className="text-[9px] font-bold">
              TOTAL
            </p>

            <p className="text-lg font-black">
              ₹{grandTotal}
            </p>

          </div>

        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

          {/* =================================================
              DELIVERY
          ================================================= */}

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="flex items-center justify-between gap-3">

              <div>

                <h2 className="text-lg font-black">
                  Delivery Address
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Where should we deliver?
                </p>

              </div>

              {savedAddresses.length >
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddresses(
                      !showAddresses
                    )
                  }
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black text-black"
                >
                  📍 Saved Addresses
                </button>
              )}

            </div>

            {/* SAVED ADDRESSES */}

            {showAddresses && (
              <div className="mt-4 space-y-2">

                {savedAddresses.map(
                  (item) => (
                    <button
                      key={
                        item.id ||
                        `${item.address}-${item.pincode}`
                      }
                      type="button"
                      onClick={() =>
                        selectAddress(
                          item
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-yellow-400"
                    >

                      <p className="text-xs font-black">
                        {item.label ||
                          "Saved Address"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {item.address}

                        {item.city
                          ? `, ${item.city}`
                          : ""}

                        {item.pincode
                          ? ` - ${item.pincode}`
                          : ""}
                      </p>

                    </button>
                  )
                )}

              </div>
            )}

            {/* ADDRESS FORM */}

            <div className="mt-5 space-y-3">

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Full Name"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        10
                      )
                  )
                }
                placeholder="10 Digit Mobile Number"
                inputMode="numeric"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <textarea
                rows={4}
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                placeholder="House / Flat / Building / Street"
                className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <div className="grid gap-3 sm:grid-cols-2">

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />

                <input
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  placeholder="Pincode"
                  inputMode="numeric"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />

              </div>

            </div>

          </section>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <section className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <h2 className="text-lg font-black">
              Order Summary
            </h2>

            <div className="mt-4 space-y-3">

              {cart.map(
                (
                  item: any,
                  index: number
                ) => {

                  const paidQuantity =
                    Number(
                      item.quantity ||
                        1
                    );

                  const freeQuantity =
                    Number(
                      item.freeQuantity ||
                        0
                    );

                  const totalQuantity =
                    Number(
                      item.totalQuantity ||
                        paidQuantity
                    );

                  const price =
                    Number(
                      item.price ||
                        0
                    );

                  const isOffer =
                    Boolean(
                      item.offerType &&
                        item.offerType !==
                          "NONE"
                    );

                  return (
                    <div
                      key={`${item.id}-${item.variantId || "default"}-${item.offerId || "normal"}-${index}`}
                      className="rounded-2xl bg-zinc-900 p-3"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate text-xs font-black">
                            {item.name ||
                              "Product"}
                          </p>

                          <p className="mt-1 text-[10px] text-zinc-500">
                            Paid Qty:{" "}
                            {paidQuantity}
                          </p>

                        </div>

                        <p className="shrink-0 text-xs font-black">
                          ₹
                          {price *
                            paidQuantity}
                        </p>

                      </div>

                      {/* OFFER */}

                      {isOffer && (
                        <div className="mt-2 rounded-xl border border-yellow-800/50 bg-yellow-950/30 p-2">

                          <p className="text-[10px] font-black text-yellow-400">
                            🎁{" "}
                            {item.offerLabel ||
                              "SPECIAL OFFER"}
                          </p>

                          <p className="mt-1 text-[9px] text-yellow-500">
                            Paid:{" "}
                            {paidQuantity}
                            {" • "}
                            Free:{" "}
                            {freeQuantity}
                            {" • "}
                            Total Qty:{" "}
                            {totalQuantity}
                          </p>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

            {/* =================================================
                COUPON
            ================================================= */}

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🎟️
                </span>

                <div>

                  <p className="text-sm font-black">
                    Apply Coupon
                  </p>

                  <p className="text-[10px] text-zinc-500">
                    Save more on your order
                  </p>

                </div>

              </div>

              {!appliedCoupon ? (
                <>
                  <div className="mt-3 flex gap-2">

                    <input
                      value={
                        couponCode
                      }
                      onChange={(e) => {
                        setCouponCode(
                          e.target.value.toUpperCase()
                        );

                        setCouponError(
                          ""
                        );

                        setCouponMessage(
                          ""
                        );
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          void applyCoupon();
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-3 py-3 text-xs font-black uppercase outline-none focus:border-yellow-400"
                    />

                    <button
                      type="button"
                      disabled={
                        couponLoading
                      }
                      onClick={() =>
                        void applyCoupon()
                      }
                      className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black text-black disabled:opacity-50"
                    >
                      {couponLoading
                        ? "..."
                        : "APPLY"}
                    </button>

                  </div>

                  {couponError && (
                    <p className="mt-2 text-[10px] font-bold text-red-400">
                      ❌{" "}
                      {couponError}
                    </p>
                  )}

                  {couponMessage && (
                    <p className="mt-2 text-[10px] font-bold text-green-400">
                      ✅{" "}
                      {couponMessage}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-green-700/50 bg-green-950/30 p-3">

                  <div>

                    <p className="text-xs font-black text-green-400">
                      {
                        appliedCoupon.code
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-green-500">
                      {
                        appliedCoupon.discount
                      }
                      % OFF • Saved ₹
                      {
                        couponDiscount
                      }
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      removeCoupon
                    }
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-400"
                  >
                    Remove
                  </button>

                </div>
              )}

            </div>

            <div className="my-5 h-px bg-zinc-800" />

            {/* PRICE */}

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">

                <span className="text-zinc-500">
                  Items
                </span>

                <span className="font-bold">
                  ₹{cartTotal}
                </span>

              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between">

                  <span className="text-green-400">
                    Coupon Discount
                  </span>

                  <span className="font-black text-green-400">
                    -₹
                    {couponDiscount}
                  </span>

                </div>
              )}

              <div className="flex justify-between">

                <span className="text-zinc-500">
                  Delivery
                </span>

                <span className="font-bold text-green-400">
                  {delivery === 0
                    ? "FREE"
                    : `₹${delivery}`}
                </span>

              </div>

              <div className="flex justify-between border-t border-zinc-800 pt-3 text-lg">

                <span className="font-black">
                  Total
                </span>

                <span className="font-black text-yellow-400">
                  ₹{grandTotal}
                </span>

              </div>

            </div>

            {/* PAYMENT */}

            <div className="mt-6">

              <p className="mb-3 text-xs font-black text-zinc-500">
                PAYMENT METHOD
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void payOnline()
                }
                className="w-full rounded-2xl bg-yellow-400 py-4 text-sm font-black text-black disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : "💳 Pay Online"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void placeCOD()
                }
                className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-4 text-sm font-black disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : "💵 Cash on Delivery"}
              </button>

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}