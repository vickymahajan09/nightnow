"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, Gift, Package, ShoppingCart } from "lucide-react";

import { useCart } from "../context/CartContext";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Home, activeColor: "text-orange-500", bg: "bg-orange-50" },
  { href: "/categories", label: "Categories", Icon: LayoutGrid, activeColor: "text-purple-500", bg: "bg-purple-50" },
  { href: "/offers", label: "Offers", Icon: Gift, activeColor: "text-rose-500", bg: "bg-rose-50" },
  { href: "/orders", label: "Orders", Icon: Package, activeColor: "text-blue-500", bg: "bg-blue-50" },
  { href: "/cart", label: "Cart", Icon: ShoppingCart, activeColor: "text-green-600", bg: "bg-green-50" },
];

export default function MobileNav() {
  const pathname = usePathname();

  const { cartCount } = useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const safeCartCount = mounted ? cartCount : 0;

  return (
    <>
      {/* Bottom navigation space */}

      <div className="h-[76px] md:hidden" aria-hidden="true" />

      {/* MOBILE NAV */}

      <nav
        className="fixed inset-x-0 bottom-0 z-[9999] border-t border-zinc-200 bg-white/95 shadow-[0_-5px_20px_rgba(0,0,0,0.10)] backdrop-blur-xl md:hidden"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
        }}
      >
        <div className="mx-auto flex h-[70px] w-full max-w-md items-center justify-around px-2">
          {NAV_ITEMS.map(({ href, label, Icon, activeColor, bg }) => {
            const isActive = active(href);
            const showBadge = href === "/cart" && safeCartCount > 0;

            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-black active:scale-95 ${
                  isActive ? activeColor : "text-zinc-400"
                }`}
              >
                <span className={`relative flex h-8 w-8 items-center justify-center rounded-full transition ${isActive ? bg : ""}`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black leading-none text-white">
                      {safeCartCount > 99 ? "99+" : safeCartCount}
                    </span>
                  )}
                </span>

                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
