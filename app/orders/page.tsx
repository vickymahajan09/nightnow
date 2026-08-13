"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getOrders,
} from "../services/orderService";

type Order = {
  id: string;
  name?: string;
  phone?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };
  items?: any[];
  total?: number;
  subtotal?: number;
  delivery?: number;
  deliveryCharge?: number;
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

  const loadOrders = async () => {
    try {
      const data =
        await getOrders();

      const profile =
        JSON.parse(
          localStorage.getItem(
            "nightnow_customer_profile"
          ) || "{}"
        );

      const phone =
        profile?.phone || "";

      let result =
        data as Order[];

      if (phone) {
        result =
          result.filter(
            (order) => {
              const orderPhone =
                order.customer?.phone ||
                order.phone ||
                "";

              return (
                String(
                  orderPhone
                ) === String(phone)
              );
            }
          );
      }

      result.sort(
        (a, b) =>
          getTime(
            b.createdAt
          ) -
          getTime(
            a.createdAt
          )
      );

      setOrders(result);
    } catch (error) {
      console.error(
        "Orders loading failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">

      <div className="mx-auto max-w-5xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW
          </p>

          <h1 className="mt-1 text-3xl font-black">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Aapke orders ki history.
          </p>

        </div>

        {loading ? (

          <div className="py-20 text-center font-bold">
            Loading orders...
          </div>

        ) : orders.length ===
          0 ? (

          <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">
              🛒
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No Orders Yet
            </h2>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-black"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="mt-5 space-y-4">

            {orders.map(
              (order) => (
                <div
                  key={
                    order.id
                  }
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >

                  <div className="flex flex-col justify-between gap-3 md:flex-row">

                    <div>

                      <p className="text-xs font-bold text-slate-400">
                        ORDER ID
                      </p>

                      <p className="font-black">
                        #{order.id.slice(
                          0,
                          8
                        )}
                      </p>

                    </div>

                    <Status
                      status={
                        order.status
                      }
                    />

                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">

                    {(order.items ||
                      []).map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.id || index}-${index}`}
                          className="flex justify-between border-b border-slate-200 py-2 last:border-0"
                        >

                          <span className="text-sm font-bold">
                            {item.name ||
                              "Product"}{" "}
                            ×{" "}
                            {item.quantity ||
                              1}
                          </span>

                          <span className="text-sm font-black">
                            ₹
                            {Number(
                              item.price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  1
                              )}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">

                    <div>
                      <p className="text-xs text-slate-400">
                        Total
                      </p>
                      <p className="font-black">
                        ₹
                        {order.total ??
                          order.subtotal ??
                          0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Payment
                      </p>
                      <p className="font-black">
                        {order.paymentMethod ||
                          order.payment ||
                          "COD"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Date
                      </p>
                      <p className="font-black">
                        {formatDate(
                          order.createdAt
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        )}

      </div>

    </main>
  );
}

function Status({
  status,
}: {
  status?: string;
}) {
  const value =
    status ||
    "Pending";

  const color =
    value === "Delivered"
      ? "bg-green-100 text-green-700"
      : value === "Cancelled"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-black ${color}`}
    >
      {value}
    </span>
  );
}

function getTime(
  value: any
) {
  if (!value) return 0;

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    value?.seconds
  ) {
    return (
      value.seconds * 1000
    );
  }

  return new Date(
    value
  ).getTime() || 0;
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
    "en-IN"
  );
}