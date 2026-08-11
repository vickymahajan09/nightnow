"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../services/orderService";

const statuses = [
  "Pending",
  "Confirmed",
  "Processing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Failed to load orders");
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
      await updateOrderStatus(id, status);

      setOrders((old) =>
        old.map((item) =>
          item.id === id
            ? { ...item, status }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update order");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this order?")) return;

    try {
      await deleteOrder(id);

      setOrders((old) =>
        old.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete order");
    }
  };

  const filteredOrders = orders.filter(
    (order: any) => {
      const text = search.trim().toLowerCase();

      const matchesSearch =
        !text ||
        String(order.id || "")
          .toLowerCase()
          .includes(text) ||
        String(order.customer?.name || "")
          .toLowerCase()
          .includes(text) ||
        String(order.customer?.phone || "")
          .toLowerCase()
          .includes(text) ||
        String(order.customer?.email || "")
          .toLowerCase()
          .includes(text);

      const matchesStatus =
        statusFilter === "All" ||
        (order.status || "Pending") ===
          statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  return (
    <main className="min-h-screen bg-black p-5 text-white md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Orders
            </h1>

            <p className="mt-1 text-zinc-500">
              Showing {filteredOrders.length} of{" "}
              {orders.length} Orders
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold hover:bg-zinc-700"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search order, name, phone, email..."
            className="rounded-xl bg-zinc-900 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl bg-zinc-900 p-4 outline-none"
          >
            <option value="All">
              All Status
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>

        </div>

        {loading ? (
          <p className="mt-10 text-center text-yellow-400">
            Loading Orders...
          </p>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-zinc-900 p-10 text-center text-zinc-500">
            No Orders Found
          </div>
        ) : (
          <div className="mt-8 space-y-5">

            {filteredOrders.map(
              (order: any) => {

                const status =
                  order.status || "Pending";

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                  >

                    <div className="flex flex-wrap justify-between gap-5">

                      <div className="min-w-0">

                        <p className="font-black">
                          Order #
                          {String(order.id).slice(
                            0,
                            8
                          )}
                        </p>

                        <p className="mt-2 font-bold">
                          {order.customer?.name ||
                            "Customer"}
                        </p>

                        <p className="text-sm text-zinc-500">
                          📞{" "}
                          {order.customer?.phone ||
                            "-"}
                        </p>

                        <p className="break-all text-sm text-zinc-500">
                          ✉️{" "}
                          {order.customer?.email ||
                            "-"}
                        </p>

                        <p className="mt-2 text-sm text-zinc-400">
                          Payment:{" "}
                          <span className="font-bold text-white">
                            {order.paymentMethod ||
                              "COD"}
                          </span>
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-2xl font-black text-yellow-400">
                          ₹
                          {Number(
                            order.total || 0
                          )}
                        </p>

                        <select
                          value={status}
                          onChange={(e) =>
                            changeStatus(
                              order.id,
                              e.target.value
                            )
                          }
                          className="mt-3 rounded-lg bg-zinc-800 p-2 font-semibold"
                        >
                          {statuses.map(
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

                    </div>

                    <div className="mt-5 rounded-xl bg-zinc-800 p-4">

                      <p className="text-sm text-zinc-500">
                        Delivery Address
                      </p>

                      <p className="mt-1 font-semibold">
                        {order.customer?.address ||
                          "-"}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {order.customer?.city ||
                          ""}{" "}
                        {order.customer?.pincode ||
                          ""}
                      </p>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">

                      <Link
                        href={`/orders/${order.id}`}
                      >
                        <button className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black hover:bg-yellow-300">
                          View Order
                        </button>
                      </Link>

                      <button
                        onClick={() =>
                          remove(order.id)
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 font-bold hover:bg-red-700"
                      >
                        Delete
                      </button>

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