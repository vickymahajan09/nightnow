"use client";

import { useEffect, useState } from "react";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../services/orderService";

type Order = {
  id: string;
  name?: string;
  phone?: string;
  address?: string;

  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };

  items?: any[];

  subtotal?: number;
  delivery?: number;
  deliveryCharge?: number;
  total?: number;

  payment?: string;
  paymentMethod?: string;

  status?: string;

  createdAt?: any;
};

const STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadOrders =
    async () => {
      try {
        setLoading(true);

        const data =
          await getOrders();

        const sorted =
          (data as Order[]).sort(
            (a, b) =>
              getTime(
                b.createdAt
              ) -
              getTime(
                a.createdAt
              )
          );

        setOrders(sorted);
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Orders loading failed"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus =
    async (
      id: string,
      status: string
    ) => {
      try {
        await updateOrderStatus(
          id,
          status
        );

        setOrders(
          (current) =>
            current.map(
              (order) =>
                order.id === id
                  ? {
                      ...order,
                      status,
                    }
                  : order
            )
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Status update failed"
        );
      }
    };

  const removeOrder =
    async (
      id: string
    ) => {
      if (
        !confirm(
          "Delete this order?"
        )
      ) {
        return;
      }

      try {
        await deleteOrder(
          id
        );

        setOrders(
          (current) =>
            current.filter(
              (order) =>
                order.id !== id
            )
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Order delete failed"
        );
      }
    };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">

      <div className="mx-auto max-w-7xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Orders
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Customer, address, items aur order status.
          </p>

        </div>

        {loading ? (

          <div className="py-20 text-center font-bold">
            Loading orders...
          </div>

        ) : orders.length ===
          0 ? (

          <div className="mt-5 rounded-3xl bg-white p-10 text-center">
            No orders found.
          </div>

        ) : (

          <div className="mt-5 space-y-5">

            {orders.map(
              (order) => {

                const customerName =
                  order.customer
                    ?.name ||
                  order.name ||
                  "Customer";

                const phone =
                  order.customer
                    ?.phone ||
                  order.phone ||
                  "";

                const address =
                  order.customer
                    ?.address ||
                  order.address ||
                  "";

                const city =
                  order.customer
                    ?.city ||
                  "";

                const pincode =
                  order.customer
                    ?.pincode ||
                  "";

                return (
                  <div
                    key={
                      order.id
                    }
                    className="rounded-3xl bg-white p-5 shadow-sm"
                  >

                    {/* TOP */}

                    <div className="flex flex-col justify-between gap-4 lg:flex-row">

                      <div>

                        <p className="text-xs font-bold text-slate-400">
                          ORDER
                        </p>

                        <h2 className="font-black">
                          #{order.id}
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>

                      </div>

                      <select
                        value={
                          order.status ||
                          "Pending"
                        }
                        onChange={(e) =>
                          changeStatus(
                            order.id,
                            e.target.value
                          )
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none"
                      >

                        {STATUSES.map(
                          (
                            status
                          ) => (
                            <option
                              key={
                                status
                              }
                              value={
                                status
                              }
                            >
                              {status}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* CUSTOMER */}

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">

                      <div className="rounded-2xl bg-slate-50 p-4">

                        <p className="text-xs font-black text-slate-400">
                          CUSTOMER
                        </p>

                        <p className="mt-2 font-black">
                          {customerName}
                        </p>

                        <a
                          href={`tel:${phone}`}
                          className="mt-1 block text-sm font-bold text-blue-600"
                        >
                          📞 {phone}
                        </a>

                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">

                        <p className="text-xs font-black text-slate-400">
                          DELIVERY LOCATION
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          📍 {address}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {city}{" "}
                          {pincode}
                        </p>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${address}, ${city}, ${pincode}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
                        >
                          📍 Open Location
                        </a>

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs font-black text-slate-400">
                        ORDER ITEMS
                      </p>

                      <div className="mt-3 space-y-2">

                        {(order.items ||
                          []).map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={`${item.id || index}-${index}`}
                              className="flex justify-between border-b border-slate-100 py-2 last:border-0"
                            >

                              <span className="text-sm font-bold">
                                {item.name ||
                                  "Product"}{" "}
                                ×{" "}
                                {item.quantity ||
                                  1}
                              </span>

                              <span className="font-black">
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

                    </div>

                    {/* TOTAL */}

                    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                      <div>

                        <p className="text-xs text-slate-400">
                          PAYMENT
                        </p>

                        <p className="font-black">
                          {order.paymentMethod ||
                            order.payment ||
                            "COD"}
                        </p>

                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-xs text-slate-400">
                          TOTAL
                        </p>

                        <p className="text-2xl font-black text-green-600">
                          ₹
                          {order.total ??
                            order.subtotal ??
                            0}
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeOrder(
                          order.id
                        )
                      }
                      className="mt-5 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                    >
                      🗑️ Delete Order
                    </button>

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

  return (
    new Date(value).getTime() ||
    0
  );
}

function formatDate(
  value: any
) {
  const time =
    getTime(value);

  if (!time) return "-";

  return new Date(
    time
  ).toLocaleString(
    "en-IN"
  );
}