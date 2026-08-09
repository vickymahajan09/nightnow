"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

        <Link href="/">
          <div>
            <h1 className="text-2xl font-black text-yellow-400">
              Night Now
            </h1>

            <p className="text-xs text-zinc-500">
              Fast Delivery
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">

          <Link
            href="/orders"
            className="hidden rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold sm:block"
          >
            📦 Orders
          </Link>

          <Link
            href="/cart"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold"
          >
            🛒 Cart
          </Link>

          {user ? (
            <Link
              href="/profile"
              className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black"
            >
              👤 Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black"
            >
              Login
            </Link>
          )}

        </div>

      </div>

    </nav>
  );
}