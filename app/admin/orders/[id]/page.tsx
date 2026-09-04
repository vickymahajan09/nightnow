"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getOrderById,
  updateOrderStatus,
} from "../../../services/orderService";

type Order = {
  id: string;

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

const STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [orderId, setOrderId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const id = params?.id || "";

        if (!active) {
          return;
        }

        setOrderId(id);

        const data =
          await getOrderById(
            id
          );

        if (active) {
          setOrder(
            data as Order | null
          );
        }
      } catch (error) {
        console.error(
          "Order loading error:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [params]);

  const changeStatus = async (
    newStatus: string
  ) => {
    if (!orderId || saving) {
      return;
    }

    try {
      setSaving(true);

      await updateOrderStatus(
        orderId,
        newStatus
      );

      setOrder(
        (current) =>
          current
            ? {
                ...current,
                status: newStatus,
              }
            : current
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        "Status update failed."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-5xl py-20 text-center font-black">
          Loading order...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center">

          <div className="text-5xl">
            📦
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Order Not Found
          </h1>

          <Link
            href="/admin/orders"
            className="mt-5 inline-block rounded-xl bg-yellow-400 px-5 py-3 font-black text-black"
          >
            ← Back to Orders
          </Link>

        </div>
      </main>
    );
  }

  const customerName =
    order.customer?.name ||
    "Customer";

  const phone =
    order.customer?.phone ||
    "";

  const address =
    order.customer?.address ||
    "";

  const city =
    order.customer?.city ||
    "";

  const pincode =
    order.customer?.pincode ||
    "";

  const status =
    order.status ||
    "Pending";

  const payment =
    order.paymentMethod ||
    order.payment ||
    "COD";

  const delivery =
    Number(
      order.delivery ??
        order.deliveryCharge ??
        0
    );

  const total =
    Number(
      order.total ??
        order.subtotal ??
        0
    );

  const openLocation = () => {
    if (!address) {
      return;
    }

    const query =
      `${address}, ${city}, ${pincode}`;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
      )}`,
      "_blank"
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <section className="rounded-3xl bg-white p-6 shadow-sm">

          <Link
            href="/admin/orders"
            className="text-xs font-black text-slate-500 hover:text-black"
          >
            ← Back to Orders
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-xs font-black text-slate-400">
                ORDER
              </p>

              <h1 className="mt-1 text-3xl font-black">
                #{order.id}
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {formatDate(
                  order.createdAt
                )}
              </p>

            </div>

            <span
              className={`rounded-full border px-4 py-2 text-xs font-black ${statusClasses(
                status
              )}`}
            >
              {status}
            </span>

          </div>

        </section>

        {/* STATUS */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-xl font-black">
                Order Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customer order ka current status.
              </p>

            </div>

            <select
              value={status}
              disabled={saving}
              onChange={(event) =>
                changeStatus(
                  event.target.value
                )
              }
              className={`rounded-xl border px-4 py-3 text-sm font-black outline-none ${statusClasses(
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

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">

            {STATUSES.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    changeStatus(
                      item
                    )
                  }
                  className={`rounded-xl border px-3 py-3 text-[10px] font-black transition ${statusClasses(
                    item
                  )} ${
                    status === item
                      ? "ring-2 ring-black ring-offset-2"
                      : ""
                  } ${
                    saving
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {item}
                </button>
              )
            )}

          </div>

          {saving && (
            <p className="mt-4 text-xs font-bold text-slate-400">
              Updating order status...
            </p>
          )}

        </section>

        {/* CUSTOMER */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Customer
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {/* CUSTOMER DETAILS */}

            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-black text-slate-400">
                CUSTOMER DETAILS
              </p>

              <p className="mt-3 text-lg font-black">
                {customerName}
              </p>

              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="mt-2 inline-block font-bold text-blue-600"
                >
                  📞 {phone}
                </a>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  Phone not available
                </p>
              )}

            </div>

            {/* ADDRESS */}

            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-black text-slate-400">
                DELIVERY LOCATION
              </p>

              <p className="mt-3 font-bold">
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
                  onClick={
                    openLocation
                  }
                  className="mt-4 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
                >
                  📍 Open Location
                </button>
              )}

            </div>

          </div>

        </section>

        {/* ITEMS */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Order Items
          </h2>

          <div className="mt-4 space-y-2">

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
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >

                      <div className="min-w-0">

                        <p className="font-black">
                          {item?.name ||
                            "Product"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ₹{price} ×{" "}
                          {quantity}
                        </p>

                      </div>

                      <p className="shrink-0 font-black">
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
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                No item details available.
              </div>
            )}

          </div>

        </section>

        {/* PAYMENT / TOTAL */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="grid gap-5 sm:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-xs font-black text-slate-400">
                PAYMENT
              </p>

              <p className="mt-2 font-black">
                {payment}
              </p>

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-xs font-black text-slate-400">
                DELIVERY
              </p>

              <p className="mt-2 font-black">
                ₹{delivery}
              </p>

            </div>

            <div className="rounded-2xl bg-green-50 p-4">

              <p className="text-xs font-black text-green-600">
                TOTAL
              </p>

              <p className="mt-2 text-2xl font-black text-green-600">
                ₹{total}
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

function statusClasses(
  status: string
) {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";

    case "Confirmed":
      return "bg-blue-100 text-blue-800 border-blue-300";

    case "Preparing":
      return "bg-purple-100 text-purple-800 border-purple-300";

    case "Out for Delivery":
      return "bg-orange-100 text-orange-800 border-orange-300";

    case "Delivered":
      return "bg-green-100 text-green-800 border-green-300";

    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-300";

    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

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
