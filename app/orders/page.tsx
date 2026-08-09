"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { getOrders } from "../services/orderService";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        try {
          const data = await getOrders();

          const userEmail =
            currentUser.email?.trim().toLowerCase();

          const myOrders = data.filter((order: any) => {
            const orderEmail =
              order.customer?.email
                ?.trim()
                .toLowerCase();

            return (
              order.userId === currentUser.uid ||
              (orderEmail &&
                orderEmail === userEmail)
            );
          });

          setOrders(myOrders);
        } catch (error) {
          console.error(
            "Failed to load orders:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-yellow-400">
          Loading Orders...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-md">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-3xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-zinc-400">
            Login to see your orders.
          </p>

          <Link href="/login">
            <button className="mt-6 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black">
              Login
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-yellow-400">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              {user.email}
            </p>
          </div>

          <Link href="/">
            <button className="rounded-lg bg-zinc-800 px-4 py-2">
              Home
            </button>
          </Link>
        </div>

        {/* NO ORDERS */}

        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-zinc-900 p-10 text-center">

            <div className="text-6xl">
              📦
            </div>

            <h2 className="mt-4 text-2xl font-bold">
              No Orders Yet
            </h2>

            <p className="mt-2 text-zinc-400">
              Your orders will appear here.
            </p>

            <Link href="/">
              <button className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black">
                Start Shopping
              </button>
            </Link>

          </div>
        ) : (

          /* ORDERS */

          <div className="mt-8 space-y-5">

            {orders.map((order: any) => (

              <div
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
              >

                {/* ORDER HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>
                    <p className="font-bold">
                      Order #{order.id?.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      {order.customer?.name}
                    </p>

                    {order.createdAt && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Order placed
                      </p>
                    )}
                  </div>

                  <div className="text-right">

                    <p className="text-xl font-black text-yellow-400">
                      ₹{Number(order.total || 0)}
                    </p>

                    <span className="text-sm font-bold text-green-400">
                      {order.status || "Pending"}
                    </span>

                  </div>

                </div>

                {/* ITEMS */}

                <div className="mt-5 space-y-3">

                  {Array.isArray(order.items) &&
                    order.items.map(
                      (item: any, index: number) => (

                        <div
                          key={
                            item.id ||
                            `${order.id}-${index}`
                          }
                          className="flex justify-between border-b border-zinc-800 pb-3"
                        >

                          <div>

                            <p className="font-semibold">
                              {item.name ||
                                "Product"}
                            </p>

                            <p className="text-sm text-zinc-400">
                              {Number(
                                item.quantity || 1
                              )}{" "}
                              × ₹
                              {Number(
                                item.price || 0
                              )}
                            </p>

                          </div>

                          <p className="font-bold">
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

                </div>

                {/* ADDRESS */}

                <div className="mt-5 rounded-xl bg-zinc-800 p-4">

                  <p className="text-sm text-zinc-400">
                    Delivery Address
                  </p>

                  <p className="mt-1">
                    {order.customer?.address ||
                      "-"}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {order.customer?.city || ""}{" "}
                    {order.customer?.pincode || ""}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    Phone:{" "}
                    {order.customer?.phone || "-"}
                  </p>

                </div>

                {/* PAYMENT */}

                <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-zinc-400">

                  <span>
                    Payment:{" "}
                    <span className="font-bold text-white">
                      {order.paymentMethod ||
                        "COD"}
                    </span>
                  </span>

                  {order.coupon && (
                    <span className="text-green-400">
                      Coupon: {order.coupon}
                    </span>
                  )}

                </div>

                {/* VIEW DETAILS */}

                <Link
                  href={`/orders/${order.id}`}
                >
                  <button className="mt-5 w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300">
                    View Order Details
                  </button>
                </Link>

              </div>

            ))}

          </div>

        )}

      </div>
    </main>
  );
}