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
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">👤</div>

          <h1 className="mt-6 text-3xl font-black">
            Login Required
          </h1>

          <Link href="/login">
            <button className="mt-6 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black">
              Login
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-black text-yellow-400">
          My Profile
        </h1>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

          {/* PROFILE */}

          <div className="flex items-center gap-4">

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-4xl text-black">
                👤
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-2xl font-bold">
                {user.displayName || "Customer"}
              </h2>

              <p className="mt-1 truncate text-zinc-400">
                {user.email || "Mobile User"}
              </p>

              {user.phoneNumber && (
                <p className="mt-1 text-sm text-zinc-500">
                  📱 {user.phoneNumber}
                </p>
              )}
            </div>

          </div>

          {/* ACCOUNT */}

          <div className="mt-8 space-y-3">

            <Link href="/orders">
              <button className="w-full rounded-xl bg-zinc-800 py-4 text-left px-4 font-bold hover:bg-zinc-700">
                📦 My Orders
              </button>
            </Link>

            <Link href="/cart">
              <button className="w-full rounded-xl bg-zinc-800 py-4 text-left px-4 font-bold hover:bg-zinc-700">
                🛒 My Cart
              </button>
            </Link>

            <Link href="/wishlist">
              <button className="w-full rounded-xl bg-zinc-800 py-4 text-left px-4 font-bold hover:bg-zinc-700">
                ❤️ My Wishlist
              </button>
            </Link>

            <Link href="/notifications">
              <button className="w-full rounded-xl bg-zinc-800 py-4 text-left px-4 font-bold hover:bg-zinc-700">
                🔔 Notifications
              </button>
            </Link>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-red-600 py-4 font-bold hover:bg-red-700"
            >
              🚪 Logout
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}