"use client";

import { useEffect, useState } from "react";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../services/orderService";

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState("");

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const data =
        await getOrders();

      // Latest orders first
      data.sort(
        (a: any, b: any) => {
          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;
        }
      );

      setOrders(data);
    } catch (error) {
      console.error(
        "Orders loading failed:",
        error
      );

      alert(
        "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHANGE STATUS
  // ==========================================

  const changeStatus = async (
    id: string,
    status: string
  ) => {
    try {
      setUpdatingId(id);

      await updateOrderStatus(
        id,
        status
      );

      setOrders(
        (old) =>
          old.map(
            (order) =>
              order.id === id
                ? {
                    ...order,
                    status,
                  }
                : order
          )
      );

      // Customer notification is
      // automatically created inside
      // updateOrderStatus()

    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );

      alert(
        "Failed to update order."
      );
    } finally {
      setUpdatingId("");
    }
  };

  // ==========================================
  // ACCEPT & PACK
  // ==========================================

  const acceptOrder = async (
    order: any
  ) => {
    const confirmed =
      confirm(
        `Accept Order #${order.id.slice(
          0,
          8
        )} and mark it as Packed?`
      );

    if (!confirmed) {
      return;
    }

    await changeStatus(
      order.id,
      "Packed"
    );
  };

  // ==========================================
  // DELETE ORDER
  // ==========================================

  const removeOrder = async (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this order permanently?"
      )
    ) {
      return;
    }

    try {
      await deleteOrder(id);

      setOrders(
        (old) =>
          old.filter(
            (order) =>
              order.id !== id
          )
      );
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      alert(
        "Failed to delete order."
      );
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400";

      case "Confirmed":
      case "Packed":
        return "bg-blue-500/20 text-blue-400";

      case "Preparing":
        return "bg-purple-500/20 text-purple-400";

      case "Out for Delivery":
        return "bg-orange-500/20 text-orange-400";

      case "Delivered":
        return "bg-green-500/20 text-green-400";

      case "Cancelled":
        return "bg-red-500/20 text-red-400";

      default:
        return "bg-zinc-700 text-zinc-300";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <div className="text-center">

          <div className="text-5xl">
            📦
          </div>

          <p className="mt-4 font-bold text-yellow-400">
            Loading Orders...
          </p>

        </div>

      </main>
    );
  }

  // ==========================================
  // ADMIN ORDERS
  // ==========================================

  return (
    <main className="min-h-screen bg-black p-5 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm text-zinc-500">
              Night Now Admin
            </p>

            <h1 className="text-4xl font-black text-yellow-400">
              Orders
            </h1>

            <p className="mt-1 text-zinc-400">
              Total Orders:{" "}
              {orders.length}
            </p>

          </div>

          <button
            onClick={loadOrders}
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold hover:bg-zinc-700"
          >
            🔄 Refresh
          </button>

        </div>

        {/* ================================= */}
        {/* ORDERS */}
        {/* ================================= */}

        <div className="mt-8 space-y-5">

          {orders.map(
            (order: any) => {

              const status =
                order.status ||
                "Pending";

              const isUpdating =
                updatingId ===
                order.id;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                >

                  {/* TOP */}

                  <div className="p-5">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* CUSTOMER */}

                      <div>

                        <p className="font-black text-yellow-400">
                          Order #
                          {order.id.slice(
                            0,
                            8
                          )}
                        </p>

                        <p className="mt-3 text-lg font-bold">
                          {order.customer?.name ||
                            order.customerName ||
                            "Customer"}
                        </p>

                        {(order.customer?.phone ||
                          order.customerPhone) && (
                          <p className="mt-1 text-sm text-zinc-400">
                            📱{" "}
                            {order.customer?.phone ||
                              order.customerPhone}
                          </p>
                        )}

                        {order.customer
                          ?.email && (
                          <p className="text-sm text-zinc-500">
                            ✉️{" "}
                            {
                              order.customer
                                .email
                            }
                          </p>
                        )}

                      </div>

                      {/* PRICE / STATUS */}

                      <div className="lg:text-right">

                        <p className="text-3xl font-black text-yellow-400">
                          ₹
                          {Number(
                            order.total ||
                              0
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">

                          <span
                            className={`rounded-lg px-3 py-1 text-xs font-black ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* ================================= */}
                  {/* ACCEPT BUTTON */}
                  {/* ================================= */}

                  {status ===
                    "Pending" && (
                    <div className="border-y border-zinc-800 bg-zinc-950 p-4">

                      <button
                        onClick={() =>
                          acceptOrder(
                            order
                          )
                        }
                        disabled={
                          isUpdating
                        }
                        className="w-full rounded-xl bg-green-500 py-3 font-black text-black transition hover:bg-green-400 disabled:opacity-50"
                      >
                        {isUpdating
                          ? "Accepting..."
                          : "✓ Accept & Pack Order"}
                      </button>

                    </div>
                  )}

                  {/* ================================= */}
                  {/* STATUS CONTROL */}
                  {/* ================================= */}

                  <div className="border-b border-zinc-800 bg-zinc-950 p-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <p className="text-sm font-bold text-zinc-400">
                        Update Order Status
                      </p>

                      <select
                        value={status}
                        disabled={
                          isUpdating
                        }
                        onChange={(e) =>
                          changeStatus(
                            order.id,
                            e.target.value
                          )
                        }
                        className="rounded-xl bg-zinc-800 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-yellow-400"
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Packed">
                          Packed
                        </option>

                        <option value="Out for Delivery">
                          Out for Delivery
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* ================================= */}
                  {/* ADDRESS */}
                  {/* ================================= */}

                  <div className="p-5">

                    <div className="rounded-xl bg-zinc-800 p-4">

                      <p className="text-xs font-bold uppercase text-zinc-500">
                        Delivery Address
                      </p>

                      <p className="mt-2 font-semibold">
                        {order.customer?.address ||
                          order.address ||
                          "Address not available"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">

                        {order.customer?.city ||
                          order.city ||
                          ""}

                        {" "}

                        {order.customer?.pincode ||
                          order.pincode ||
                          ""}

                      </p>

                    </div>

                  </div>

                  {/* ================================= */}
                  {/* ITEMS */}
                  {/* ================================= */}

                  <div className="px-5 pb-5">

                    <h2 className="mb-4 font-black">
                      Order Items
                    </h2>

                    <div className="space-y-3">

                      {order.items?.map(
                        (
                          item: any,
                          index: number
                        ) => (

                          <div
                            key={
                              item.id ||
                              index
                            }
                            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              {item.image && (
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.name
                                  }
                                  className="h-14 w-14 rounded-lg bg-white object-contain"
                                />
                              )}

                              <div className="min-w-0">

                                <p className="truncate font-bold">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="mt-1 text-sm text-zinc-400">
                                  {
                                    item.quantity
                                  }{" "}
                                  × ₹
                                  {
                                    item.price
                                  }
                                </p>

                              </div>

                            </div>

                            <p className="shrink-0 font-black">
                              ₹
                              {Number(
                                item.price ||
                                  0
                              ) *
                                Number(
                                  item.quantity ||
                                    0
                                )}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                  {/* ================================= */}
                  {/* BOTTOM */}
                  {/* ================================= */}

                  <div className="flex flex-col gap-3 border-t border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-zinc-400">
                      Payment:{" "}
                      <span className="font-bold text-white">
                        {order.paymentMethod ||
                          "COD"}
                      </span>
                    </p>

                    <button
                      onClick={() =>
                        removeOrder(
                          order.id
                        )
                      }
                      className="rounded-xl bg-red-600 px-5 py-3 font-bold hover:bg-red-500"
                    >
                      🗑 Delete Order
                    </button>

                  </div>

                </div>
              );
            }
          )}

          {/* NO ORDERS */}

          {orders.length ===
            0 && (
            <div className="rounded-2xl bg-zinc-900 p-12 text-center">

              <div className="text-6xl">
                📦
              </div>

              <p className="mt-4 text-xl font-black">
                No Orders Found
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                New customer orders will appear here.
              </p>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}