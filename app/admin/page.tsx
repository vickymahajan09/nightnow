"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";

const ADMIN_EMAIL =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "mahajanvicky04@gmail.com")
    .trim()
    .toLowerCase();

type AdminCard = {
  href: string;
  icon: string;
  title: string;
  description: string;
  className: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const userEmail = user?.email?.trim().toLowerCase();

      if (!user || !ADMIN_EMAIL || userEmail !== ADMIN_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      try {
        const [orderData, productData, categoryData] =
          await Promise.all([
            getOrders(),
            getProducts(),
            getCategories(),
          ]);

        setOrders(orderData || []);
        setProducts(productData || []);
        setCategories(categoryData || []);
      } catch (error) {
        console.error("Admin dashboard loading failed:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p className="font-bold text-amber-600">
          Loading Admin...
        </p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
          <div className="text-6xl">🔒</div>

          <h1 className="mt-5 text-3xl font-black">
            Access Denied
          </h1>

          <p className="mt-3 text-slate-600">
            Admin access required.
          </p>

          <Link href="/admin/login">
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-black text-black transition hover:bg-yellow-300"
            >
              Admin Login
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const pendingOrders = orders.filter(
    (order) =>
      !order.status ||
      order.status === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  const totalSales = orders
    .filter(
      (order) =>
        order.status !== "Cancelled"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) <= 5
  ).length;

  const managementCards: AdminCard[] = [
    {
      href: "/admin/orders",
      icon: "📦",
      title: "Manage Orders",
      description: `${orders.length} total orders`,
      className:
        "bg-blue-600 hover:bg-blue-500",
    },
    {
      href: "/admin/product",
      icon: "🛍️",
      title: "Manage Products",
      description: `${products.length} products`,
      className:
        "bg-green-600 hover:bg-green-500",
    },
    {
      href: "/admin/categories",
      icon: "🗂️",
      title: "Categories",
      description: `${categories.length} categories`,
      className:
        "bg-purple-600 hover:bg-purple-500",
    },
    {
      href: "/admin/brands",
      icon: "🏷️",
      title: "Brand Master",
      description: "Manage product brands",
      className:
        "bg-orange-600 hover:bg-orange-500",
    },
    {
      href: "/admin/hero-banner",
      icon: "🎯",
      title: "Homepage Banner",
      description: "Edit rotating banner slides",
      className:
        "bg-yellow-600 hover:bg-yellow-500",
    },
    {
      href: "/admin/offers",
      icon: "🎁",
      title: "Live Offers",
      description:
        "Create and manage active offers",
      className:
        "bg-pink-600 hover:bg-pink-500",
    },
    {
      href: "/admin/home-sections",
      icon: "🏠",
      title: "Home Sections",
      description:
        "Manage homepage sections and products",
      className:
        "bg-indigo-600 hover:bg-indigo-500",
    },
    {
      href: "/admin/needs",
      icon: "⚡",
      title: "Needs / Smart Picks",
      description:
        "Manage quick-pick content",
      className:
        "bg-cyan-600 hover:bg-cyan-500",
    },
    {
      href: "/admin/settings",
      icon: "⚙️",
      title: "Store Settings",
      description:
        "Shop location, delivery charges & ETA",
      className:
        "bg-teal-600 hover:bg-teal-500",
    },
    {
      href: "/admin/broadcast",
      icon: "📣",
      title: "Broadcast Notification",
      description:
        "Send a push notification to all customers",
      className:
        "bg-rose-600 hover:bg-rose-500",
    },
    {
      href: "/admin/delivery-partners",
      icon: "🛵",
      title: "Delivery Partners",
      description:
        "Riders, earnings & payout rules",
      className:
        "bg-amber-600 hover:bg-amber-500",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Night Now
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-amber-600 md:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {ADMIN_EMAIL}
            </p>

            <p className="mt-3 text-xs font-semibold text-slate-600">
              All Night Now management tools in one place.
            </p>
          </div>

          <Link href="/">
            <button
              type="button"
              className="rounded-xl bg-slate-200 px-5 py-3 font-black transition hover:bg-slate-300"
            >
              ← Store
            </button>
          </Link>
        </header>

        {/* STATS */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-sm text-slate-600">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-black">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-sm text-slate-600">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-amber-600">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-sm text-slate-600">
              Products
            </p>

            <p className="mt-2 text-3xl font-black">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-sm text-slate-600">
              Sales
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              ₹{totalSales}
            </p>
          </div>

        </section>

        {/* MANAGEMENT */}
        <section className="mt-8">

          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Control Center
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Manage Night Now
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Open any admin module directly from this dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {managementCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
              >
                <div
                  className={`min-h-[165px] rounded-2xl p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 ${card.className}`}
                >
                  <div className="text-4xl">
                    {card.icon}
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    {card.title}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-white/80">
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </section>

        {/* QUICK ACCESS */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">

          <Link href="/orders">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-100">
              <div className="text-3xl">
                👤
              </div>

              <h2 className="mt-3 text-lg font-black">
                Customer View
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Open the customer-facing order view.
              </p>
            </div>
          </Link>

          <Link href="/">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-100">
              <div className="text-3xl">
                🛒
              </div>

              <h2 className="mt-3 text-lg font-black">
                Open Store
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Go directly to the Night Now storefront.
              </p>
            </div>
          </Link>

        </section>

        {/* SUMMARIES */}
        <section className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Pending
                </span>

                <span className="font-bold text-amber-600">
                  {pendingOrders}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Delivered
                </span>

                <span className="font-bold text-green-400">
                  {deliveredOrders}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Cancelled
                </span>

                <span className="font-bold text-red-400">
                  {cancelledOrders}
                </span>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Inventory
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Total Products
                </span>

                <span className="font-bold">
                  {products.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Low Stock
                </span>

                <span className="font-bold text-red-400">
                  {lowStock}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Categories
                </span>

                <span className="font-bold">
                  {categories.length}
                </span>
              </div>

            </div>
          </div>

        </section>

        {/* SECURITY */}
        <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-slate-600">
          🔐 Admin access is restricted to the configured administrator
          account. Keep this authentication check enabled in production.
        </div>

      </div>
    </main>
  );
}