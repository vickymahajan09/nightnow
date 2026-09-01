"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import OrderStatusTimeline from "../../components/OrderStatusTimeline";

import { auth } from "../../lib/firebase";

import {
  subscribeToOrder,
  cancelOrderByCustomer,
} from "../../services/orderService";

import { subscribeToPartnerLocation } from "../../services/deliveryTrackingService";

import { onAuthStateChanged } from "firebase/auth";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

type OrderItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: string;

  userId?: string;

  customer?: {
    uid?: string;
    userId?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };

  items?: OrderItem[];

  subtotal?: number;
  delivery?: number;
  deliveryCharge?: number;
  total?: number;

  payment?: string;
  paymentMethod?: string;

  status?: string;

  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: any;

  createdAt?: any;

  trackingToken?: string;
  partnerName?: string;
  partnerPhone?: string;
};

export default function CustomerOrderDetailPage() {
  const params = useParams();

  const orderId = String(params?.id || "");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notAllowed, setNotAllowed] =
    useState(false);

  const [showCancelModal, setShowCancelModal] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState("");

  const [customReason, setCustomReason] =
    useState("");

  const [cancelling, setCancelling] =
    useState(false);

  const [partnerLocation, setPartnerLocation] =
    useState<{ lat: number; lng: number } | null>(null);

  const { isLoaded: mapLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "",
  });

  // =====================================================
  // LIVE PARTNER LOCATION (while Out for Delivery)
  // =====================================================

  useEffect(() => {
    if (!order?.trackingToken) {
      setPartnerLocation(null);
      return;
    }

    const unsubscribe = subscribeToPartnerLocation(
      order.trackingToken,
      (data) => {
        if (data?.location?.lat && data?.location?.lng) {
          setPartnerLocation({
            lat: data.location.lat,
            lng: data.location.lng,
          });
        } else {
          setPartnerLocation(null);
        }
      }
    );

    return () => unsubscribe();
  }, [order?.trackingToken]);

  // =====================================================
  // AUTH + REAL-TIME ORDER
  // =====================================================

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let unsubscribeOrder: (() => void) | null =
      null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            setNotAllowed(true);
            setLoading(false);

            if (unsubscribeOrder) {
              unsubscribeOrder();
              unsubscribeOrder = null;
            }

            return;
          }

          setNotAllowed(false);
          setLoading(true);

          if (unsubscribeOrder) {
            unsubscribeOrder();
          }

          unsubscribeOrder =
            subscribeToOrder(
              orderId,
              (data) => {
                if (!data) {
                  setOrder(null);
                  setLoading(false);
                  return;
                }

                const loadedOrder =
                  data as Order;

                const owner =
                  loadedOrder.userId ||
                  loadedOrder.customer?.uid ||
                  loadedOrder.customer?.userId ||
                  "";

                if (
                  owner &&
                  owner !== user.uid
                ) {
                  setNotAllowed(true);
                  setOrder(null);
                  setLoading(false);
                  return;
                }

                setOrder(loadedOrder);
                setLoading(false);
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeOrder) {
        unsubscribeOrder();
        unsubscribeOrder = null;
      }
    };
  }, [orderId]);

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder = async () => {
    if (!order) {
      return;
    }

    if (!auth.currentUser) {
      alert("Please login again.");
      return;
    }

    const finalReason =
      cancelReason === "Other"
        ? customReason.trim()
        : cancelReason.trim();

    if (!finalReason) {
      alert(
        "Please select a cancellation reason."
      );
      return;
    }

    try {
      setCancelling(true);

      await cancelOrderByCustomer(
        order.id,
        finalReason,
        auth.currentUser.uid
      );

      setShowCancelModal(false);
      setCancelReason("");
      setCustomReason("");
    } catch (error: any) {
      console.error(
        "Customer cancellation error:",
        error
      );

      alert(
        error?.message ||
          "Order cancellation failed."
      );
    } finally {
      setCancelling(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            📦
          </div>

          <p className="mt-4 font-black">
            Loading order...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // LOGIN REQUIRED
  // =====================================================

  if (notAllowed) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please login to view this order.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // ORDER NOT FOUND
  // =====================================================

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            📦
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Order Not Found
          </h1>

          <Link
            href="/orders"
            className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
          >
            ← My Orders
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // ORDER DATA
  // =====================================================

  const status =
    order.status || "Pending";

  const customer =
    order.customer || {};

  const total =
    Number(
      order.total ??
        order.subtotal ??
        0
    );

  const delivery =
    Number(
      order.delivery ??
        order.deliveryCharge ??
        0
    );

  const itemCount =
    (order.items || []).reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );

  const canCancel =
    [
      "Pending",
      "Confirmed",
      "Preparing",
    ].includes(status);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 pb-24 text-slate-900">
      <div className="mx-auto max-w-3xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <Link
            href="/orders"
            className="text-xs font-black text-slate-500"
          >
            ← My Orders
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                ORDER ID
              </p>

              <h1 className="mt-1 break-all text-xl font-black">
                #{order.id}
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <Status status={status} />
          </div>
        </section>

        {/* =====================================================
            ORDER STATUS TIMELINE
        ===================================================== */}

        <section className="mt-4">
          <OrderStatusTimeline
            status={status}
          />
        </section>

        {/* =====================================================
            CUSTOMER CANCEL ORDER
        ===================================================== */}

        {canCancel && (
          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-red-700">
                Want to cancel this order?
              </p>

              <p className="mt-1 text-xs text-red-600">
                You can cancel the order before it is dispatched.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCancelModal(true)
                }
                className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                ❌ Cancel Order
              </button>
            </div>
          </section>
        )}

        {/* =====================================================
            DELIVERY TRACKING
        ===================================================== */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600">
                DELIVERY TRACKING
              </p>

              <h2 className="mt-1 text-lg font-black">
                {status ===
                "Out for Delivery"
                  ? "Your order is on the way 🚚"
                  : status ===
                    "Delivered"
                    ? "Order delivered successfully ✅"
                    : status ===
                      "Cancelled"
                      ? "Order cancelled"
                      : status ===
                        "Packed"
                        ? "Your order is packed 📦"
                        : status ===
                          "Preparing"
                          ? "Your order is being prepared 👨‍🍳"
                          : status ===
                            "Confirmed"
                            ? "Order accepted and being prepared"
                            : "We are processing your order"}
              </h2>
            </div>

            <div className="rounded-2xl bg-yellow-50 px-3 py-2 text-center">
              <p className="text-lg font-black">
                {status ===
                "Out for Delivery"
                  ? "🚚"
                  : status ===
                    "Delivered"
                    ? "✅"
                    : status ===
                      "Cancelled"
                      ? "❌"
                      : "📦"}
              </p>

              <p className="text-[9px] font-black text-yellow-700">
                {status ===
                "Out for Delivery"
                  ? "ON THE WAY"
                  : status ===
                    "Delivered"
                    ? "DELIVERED"
                    : status ===
                      "Cancelled"
                      ? "CANCELLED"
                      : "ORDER"}
              </p>
            </div>
          </div>

          {/* LOCATION */}

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              DELIVERY LOCATION
            </p>

            <p className="mt-2 text-sm font-black">
              📍{" "}
              {customer.address ||
                "Delivery address not available"}
            </p>

            {(customer.city ||
              customer.pincode) && (
              <p className="mt-1 text-xs text-slate-500">
                {customer.city}

                {customer.city &&
                customer.pincode
                  ? " - "
                  : ""}

                {customer.pincode}
              </p>
            )}

            {customer.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${customer.address}, ${
                    customer.city || ""
                  }, ${
                    customer.pincode || ""
                  }`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
              >
                📍 Open Delivery Location
              </a>
            )}
          </div>

          {status ===
            "Out for Delivery" && (
            <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-black text-orange-700">
                🚚 Delivery partner is on the way
              </p>

              {order?.partnerName && (
                <p className="mt-1 text-xs text-orange-600">
                  {order.partnerName}
                  {order.partnerPhone
                    ? ` • ${order.partnerPhone}`
                    : ""}
                </p>
              )}

              {partnerLocation && mapLoaded ? (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <GoogleMap
                    mapContainerStyle={{
                      width: "100%",
                      height: "220px",
                    }}
                    center={partnerLocation}
                    zoom={15}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    <Marker position={partnerLocation} />
                  </GoogleMap>
                </div>
              ) : (
                <p className="mt-1 text-xs text-orange-600">
                  Your delivery address is shown above.
                  Live location abhi start nahi hui — partner
                  ke sharing start karte hi yahan map dikhega.
                </p>
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            DELIVERY DETAILS
        ===================================================== */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">
            Delivery Details
          </h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="font-black">
              {customer.name ||
                "Customer"}
            </p>

            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="mt-2 inline-block text-sm font-bold text-blue-600"
              >
                📞 {customer.phone}
              </a>
            )}

            <p className="mt-3 text-sm font-bold">
              📍{" "}
              {customer.address ||
                "Address not available"}
            </p>

            {(customer.city ||
              customer.pincode) && (
              <p className="mt-1 text-xs text-slate-500">
                {customer.city}

                {customer.city &&
                customer.pincode
                  ? " - "
                  : ""}

                {customer.pincode}
              </p>
            )}
          </div>
        </section>

        {/* =====================================================
            ORDER ITEMS
        ===================================================== */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">
              Order Items
            </h2>

            <span className="text-xs font-bold text-slate-400">
              {itemCount}{" "}
              {itemCount === 1
                ? "item"
                : "items"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(order.items || []).map(
              (item, index) => {
                const quantity =
                  Number(
                    item.quantity || 1
                  );

                const price =
                  Number(
                    item.price || 0
                  );

                return (
                  <div
                    key={`${item.id || index}-${index}`}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                        📦
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-black">
                        {item.name ||
                          "Product"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        ₹{price} ×{" "}
                        {quantity}
                      </p>
                    </div>

                    <p className="font-black">
                      ₹
                      {price *
                        quantity}
                    </p>
                  </div>
                );
              }
            )}

            {(order.items || [])
              .length === 0 && (
              <p className="py-5 text-center text-sm text-slate-400">
                No item details available.
              </p>
            )}
          </div>
        </section>

        {/* =====================================================
            PAYMENT SUMMARY
        ===================================================== */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">
            Payment Summary
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Payment
              </span>

              <span className="font-black">
                {order.paymentMethod ||
                  order.payment ||
                  "COD"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-black">
                ₹
                {Number(
                  order.subtotal ??
                    total
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Delivery
              </span>

              <span className="font-black">
                {delivery === 0
                  ? "FREE"
                  : `₹${delivery}`}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="font-black">
                  Total
                </span>

                <span className="text-xl font-black text-green-600">
                  ₹{total}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            CANCELLATION INFORMATION
        ===================================================== */}

        {status ===
          "Cancelled" && (
          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-red-700">
                ❌ Order Cancelled
              </p>

              {order.cancellationReason && (
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-500">
                    Cancellation Reason
                  </p>

                  <p className="mt-1 text-sm font-bold text-red-700">
                    {order.cancellationReason}
                  </p>
                </div>
              )}

              {order.cancelledBy && (
                <p className="mt-2 text-xs text-red-500">
                  Cancelled by:{" "}
                  {order.cancelledBy ===
                  "customer"
                    ? "Customer"
                    : "Admin"}
                </p>
              )}

              {order.cancelledAt && (
                <p className="mt-1 text-xs text-red-500">
                  Cancelled on:{" "}
                  {formatDate(
                    order.cancelledAt
                  )}
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* =====================================================
          CANCEL ORDER MODAL
      ===================================================== */}

      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">
                    Cancel Order
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Please tell us why you want to cancel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowCancelModal(
                      false
                    )
                  }
                  disabled={
                    cancelling
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500"
                >
                  ×
                </button>
              </div>
            </div>

            {/* MODAL BODY */}

            <div className="p-5">
              <p className="text-sm font-black">
                Select a reason
              </p>

              <div className="mt-3 space-y-2">
                {[
                  "Ordered by mistake",
                  "Changed my mind",
                  "Found a better price",
                  "Delivery taking too long",
                  "Wrong product ordered",
                  "Payment issue",
                  "Other",
                ].map(
                  (reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() =>
                        setCancelReason(
                          reason
                        )
                      }
                      className={`w-full rounded-2xl border p-3 text-left text-sm font-bold transition ${
                        cancelReason ===
                        reason
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="mr-2">
                        {cancelReason ===
                        reason
                          ? "🔴"
                          : "⚪"}
                      </span>

                      {reason}
                    </button>
                  )
                )}
              </div>

              {cancelReason ===
                "Other" && (
                <div className="mt-4">
                  <label className="text-xs font-black text-slate-500">
                    Enter your reason
                  </label>

                  <textarea
                    value={
                      customReason
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomReason(
                        event.target
                          .value
                      )
                    }
                    placeholder="Tell us your reason..."
                    rows={3}
                    maxLength={250}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm font-medium outline-none focus:border-red-400"
                  />

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {
                      customReason.length
                    }
                    /250
                  </p>
                </div>
              )}

              {/* MODAL BUTTONS */}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(
                      false
                    );

                    setCancelReason(
                      ""
                    );

                    setCustomReason(
                      ""
                    );
                  }}
                  disabled={
                    cancelling
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancelOrder
                  }
                  disabled={
                    cancelling ||
                    !cancelReason ||
                    (cancelReason ===
                      "Other" &&
                      !customReason.trim())
                  }
                  className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {cancelling
                    ? "Cancelling..."
                    : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function Status({
  status,
}: {
  status?: string;
}) {
  const value =
    status || "Pending";

  const config =
    getStatusConfig(value);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${config.className}`}
    >
      <span>
        {config.icon}
      </span>

      {value}
    </span>
  );
}

/* =====================================================
   STATUS CONFIG
===================================================== */

function getStatusConfig(
  status: string
) {
  switch (status) {
    case "Pending":
      return {
        icon: "🟡",
        className:
          "border-yellow-300 bg-yellow-100 text-yellow-800",
      };

    case "Confirmed":
      return {
        icon: "🔵",
        className:
          "border-blue-300 bg-blue-100 text-blue-800",
      };

    case "Preparing":
      return {
        icon: "🟣",
        className:
          "border-purple-300 bg-purple-100 text-purple-800",
      };

    case "Packed":
      return {
        icon: "📦",
        className:
          "border-indigo-300 bg-indigo-100 text-indigo-800",
      };

    case "Out for Delivery":
      return {
        icon: "🟠",
        className:
          "border-orange-300 bg-orange-100 text-orange-800",
      };

    case "Delivered":
      return {
        icon: "🟢",
        className:
          "border-green-300 bg-green-100 text-green-800",
      };

    case "Cancelled":
      return {
        icon: "🔴",
        className:
          "border-red-300 bg-red-100 text-red-800",
      };

    default:
      return {
        icon: "⚪",
        className:
          "border-slate-300 bg-slate-100 text-slate-700",
      };
  }
}

/* =====================================================
   DATE
===================================================== */

function getTime(value: any) {
  if (!value) {
    return 0;
  }

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate().getTime();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return (
      value.seconds * 1000
    );
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDate(
  value: any
) {
  const time =
    getTime(value);

  if (!time) {
    return "-";
  }

  return new Date(
    time
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}