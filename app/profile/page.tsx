"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { logoutUser } from "../services/authService";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="font-bold">
          Loading...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="text-6xl">
            👤
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Login to view your profile and orders.
          </p>

          <Link href="/login">
            <button className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black">
              Login
            </button>
          </Link>

        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Logout failed");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 pb-28 text-black">

      <div className="mx-auto max-w-2xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl bg-black p-6 text-white">

          <div className="flex items-center gap-4">

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl text-black">
                👤
              </div>
            )}

            <div className="min-w-0">

              <h1 className="truncate text-2xl font-black">
                {user.displayName ||
                  "Night Now User"}
              </h1>

              <p className="truncate text-sm text-zinc-400">
                {user.email ||
                  "Mobile User"}
              </p>

            </div>

          </div>

        </div>

        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">

          <Link
            href="/orders"
            className="flex items-center gap-4 border-b border-zinc-100 p-5 hover:bg-zinc-50"
          >
            <span className="text-2xl">
              📦
            </span>

            <div className="flex-1">
              <p className="font-black">
                My Orders
              </p>

              <p className="text-xs text-zinc-500">
                Track your orders
              </p>
            </div>

            <span>→</span>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-4 border-b border-zinc-100 p-5 hover:bg-zinc-50"
          >
            <span className="text-2xl">
              🛒
            </span>

            <div className="flex-1">
              <p className="font-black">
                My Cart
              </p>

              <p className="text-xs text-zinc-500">
                View your cart
              </p>
            </div>

            <span>→</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 p-5 text-left hover:bg-red-50"
          >
            <span className="text-2xl">
              🚪
            </span>

            <div className="flex-1">
              <p className="font-black text-red-600">
                Logout
              </p>

              <p className="text-xs text-zinc-500">
                Sign out from Night Now
              </p>
            </div>

          </button>

        </div>

      </div>
    </main>
  );
}