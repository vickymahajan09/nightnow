"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function MobileNav() {
  const pathname =
    usePathname();

  const { cartCount } =
    useCart();

  const active =
    (path: string) =>
      pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">

      <div className="mx-auto flex max-w-md items-center justify-around">

        {/* HOME */}

        <Link
          href="/"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black ${
            active("/")
              ? "text-yellow-600"
              : "text-zinc-500"
          }`}
        >
          <span className="text-xl">
            🏠
          </span>
          Home
        </Link>

        {/* CART */}

        <Link
          href="/cart"
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black ${
            active("/cart")
              ? "text-yellow-600"
              : "text-zinc-500"
          }`}
        >

          <span className="relative text-xl">

            🛒

            {cartCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}

          </span>

          Cart

        </Link>

        {/* ORDERS */}

        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black ${
            active("/orders")
              ? "text-yellow-600"
              : "text-zinc-500"
          }`}
        >
          <span className="text-xl">
            📦
          </span>
          Orders
        </Link>

        {/* PROFILE */}

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black ${
            active("/profile")
              ? "text-yellow-600"
              : "text-zinc-500"
          }`}
        >
          <span className="text-xl">
            👤
          </span>
          Profile
        </Link>

      </div>

    </nav>
  );
}