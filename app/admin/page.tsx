"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { getOrders } from "../services/orderService";
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const userEmail =
          user?.email?.trim().toLowerCase();

        if (
          !user ||
          !ADMIN_EMAIL ||
          userEmail !== ADMIN_EMAIL
        ) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);

        try {
          const [
            orderData,
            productData,
            categoryData,
          ] = await Promise.all([
            getOrders(),
            getProducts(),
            getCategories(),
          ]);

          setOrders(orderData || []);
          setProducts(productData || []);
          setCategories(categoryData || []);
        } catch (error) {
          console.error(
            "Admin dashboard loading failed:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-yellow-400">
          Loading Admin...
        </p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-8 text-center">
          <div className="text-6xl">
            🔒
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Access Denied
          </h1>

          <p className="mt-3 text-zinc-400">
            Admin access required.
          </p>

          <Link href="/login">
            <button className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-bold text-black">
              Login
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const pendingOrders =
    orders.filter(
      (order) =>
        !order.status ||
        order.status === "Pending"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status === "Delivered"
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status === "Cancelled"
    ).length;

  const totalSales =
    orders
      .filter(
        (order) =>
          order.status !== "Cancelled"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

  const lowStock =
    products.filter(
      (product) =>
        Number(product.stock || 0) <= 5
    ).length;

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Night Now
            </p>

            <h1 className="text-4xl font-black text-yellow-400">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {ADMIN_EMAIL}
            </p>
          </div>

          <Link href="/">
            <button className="rounded-xl bg-zinc-800 px-5 py-3 font-bold">
              ← Store
            </button>
          </Link>
        </div>

        {/* STATS */}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-black">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-yellow-400">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Products
            </p>

            <p className="mt-2 text-3xl font-black">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Sales
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              ₹{totalSales}
            </p>
          </div>

        </div>

        {/* MAIN ACTIONS */}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <Link href="/admin/orders">
            <div className="rounded-2xl bg-blue-600 p-6 hover:bg-blue-500">
              <div className="text-4xl">
                📦
              </div>

              <h2 className="mt-4 text-xl font-black">
                Manage Orders
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                {orders.length} total orders
              </p>
            </div>
          </Link>

          <Link href="/admin/product">
            <div className="rounded-2xl bg-green-600 p-6 hover:bg-green-500">
              <div className="text-4xl">
                🛍️
              </div>

              <h2 className="mt-4 text-xl font-black">
                Manage Products
              </h2>

              <p className="mt-1 text-sm text-green-100">
                {products.length} products
              </p>
            </div>
          </Link>

          <Link href="/admin/categories">
            <div className="rounded-2xl bg-purple-600 p-6 hover:bg-purple-500">
              <div className="text-4xl">
                🗂️
              </div>

              <h2 className="mt-4 text-xl font-black">
                Categories
              </h2>

              <p className="mt-1 text-sm text-purple-100">
                {categories.length} categories
              </p>
            </div>
          </Link>

          <Link href="/orders">
            <div className="rounded-2xl bg-zinc-800 p-6 hover:bg-zinc-700">
              <div className="text-4xl">
                👤
              </div>

              <h2 className="mt-4 text-xl font-black">
                Customer View
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                View customer orders
              </p>
            </div>
          </Link>

        </div>

        {/* SUMMARIES */}

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl bg-zinc-900 p-6">
            <h2 className="text-xl font-black">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Pending
                </span>

                <span className="font-bold text-yellow-400">
                  {pendingOrders}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Delivered
                </span>

                <span className="font-bold text-green-400">
                  {deliveredOrders}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Cancelled
                </span>

                <span className="font-bold text-red-400">
                  {cancelledOrders}
                </span>
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">

            <h2 className="text-xl font-black">
              Inventory
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Total Products
                </span>

                <span className="font-bold">
                  {products.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Low Stock
                </span>

                <span className="font-bold text-red-400">
                  {lowStock}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Categories
                </span>

                <span className="font-bold">
                  {categories.length}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}