"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../lib/firebase";
import { getOrderById } from "../../services/orderService";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(String(id));

        if (!data) {
          setError("Order not found");
          return;
        }

        setOrder(data);
      } catch (e) {
        console.error(e);
        setError("Unable to load order");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!loading && order && user) {
      const isAdmin =
        user.email?.toLowerCase() ===
        process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

      if (!isAdmin && order.userId !== user.uid) {
        router.replace("/orders");
      }
    }
  }, [loading, order, user, router]);

  const dateText = (value: any) => {
    if (!value) return "";
    const d = value?.toDate
      ? value.toDate()
      : new Date(value);

    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-center text-yellow-400">
        Loading Order...
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto mt-16 max-w-md rounded-2xl bg-zinc-900 p-8 text-center">
          <div className="text-6xl">📦</div>
          <h1 className="mt-5 text-2xl font-black">
            {error || "Order not found"}
          </h1>
          <Link href="/orders">
            <button className="mt-7 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black">
              Back to Orders
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/orders">
          <button className="rounded-lg bg-zinc-800 px-4 py-2 font-bold">
            ← My Orders
          </button>
        </Link>

        <div className="mt-6 rounded-2xl bg-zinc-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-yellow-400">
                Order #{String(order.id).slice(0, 8)}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                {dateText(order.createdAt)}
              </p>
            </div>

            <span className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
              {order.status || "Pending"}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-black">Items</h2>

          <div className="mt-5 space-y-4">
            {(order.items || []).map(
              (item: any, index: number) => (
                <div
                  key={item.id || index}
                  className="flex justify-between gap-4 border-b border-zinc-800 pb-4 last:border-0"
                >
                  <div>
                    <p className="font-bold">
                      {item.name || "Product"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Qty: {Number(item.quantity || 1)}
                    </p>
                  </div>

                  <p className="font-bold">
                    ₹
                    {Number(item.price || 0) *
                      Number(item.quantity || 1)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-black">
            Delivery
          </h2>

          <div className="mt-4 space-y-2 text-zinc-300">
            <p>Name: {order.customer?.name || "-"}</p>
            <p>Phone: {order.customer?.phone || "-"}</p>
            <p>
              Address: {order.customer?.address || "-"}
            </p>
            <p>City: {order.customer?.city || "-"}</p>
            <p>
              Pincode: {order.customer?.pincode || "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-black">
            Payment Summary
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">
                Subtotal
              </span>
              <span>₹{Number(order.subtotal || 0)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Discount
              </span>
              <span className="text-green-400">
                -₹{Number(order.discount || 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">
                Delivery
              </span>
              <span>₹{Number(order.delivery || 0)}</span>
            </div>

            <div className="flex justify-between border-t border-zinc-800 pt-4 text-xl font-black">
              <span>Total</span>
              <span className="text-yellow-400">
                ₹{Number(order.total || 0)}
              </span>
            </div>

            <p className="text-sm text-zinc-500">
              Payment: {order.paymentMethod || "-"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
