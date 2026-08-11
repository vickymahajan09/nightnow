"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<any[]>([]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "nightnow-notifications"
        );

      if (saved) {
        const data =
          JSON.parse(saved);

        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const defaultNotifications = [
    {
      id: "welcome",
      icon: "🎁",
      title: "Welcome to Night Now",
      message:
        "Fast delivery for everything you need.",
    },
    {
      id: "delivery",
      icon: "🚀",
      title: "Fast Delivery",
      message:
        "Your everyday essentials delivered quickly.",
    },
    {
      id: "offer",
      icon: "🔥",
      title: "Free Delivery",
      message:
        "Get free delivery on orders above ₹299.",
    },
  ];

  const data =
    notifications.length > 0
      ? notifications
      : defaultNotifications;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-7 pb-24 text-black">

      <div className="mx-auto max-w-2xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <div className="mt-5">

          <h1 className="text-3xl font-black">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Latest updates from Night Now
          </p>

        </div>

        <div className="mt-6 space-y-3">

          {data.map(
            (item: any) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-2xl">
                  {item.icon ||
                    "🔔"}
                </div>

                <div className="min-w-0">

                  <h2 className="font-black">
                    {item.title ||
                      "Notification"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {item.message ||
                      item.description ||
                      ""}
                  </p>

                </div>

              </div>
            )
          )}

        </div>

      </div>
    </main>
  );
}