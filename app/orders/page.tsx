"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  subscribeToOrders,
} from "../services/orderService";

/* =====================================================
   TYPES
===================================================== */

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
  };

  items?: OrderItem[];

  total?: number;
  subtotal?: number;

  delivery?: number;
  deliveryCharge?: number;

  status?: string;

  paymentMethod?: string;
  payment?: string;

  createdAt?: any;
};

/* =====================================================
   DATE HELPERS
===================================================== */

function orderTime(
  value: any
) {
  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return new Date(
      value.toMillis()
    );
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return new Date(
      value.seconds * 1000
    );
  }

  const date =
    new Date(
      value || 0
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatDate(
  value: any
) {
  const date =
    orderTime(value);

  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleString(
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

/* =====================================================
   STATUS STYLE
===================================================== */

function getStatusClass(
  status: string
) {
  const value =
    status
      .toLowerCase()
      .trim();

  if (
    value.includes(
      "delivered"
    )
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    value.includes(
      "cancel"
    )
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    value.includes("out") ||
    value.includes(
      "delivery"
    )
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    value.includes(
      "process"
    ) ||
    value.includes(
      "confirm"
    )
  ) {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-yellow-100 text-yellow-800";
}

/* =====================================================
   PAGE
===================================================== */

export default function CustomerOrdersPage() {
  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loggedOut,
    setLoggedOut,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    retryKey,
    setRetryKey,
  ] = useState(0);

  /* ===================================================
     AUTH + ORDERS
     Single auth listener
     No duplicate subscription
     No artificial 10s timeout
  =================================================== */

  useEffect(() => {
    let active = true;

    let unsubscribeOrders:
      | (() => void)
      | null = null;

    const cleanupOrders =
      () => {
        if (
          unsubscribeOrders
        ) {
          unsubscribeOrders();

          unsubscribeOrders =
            null;
        }
      };

    const startOrders = (
      user: any
    ) => {
      if (!active) {
        return;
      }

      cleanupOrders();

      setLoading(true);
      setError("");
      setLoggedOut(false);

      try {
        unsubscribeOrders =
          subscribeToOrders(
            (
              nextOrders
            ) => {
              if (!active) {
                return;
              }

              const safeOrders =
                Array.isArray(
                  nextOrders
                )
                  ? (
                      nextOrders as Order[]
                    )
                  : [];

              setOrders(
                safeOrders
              );

              setLoading(false);
              setError("");
            }
          );
      } catch (err) {
        console.error(
          "Orders subscription error:",
          err
        );

        if (!active) {
          return;
        }

        setOrders([]);
        setLoading(false);

        setError(
          "Orders load nahi ho paaye. Please try again."
        );
      }
    };

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!active) {
            return;
          }

          if (!user) {
            cleanupOrders();

            setOrders([]);
            setLoggedOut(true);
            setLoading(false);
            setError("");

            return;
          }

          startOrders(user);
        },
        (authError) => {
          console.error(
            "Auth listener error:",
            authError
          );

          if (!active) {
            return;
          }

          cleanupOrders();

          setOrders([]);
          setLoading(false);

          setError(
            "Login session verify nahi ho paayi."
          );
        }
      );

    return () => {
      active = false;

      unsubscribeAuth();

      cleanupOrders();
    };
  }, [retryKey]);

  /* ===================================================
     RETRY
  =================================================== */

  const retry = () => {
    setError("");
    setLoading(true);

    setRetryKey(
      (value) =>
        value + 1
    );
  };

  /* ===================================================
     LOGIN REQUIRED
  =================================================== */

  if (loggedOut) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 pb-24 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please login to view your
            order history.
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

  /* ===================================================
     MAIN
  =================================================== */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 pb-24 text-slate-900">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <Link
              href="/"
              className="text-xs font-black text-slate-500"
            >
              ← Home
            </Link>

            <h1 className="mt-2 text-2xl font-black">
              My Orders
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Your complete order history
            </p>
          </div>

          <Link
            href="/cart"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
          >
            Cart
          </Link>
        </div>

        {/* ERROR */}

        {error &&
          !loading && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-yellow-400" />

            <p className="mt-4 text-sm font-black">
              Loading orders...
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Please wait...
            </p>
          </div>
        ) : orders.length === 0 ? (

          /* NO ORDERS */

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h2 className="mt-4 text-xl font-black">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your successfully placed
              orders will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Start Shopping
            </Link>
          </div>

        ) : (

          /* ORDER LIST */

          <div className="space-y-3">
            {orders.map(
              (order) => {
                const items =
                  Array.isArray(
                    order.items
                  )
                    ? order.items
                    : [];

                const total =
                  Number(
                    order.total ??
                      order.subtotal ??
                      0
                  );

                const status =
                  order.status ||
                  "Pending";

                const itemCount =
                  items.reduce(
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
                  <Link
                    key={
                      order.id
                    }
                    href={`/orders/${order.id}`}
                    className="block rounded-3xl bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.995]"
                  >

                    {/* ORDER HEADER */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400">
                          ORDER #
                          {order.id
                            .slice(
                              0,
                              10
                            )
                            .toUpperCase()}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={`
                          shrink-0
                          rounded-full
                          px-3
                          py-1
                          text-[10px]
                          font-black
                          ${getStatusClass(
                            status
                          )}
                        `}
                      >
                        {status}
                      </span>
                    </div>

                    {/* PRODUCT IMAGES */}

                    <div className="mt-4 flex items-center gap-2 overflow-hidden">
                      {items
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={`${order.id}-${item.id || index}`}
                              className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-50"
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
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  📦
                                </div>
                              )}
                            </div>
                          )
                        )}

                      {items.length >
                        4 && (
                        <span className="text-[10px] font-black text-slate-400">
                          +
                          {items.length -
                            4}
                        </span>
                      )}
                    </div>

                    {/* ORDER FOOTER */}

                    <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-3">
                      <div>
                        <p className="text-[10px] text-slate-400">
                          {itemCount}{" "}
                          item
                          {itemCount ===
                          1
                            ? ""
                            : "s"}

                          {" · "}

                          {order.paymentMethod ||
                            order.payment ||
                            "Payment"}
                        </p>

                        <p className="mt-1 text-base font-black">
                          ₹
                          {Math.round(
                            total
                          )}
                        </p>
                      </div>

                      <span className="text-xs font-black text-yellow-600">
                        View Order →
                      </span>
                    </div>

                  </Link>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}