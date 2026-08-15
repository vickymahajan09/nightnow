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
  "Packed",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const data = await getOrders();

      const sorted = (
        data as Order[]
      ).sort(
        (a, b) =>
          getTime(b.createdAt) -
          getTime(a.createdAt)
      );

      setOrders(sorted);
    } catch (error) {
      console.error(
        "Orders loading error:",
        error
      );

      alert("Orders loading failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (
    id: string,
    status: string
  ) => {
    try {
      await updateOrderStatus(
        id,
        status
      );

      setOrders((current) =>
        current.map((order) =>
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
        "Status update error:",
        error
      );

      alert(
        "Status update failed"
      );
    }
  };

  const removeOrder = async (
    id: string
  ) => {
    if (
      !window.confirm(
        "Delete this order?"
      )
    ) {
      return;
    }

    try {
      await deleteOrder(id);

      setOrders((current) =>
        current.filter(
          (order) =>
            order.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Order delete error:",
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

        {/* HEADER */}

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

        {/* STATUS SUMMARY */}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          {STATUSES.map(
            (status) => {
              const count =
                orders.filter(
                  (order) =>
                    normalizeStatus(
                      order.status
                    ) === status
                ).length;

              return (
                <div
                  key={status}
                  className={`rounded-2xl border p-4 ${getStatusBoxClass(
                    status
                  )}`}
                >

                  <p className="text-[10px] font-black">
                    {status}
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {count}
                  </p>

                </div>
              );
            }
          )}

        </div>

        {/* ORDERS */}

        {loading ? (

          <div className="mt-5 rounded-3xl bg-white py-20 text-center font-bold">
            Loading orders...
          </div>

        ) : orders.length === 0 ? (

          <div className="mt-5 rounded-3xl bg-white p-10 text-center">
            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 font-black">
              No orders found.
            </p>
          </div>

        ) : (

          <div className="mt-5 space-y-5">

            {orders.map(
              (order) => {

                const customerName =
                  order.customer?.name ||
                  order.name ||
                  "Customer";

                const phone =
                  order.customer?.phone ||
                  order.phone ||
                  "";

                const address =
                  order.customer?.address ||
                  order.address ||
                  "";

                const city =
                  order.customer?.city ||
                  "";

                const pincode =
                  order.customer?.pincode ||
                  "";

                const status =
                  normalizeStatus(
                    order.status
                  );

                const total =
                  Number(
                    order.total ??
                      order.subtotal ??
                      0
                  );

                const payment =
                  order.paymentMethod ||
                  order.payment ||
                  "COD";

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl bg-white p-5 shadow-sm"
                  >

                    {/* TOP */}

                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                      <div>

                        <p className="text-xs font-bold text-slate-400">
                          ORDER
                        </p>

                        <h2 className="mt-1 font-black">
                          #{order.id}
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>

                      </div>

                      {/* STATUS */}

                      <select
                        value={status}
                        onChange={(event) =>
                          changeStatus(
                            order.id,
                            event.target.value
                          )
                        }
                        className={`h-11 rounded-xl border px-4 text-sm font-black outline-none ${getStatusSelectClass(
                          status
                        )}`}
                      >

                        {STATUSES.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* CUSTOMER + LOCATION */}

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">

                      {/* CUSTOMER */}

                      <div className="rounded-2xl bg-slate-50 p-4">

                        <p className="text-xs font-black text-slate-400">
                          CUSTOMER
                        </p>

                        <p className="mt-2 font-black">
                          {customerName}
                        </p>

                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="mt-1 inline-block text-sm font-bold text-blue-600"
                          >
                            📞 {phone}
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            Phone not available
                          </p>
                        )}

                      </div>

                      {/* LOCATION */}

                      <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">

                        <p className="text-xs font-black text-slate-400">
                          DELIVERY LOCATION
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          📍{" "}
                          {address ||
                            "Address not available"}
                        </p>

                        {(city ||
                          pincode) && (
                          <p className="mt-1 text-sm text-slate-500">
                            {city}

                            {city &&
                            pincode
                              ? " - "
                              : ""}

                            {pincode}
                          </p>
                        )}

                        {address && (
                          <button
                            type="button"
                            onClick={() => {
                              const query =
                                `${address}, ${city}, ${pincode}`;

                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  query
                                )}`,
                                "_blank"
                              );
                            }}
                            className="mt-3 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
                          >
                            📍 Open Location
                          </button>
                        )}

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs font-black text-slate-400">
                        ORDER ITEMS
                      </p>

                      <div className="mt-3 space-y-2">

                        {(order.items || [])
                          .map(
                            (
                              item,
                              index
                            ) => {

                              const quantity =
                                Number(
                                  item?.quantity ||
                                    1
                                );

                              const price =
                                Number(
                                  item?.price ||
                                    0
                                );

                              return (
                                <div
                                  key={`${item?.id || index}-${index}`}
                                  className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-0"
                                >

                                  <span className="text-sm font-bold">
                                    {item?.name ||
                                      "Product"}{" "}
                                    ×{" "}
                                    {quantity}
                                  </span>

                                  <span className="font-black">
                                    ₹
                                    {price *
                                      quantity}
                                  </span>

                                </div>
                              );
                            }
                          )}

                        {(order.items ||
                          []).length ===
                          0 && (
                          <p className="py-3 text-sm text-slate-400">
                            No item details available.
                          </p>
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
                          {payment}
                        </p>

                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-xs text-slate-400">
                          TOTAL
                        </p>

                        <p className="text-2xl font-black text-green-600">
                          ₹{total}
                        </p>

                      </div>

                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeOrder(
                          order.id
                        )
                      }
                      className="mt-5 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100"
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

/* ==========================================
   STATUS NORMALIZE
========================================== */

function normalizeStatus(
  status?: string
) {
  if (!status) {
    return "Pending";
  }

  if (status === "Packed") {
    return "Confirmed";
  }

  return status;
}

/* ==========================================
   DATE
========================================== */

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
    return value.seconds * 1000;
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

/* ==========================================
   STATUS COLORS
========================================== */

function getStatusBoxClass(
  status: string
) {
  if (status === "Pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800";
  }

  if (status === "Confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "Packed") {
    return "border-purple-200 bg-purple-50 text-purple-800";
  }

  if (
    status ===
    "Out for Delivery"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (status === "Delivered") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "Cancelled") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function getStatusSelectClass(
  status: string
) {
  if (status === "Pending") {
    return "border-yellow-300 bg-yellow-100 text-yellow-800";
  }

  if (status === "Confirmed") {
    return "border-blue-300 bg-blue-100 text-blue-800";
  }

  if (status === "Packed") {
    return "border-purple-300 bg-purple-100 text-purple-800";
  }

  if (
    status ===
    "Out for Delivery"
  ) {
    return "border-orange-300 bg-orange-100 text-orange-800";
  }

  if (status === "Delivered") {
    return "border-green-300 bg-green-100 text-green-800";
  }

  if (status === "Cancelled") {
    return "border-red-300 bg-red-100 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}