"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const active = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] border-t border-zinc-200 bg-white/95 px-2 py-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-black ${
            active("/") ? "text-yellow-600" : "text-zinc-500"
          }`}
        >
          <span className="text-xl">🏠</span>
          Home
        </Link>

        <Link
          href="/#products"
          className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-black ${
            pathname === "/" && false ? "text-yellow-600" : "text-zinc-500"
          }`}
        >
          <span className="text-xl">🛍️</span>
          Categories
        </Link>

        <Link
          href="/orders"
          className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-black ${
            active("/orders") ? "text-yellow-600" : "text-zinc-500"
          }`}
        >
          <span className="text-xl">📦</span>
          Orders
        </Link>

        <Link
          href="/cart"
          className={`relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-black ${
            active("/cart") ? "text-yellow-600" : "text-zinc-500"
          }`}
        >
          <span className="relative text-xl">
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          Cart
        </Link>
      </div>
    </nav>
  );
}