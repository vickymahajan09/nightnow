"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import AdminPushNotification from "../components/AdminPushNotification";

import {
  registerAdminPushNotifications,
  listenForForegroundMessages,
} from "../lib/messaging";

import AdminGuard from "./AdminGuard";

import AdminNotificationBell from "../components/AdminNotificationBell";

import { auth } from "../lib/firebase";
import { registerPushToken } from "../services/pushNotificationService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") {
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            return;
          }

          await registerPushToken(
            user.uid,
            "admin"
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, [pathname]);

  if (
    pathname ===
    "/admin/login"
  ) {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "📊",
    },
    {
      href: "/admin/product",
      label: "Products",
      icon: "📦",
    },
    {
      href: "/admin/brands",
      label: "Brands",
      icon: "🏷️",
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: "🗂️",
    },
    {
      href: "/admin/needs",
      label: "Aapki Zarurat",
      icon: "💡",
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: "🛍️",
    },
    {
      href: "/admin/coupons",
      label: "Coupons",
      icon: "🎟️",
    },
    {
      href: "/admin/reviews",
      label: "Reviews",
      icon: "⭐",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: "⚙️",
    },
  ];

  const isActive = (
    href: string
  ) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  return (
    <AdminGuard>
      <AdminPushNotification />

      <div className="min-h-screen bg-black text-white">

        {/* HEADER */}

        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 shadow-xl backdrop-blur">

          <div className="mx-auto max-w-[1600px] px-3 py-3">

            <div className="flex items-center gap-3">

              {/* LOGO */}

              <Link
                href="/admin"
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-yellow-400/20 bg-zinc-950 px-3 py-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-lg">
                  🌙
                </div>

                <div className="hidden sm:block">

                  <div className="text-base font-black leading-none">
                    Night
                    <span className="text-yellow-400">
                      Now
                    </span>
                  </div>

                  <div className="mt-1 text-[8px] font-black tracking-[0.2em] text-zinc-500">
                    ADMIN PANEL
                  </div>

                </div>
              </Link>

              {/* NAVIGATION */}

              <nav className="min-w-0 flex-1 overflow-x-auto">

                <div className="flex min-w-max gap-2">

                  {navItems.map(
                    (item) => {
                      const active =
                        isActive(
                          item.href
                        );

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          className={[
                            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition",
                            active
                              ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/10"
                              : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white",
                          ].join(
                            " "
                          )}
                        >
                          <span>
                            {
                              item.icon
                            }
                          </span>

                          <span>
                            {
                              item.label
                            }
                          </span>
                        </Link>
                      );
                    }
                  )}

                </div>

              </nav>

              {/* NOTIFICATION */}

              <AdminNotificationBell />

              {/* LOGOUT */}

              <Link
                href="/admin/logout"
                className="flex shrink-0 items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-black text-red-400 transition hover:bg-red-500 hover:text-white"
              >
                <span>
                  🚪
                </span>

                <span className="hidden sm:block">
                  Logout
                </span>
              </Link>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <main className="min-h-[calc(100vh-72px)] bg-black">

          <div className="min-h-full">
            {children}
          </div>

        </main>

        {/* MOBILE BAR */}

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black/95 px-2 py-2 backdrop-blur md:hidden">

          <div className="grid grid-cols-5 gap-1">

            <Link
              href="/admin"
              className={[
                "rounded-xl p-2 text-center text-[9px] font-black",
                pathname ===
                "/admin"
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-500",
              ].join(" ")}
            >
              <div className="text-base">
                📊
              </div>
              Home
            </Link>

            <Link
              href="/admin/product"
              className={[
                "rounded-xl p-2 text-center text-[9px] font-black",
                pathname.startsWith(
                  "/admin/product"
                )
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-500",
              ].join(" ")}
            >
              <div className="text-base">
                📦
              </div>
              Products
            </Link>

            <Link
              href="/admin/brands"
              className={[
                "rounded-xl p-2 text-center text-[9px] font-black",
                pathname.startsWith(
                  "/admin/brands"
                )
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-500",
              ].join(" ")}
            >
              <div className="text-base">
                🏷️
              </div>
              Brands
            </Link>

            <Link
              href="/admin/needs"
              className={[
                "rounded-xl p-2 text-center text-[9px] font-black",
                pathname.startsWith(
                  "/admin/needs"
                )
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-500",
              ].join(" ")}
            >
              <div className="text-base">
                💡
              </div>
              Needs
            </Link>

            <Link
              href="/admin/orders"
              className={[
                "rounded-xl p-2 text-center text-[9px] font-black",
                pathname.startsWith(
                  "/admin/orders"
                )
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-500",
              ].join(" ")}
            >
              <div className="text-base">
                🛍️
              </div>
              Orders
            </Link>

          </div>

        </div>

      </div>
    </AdminGuard>
  );
}