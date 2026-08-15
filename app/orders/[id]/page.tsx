"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { auth } from "../../lib/firebase";

import {
  getOrderById,
} from "../../services/orderService";

import {
  onAuthStateChanged,
} from "firebase/auth";

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

  createdAt?: any;
};

export default function CustomerOrderDetailPage() {
  const params = useParams();

  const orderId =
    String(params?.id || "");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notAllowed, setNotAllowed] =
    useState(false);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            setNotAllowed(true);
            setLoading(false);
            return;
          }

          try {
            const data =
              await getOrderById(
                orderId
              );

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
              setLoading(false);
              return;
            }

            setOrder(
              loadedOrder
            );
          } catch (error) {
            console.error(
              "Order detail error:",
              error
            );
          } finally {
            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, [orderId]);

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

  const status =
    order.status ||
    "Pending";

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 pb-24 text-slate-900">

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

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

            <Status
              status={status}
            />

          </div>

        </section>

        {/* STATUS */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-lg font-black">
            Order Status
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

            <StatusStep
              title="Pending"
              active={
                status ===
                "Pending"
              }
              icon="🟡"
            />

            <StatusStep
              title="Confirmed"
              active={
                status ===
                  "Confirmed" ||
                status ===
                  "Preparing" ||
                status ===
                  "Out for Delivery" ||
                status ===
                  "Delivered"
              }
              icon="🔵"
            />

            <StatusStep
              title="Preparing"
              active={
                status ===
                  "Preparing" ||
                status ===
                  "Out for Delivery" ||
                status ===
                  "Delivered"
              }
              icon="🟣"
            />

            <StatusStep
              title="Out for Delivery"
              active={
                status ===
                  "Out for Delivery" ||
                status ===
                  "Delivered"
              }
              icon="🟠"
            />

            <StatusStep
              title="Delivered"
              active={
                status ===
                "Delivered"
              }
              icon="🟢"
            />

            <StatusStep
              title="Cancelled"
              active={
                status ===
                "Cancelled"
              }
              icon="🔴"
            />

          </div>

        </section>

        {/* CUSTOMER */}

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

        {/* ITEMS */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-black">
              Order Items
            </h2>

            <span className="text-xs font-bold text-slate-400">
              {itemCount} items
            </span>

          </div>

          <div className="mt-4 space-y-3">

            {(order.items || [])
              .map(
                (
                  item,
                  index
                ) => {

                  const quantity =
                    Number(
                      item.quantity ||
                        1
                    );

                  const price =
                    Number(
                      item.price ||
                        0
                    );

                  return (
                    <div
                      key={`${item.id || index}-${index}`}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                    >

                      {item.image ? (
                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          className="h-16 w-16 rounded-xl object-cover"
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

          </div>

        </section>

        {/* PAYMENT */}

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
                Delivery
              </span>

              <span className="font-black">
                ₹{delivery}
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

      </div>

    </main>
  );
}

/* =====================================================
   STATUS
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
   STATUS STEP
===================================================== */

function StatusStep({
  title,
  active,
  icon,
}: {
  title: string;
  active: boolean;
  icon: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        active
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-slate-50 opacity-50"
      }`}
    >

      <div className="text-xl">
        {icon}
      </div>

      <p className="mt-1 text-xs font-black">
        {title}
      </p>

      {active && (
        <p className="mt-1 text-[9px] font-bold text-green-600">
          Active
        </p>
      )}

    </div>
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

function getTime(
  value: any
) {
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
  ).toLocaleString("en-IN");
}