"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  checkUser,
  logoutUser,
} from "../services/authService";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = checkUser((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await logoutUser();

      alert("Logged Out Successfully");

      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Logout Failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-yellow-400">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">

        <div className="mx-auto mt-16 max-w-md rounded-2xl bg-zinc-900 p-6 text-center">

          <div className="text-6xl">
            👤
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            Welcome to Night Now
          </h1>

          <p className="mt-3 text-zinc-400">
            Login to manage your account and orders.
          </p>

          <Link href="/login">
            <button className="mt-7 w-full rounded-lg bg-yellow-400 py-3 font-bold text-black">
              Login
            </button>
          </Link>

          <Link href="/register">
            <button className="mt-3 w-full rounded-lg bg-zinc-800 py-3 font-bold">
              Create Account
            </button>
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">

      <div className="mx-auto max-w-xl">

        <h1 className="mb-8 text-3xl font-bold text-yellow-400">
          My Profile
        </h1>

        <div className="rounded-2xl bg-zinc-900 p-6">

          <div className="mb-7 flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-3xl text-black">
              👤
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-xl font-bold">
                {user.displayName || "Customer"}
              </h2>

              <p className="truncate text-sm text-zinc-400">
                {user.email || "Mobile User"}
              </p>

              {user.phoneNumber && (
                <p className="truncate text-sm text-zinc-400">
                  {user.phoneNumber}
                </p>
              )}

            </div>

          </div>

          <Link href="/orders">
            <button className="mb-3 w-full rounded-lg bg-zinc-800 py-4 text-left font-bold hover:bg-zinc-700">
              📦 My Orders
            </button>
          </Link>

          <Link href="/cart">
            <button className="mb-3 w-full rounded-lg bg-zinc-800 py-4 text-left font-bold hover:bg-zinc-700">
              🛒 My Cart
            </button>
          </Link>

          <Link href="/">
            <button className="mb-3 w-full rounded-lg bg-zinc-800 py-4 text-left font-bold hover:bg-zinc-700">
              🛍️ Continue Shopping
            </button>
          </Link>

          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg bg-red-600 py-4 font-bold hover:bg-red-700"
          >
            Logout
          </button>

        </div>

      </div>

    </main>
  );
}