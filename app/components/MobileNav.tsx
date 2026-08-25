"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const [mounted, setMounted] = useState(false);
  const [isOffersPage, setIsOffersPage] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkOffersPage = () => {
      const params = new URLSearchParams(window.location.search);

      setIsOffersPage(
        window.location.pathname === "/" &&
          params.get("offers") === "true"
      );
    };

    checkOffersPage();

    window.addEventListener(
      "popstate",
      checkOffersPage
    );

    return () => {
      window.removeEventListener(
        "popstate",
        checkOffersPage
      );
    };
  }, []);

  const active = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  };

  const safeCartCount = mounted ? cartCount : 0;

  return (
    <>
      <div
        className="h-[76px] md:hidden"
        aria-hidden="true"
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-[9999] border-t border-zinc-200 bg-white/95 shadow-[0_-5px_20px_rgba(0,0,0,0.10)] backdrop-blur-xl md:hidden"
        style={{
          paddingBottom:
            "max(env(safe-area-inset-bottom), 6px)",
        }}
      >
        <div className="mx-auto flex h-[70px] w-full max-w-md items-center justify-around px-2">

          {/* HOME */}

          <Link
            href="/"
            className={`flex min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-black active:scale-95 ${
              active("/") && !isOffersPage
                ? "text-yellow-600"
                : "text-zinc-500"
            }`}
          >
            <span className="text-xl leading-none">
              🏠
            </span>

            <span>
              Home
            </span>
          </Link>


          {/* OFFERS */}

          <Link
            href="/?offers=true"
            className={`flex min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-black active:scale-95 ${
              isOffersPage
                ? "text-yellow-600"
                : "text-zinc-500"
            }`}
          >
            <span className="text-xl leading-none">
              🔥
            </span>

            <span>
              Offers
            </span>
          </Link>


          {/* ORDERS */}

          <Link
            href="/orders"
            className={`flex min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-black active:scale-95 ${
              active("/orders")
                ? "text-yellow-600"
                : "text-zinc-500"
            }`}
          >
            <span className="text-xl leading-none">
              📦
            </span>

            <span>
              Orders
            </span>
          </Link>


          {/* CART */}

          <Link
            href="/cart"
            className={`flex min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-black active:scale-95 ${
              active("/cart")
                ? "text-yellow-600"
                : "text-zinc-500"
            }`}
          >
            <span className="relative text-xl leading-none">
              🛒

              {safeCartCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white">
                  {safeCartCount > 99
                    ? "99+"
                    : safeCartCount}
                </span>
              )}
            </span>

            <span>
              Cart
            </span>
          </Link>

        </div>
      </nav>
    </>
  );
}