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

  const loadOrders = async () => {
    try {
      setLoading(true);
      setOrders(await getOrders());
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

  return (
    <main className="min-h-screen bg-black p-5 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Orders
            </h1>
            <p className="mt-1 text-zinc-500">
              Total Orders: {orders.length}
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-yellow-400">
            Loading Orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-zinc-900 p-10 text-center text-zinc-500">
            No Orders
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="rounded-2xl bg-zinc-900 p-5"
              >
                <div className="flex flex-wrap justify-between gap-5">
                  <div>
                    <p className="font-black">
                      Order #{order.id.slice(0, 8)}
                    </p>

                    <p className="mt-2">
                      {order.customer?.name || "Customer"}
                    </p>

                    <p className="text-sm text-zinc-500">
                      {order.customer?.phone || ""}
                    </p>

                    <p className="text-sm text-zinc-500">
                      {order.customer?.email || ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-yellow-400">
                      ₹{Number(order.total || 0)}
                    </p>

                    <select
                      value={order.status || "Pending"}
                      onChange={(e) =>
                        changeStatus(
                          order.id,
                          e.target.value
                        )
                      }
                      className="mt-3 rounded-lg bg-zinc-800 p-2"
                    >
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
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/orders/${order.id}`}>
                    <button className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black">
                      View Order
                    </button>
                  </Link>

                  <button
                    onClick={() => remove(order.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
