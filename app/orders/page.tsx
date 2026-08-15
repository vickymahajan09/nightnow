"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  getOrders,
} from "../services/orderService";

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

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const loadOrders = async (
    uid: string
  ) => {
    try {
      setLoading(true);

      const data =
        (await getOrders()) as Order[];

      const customerOrders =
        data.filter((order) => {
          return (
            order.userId === uid ||
            order.customer?.uid === uid ||
            order.customer?.userId === uid
          );
        });

      customerOrders.sort(
        (a, b) =>
          getTime(b.createdAt) -
          getTime(a.createdAt)
      );

      setOrders(
        customerOrders
      );
    } catch (error) {
      console.error(
        "Customer orders loading error:",
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            setLoggedIn(false);
            setOrders([]);
            setLoading(false);
            return;
          }

          setLoggedIn(true);

          loadOrders(user.uid);
        }
      );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">

        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 font-black">
              Loading your orders...
            </p>

          </div>

        </div>

      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">

        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">
              🔐
            </div>

            <h1 className="mt-4 text-2xl font-black">
              Login Required
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Please login to see your orders.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Login
            </Link>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 md:px-8">

      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <Link
            href="/"
            className="text-xs font-black text-slate-500"
          >
            ← Continue Shopping
          </Link>

          <div className="mt-4">

            <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
              NIGHT NOW
            </p>

            <h1 className="mt-1 text-3xl font-black">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track your orders and delivery status.
            </p>

          </div>

        </div>

        {/* EMPTY */}

        {orders.length === 0 ? (

          <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">
              🛍️
            </div>

            <h2 className="mt-4 text-xl font-black">
              No Orders Yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your placed orders will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="mt-5 space-y-5">

            {orders.map(
              (order) => {

                const status =
                  order.status ||
                  "Pending";

                const total =
                  Number(
                    order.total ??
                      order.subtotal ??
                      0
                  );

                const itemCount =
                  (order.items || [])
                    .reduce(
                      (
                        sum,
                        item
                      ) =>
                        sum +
                        Number(
                          item.quantity ||
                            1
                        ),
                      0
                    );

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm"
                  >

                    {/* ORDER HEADER */}

                    <div className="border-b border-slate-100 p-5">

                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div>

                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            ORDER ID
                          </p>

                          <p className="mt-1 break-all text-sm font-black">
                            #{order.id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              order.createdAt
                            )}
                          </p>

                        </div>

                        <Status
                          status={
                            status
                          }
                        />

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="p-5">

                      <div className="space-y-3">

                        {(order.items ||
                          [])
                          .slice(
                            0,
                            4
                          )
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

                                  {/* IMAGE */}

                                  {item.image ? (
                                    <img
                                      src={
                                        item.image
                                      }
                                      alt={
                                        item.name ||
                                        "Product"
                                      }
                                      className="h-14 w-14 rounded-xl object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                                      📦
                                    </div>
                                  )}

                                  {/* INFO */}

                                  <div className="min-w-0 flex-1">

                                    <p className="truncate text-sm font-black">
                                      {item.name ||
                                        "Product"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      ₹{price} ×{" "}
                                      {quantity}
                                    </p>

                                  </div>

                                  <p className="shrink-0 text-sm font-black">
                                    ₹
                                    {price *
                                      quantity}
                                  </p>

                                </div>
                              );
                            }
                          )}

                      </div>

                      {(order.items ||
                        []).length >
                        4 && (
                        <p className="mt-3 text-center text-xs font-bold text-slate-400">
                          +
                          {(order.items ||
                            []).length -
                            4}{" "}
                          more items
                        </p>
                      )}

                    </div>

                    {/* SUMMARY */}

                    <div className="border-t border-slate-100 p-5">

                      <div className="grid grid-cols-2 gap-3">

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <p className="text-[10px] font-black uppercase text-slate-400">
                            ITEMS
                          </p>

                          <p className="mt-1 font-black">
                            {itemCount}
                          </p>

                        </div>

                        <div className="rounded-2xl bg-green-50 p-4">

                          <p className="text-[10px] font-black uppercase text-green-600">
                            TOTAL
                          </p>

                          <p className="mt-1 text-lg font-black text-green-600">
                            ₹{total}
                          </p>

                        </div>

                      </div>

                      {/* PAYMENT */}

                      <div className="mt-3 rounded-2xl bg-slate-50 p-4">

                        <p className="text-[10px] font-black uppercase text-slate-400">
                          PAYMENT
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {order.paymentMethod ||
                            order.payment ||
                            "COD"}
                        </p>

                      </div>

                      {/* ADDRESS */}

                      {order.customer?.address && (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-4">

                          <p className="text-[10px] font-black uppercase text-slate-400">
                            DELIVERY ADDRESS
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            📍{" "}
                            {
                              order
                                .customer
                                .address
                            }
                          </p>

                          {(
                            order
                              .customer
                              .city ||
                            order
                              .customer
                              .pincode
                          ) && (
                            <p className="mt-1 text-xs text-slate-500">

                              {
                                order
                                  .customer
                                  .city
                              }

                              {order
                                .customer
                                .city &&
                              order
                                .customer
                                .pincode
                                ? " - "
                                : ""}

                              {
                                order
                                  .customer
                                  .pincode
                              }

                            </p>
                          )}

                        </div>
                      )}

                    </div>

                    {/* OPEN ORDER */}

                    <div className="border-t border-slate-100 p-5">

                      <Link
                        href={`/orders/${order.id}`}
                        className="block w-full rounded-2xl bg-black px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        View Order Details →
                      </Link>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

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