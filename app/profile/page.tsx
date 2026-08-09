"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => setUser(currentUser)
    );

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-black p-10 text-center text-white">
        <h1 className="text-3xl font-black">
          Login Required
        </h1>

        <Link href="/login">
          <button className="mt-6 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black">
            Login
          </button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-black text-yellow-400">
          My Profile
        </h1>

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">

          <div className="text-6xl">
            👤
          </div>

          <h2 className="mt-5 text-2xl font-bold">
            {user.displayName || "Customer"}
          </h2>

          <p className="mt-2 text-zinc-400">
            {user.email}
          </p>

          <div className="mt-6 grid gap-3">

            <Link href="/orders">
              <button className="w-full rounded-xl bg-zinc-800 py-3 font-bold">
                📦 My Orders
              </button>
            </Link>

            <Link href="/cart">
              <button className="w-full rounded-xl bg-zinc-800 py-3 font-bold">
                🛒 My Cart
              </button>
            </Link>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-red-600 py-3 font-bold"
            >
              Logout
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}