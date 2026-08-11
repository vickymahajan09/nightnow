"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const items = [
    {
      href: "/",
      icon: "⌂",
      label: "Home",
    },
    {
      href: "/#products",
      icon: "▦",
      label: "Shop",
    },
    {
      href: "/cart",
      icon: "🛒",
      label: "Cart",
    },
    {
      href: "/orders",
      icon: "📦",
      label: "Orders",
    },
    {
      href: "/profile",
      icon: "👤",
      label: "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9998] border-t border-zinc-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-5px_25px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">

      <div className="mx-auto flex max-w-md items-center justify-around">

        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(
                  item.href.split("#")[0]
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold ${
                active
                  ? "text-black"
                  : "text-zinc-400"
              }`}
            >
              <span
                className={`text-xl ${
                  active
                    ? "scale-110"
                    : ""
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>

              {item.label === "Cart" &&
                cartCount > 0 && (
                  <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                    {cartCount}
                  </span>
                )}

              {active && (
                <span className="h-1 w-5 rounded-full bg-yellow-400" />
              )}
            </Link>
          );
        })}

      </div>
    </nav>
  );
}