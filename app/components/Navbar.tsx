"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  const { cartCount } = useCart();

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
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white text-black shadow-sm">

      {/* TOP BAR */}

      <div className="bg-black px-4 py-2 text-center text-xs font-semibold text-white">
        ⚡ Night Now — Fast Delivery at Your Doorstep
      </div>

      {/* MAIN NAVBAR */}

      <div className="mx-auto max-w-7xl px-4">

        <div className="flex h-16 items-center gap-3">

          {/* LOGO */}

          <Link
            href="/"
            className="shrink-0"
          >
            <div className="leading-none">

              <h1 className="text-2xl font-black tracking-tight text-black">
                Night
                <span className="text-yellow-500">
                  Now
                </span>
              </h1>

              <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                FAST DELIVERY
              </p>

            </div>
          </Link>

          {/* LOCATION */}

          <button
            type="button"
            className="hidden min-w-[170px] rounded-xl px-3 py-2 text-left hover:bg-zinc-100 md:block"
          >

            <p className="text-[10px] font-semibold uppercase text-zinc-500">
              Deliver to
            </p>

            <p className="truncate text-sm font-bold">
              📍 Your Location
              <span className="ml-1 text-xs">
                ▼
              </span>
            </p>

          </button>

          {/* SEARCH */}

          <Link
            href="/#products"
            className="flex min-w-0 flex-1"
          >
            <div className="flex h-11 w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 text-zinc-500 hover:bg-zinc-200">

              <span className="text-lg">
                🔍
              </span>

              <span className="truncate text-sm">
                Search medicines, groceries & more
              </span>

            </div>
          </Link>

          {/* DESKTOP ACTIONS */}

          <div className="hidden items-center gap-2 md:flex">

            <Link
              href="/orders"
              className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-zinc-100"
            >
              📦 Orders
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-800"
            >

              🛒 Cart

              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-black text-black">
                  {cartCount}
                </span>
              )}

            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-lg"
                title="Profile"
              >
                👤
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-black hover:bg-yellow-500"
              >
                Login
              </Link>
            )}

          </div>

          {/* MOBILE CART */}

          <Link
            href="/cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-white md:hidden"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-black text-black">
                {cartCount}
              </span>
            )}

          </Link>

        </div>

        {/* MOBILE LOCATION */}

        <div className="border-t border-zinc-100 py-2 md:hidden">

          <button
            type="button"
            className="flex w-full items-center gap-2 text-left"
          >

            <span>
              📍
            </span>

            <div className="min-w-0">

              <p className="text-[9px] font-semibold uppercase text-zinc-500">
                Deliver to
              </p>

              <p className="truncate text-xs font-bold">
                Your Location
              </p>

            </div>

            <span className="ml-auto text-xs">
              ▼
            </span>

          </button>

        </div>

      </div>

    </header>
  );
}