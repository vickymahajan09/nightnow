"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { getOrders } from "../../services/orderService";

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const p = await getProducts();
      const c = await getCategories();
      const o = await getOrders();

      setProducts(p);
      setCategories(c);
      setOrders(o);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const revenue = orders.reduce(
    (sum: number, order: any) => sum + (order.total || 0),
    0
  );

  const lowStock = products.filter(
    (item: any) => Number(item.stock) <= 5
  ).length;

  const cards = [
    {
      title: "Products",
      value: products.length,
      color: "bg-blue-600",
      link: "/admin/product",
    },
    {
      title: "Categories",
      value: categories.length,
      color: "bg-green-600",
      link: "/admin/categories",
    },
    {
      title: "Orders",
      value: orders.length,
      color: "bg-yellow-500",
      link: "/admin/orders",
    },
    {
      title: "Revenue",
      value: `₹${revenue}`,
      color: "bg-purple-600",
      link: "/admin/orders",
    },
    {
      title: "Low Stock",
      value: lowStock,
      color: "bg-red-600",
      link: "/admin/product",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">

      <h1 className="mb-10 text-4xl font-bold text-yellow-400">
        Admin Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.link}
            className={`${card.color} rounded-xl p-6 transition hover:scale-105`}
          >
            <p className="text-sm opacity-80">
              {card.title}
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              {card.value}
            </h2>
          </Link>
        ))}

      </div>

      <div className="mt-10 rounded-xl bg-zinc-900 p-6">

        <h2 className="mb-6 text-2xl font-bold">
          Recent Orders
        </h2>

        {orders.slice(0, 10).map((order: any) => (
          <div
            key={order.id}
            className="mb-3 flex items-center justify-between rounded-lg border border-zinc-800 p-4"
          >
            <div>
              <h3 className="font-bold">
                {order.name}
              </h3>

              <p className="text-sm text-zinc-400">
                {order.phone}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-yellow-400">
                ₹{order.total}
              </p>

              <span className="rounded bg-green-600 px-3 py-1 text-sm">
                {order.status}
              </span>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="py-8 text-center text-zinc-400">
            No Orders Yet
          </div>
        )}

      </div>

    </main>
  );
}