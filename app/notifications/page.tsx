"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../lib/firebase";

import {
  AppNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

export default function NotificationsPage() {
  const [user, setUser] =
    useState<any>(null);

  const [
    notifications,
    setNotifications,
  ] = useState<AppNotification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadNotifications =
    async () => {
      try {
        setLoading(true);

        const data =
          await getMyNotifications();

        setNotifications(data);
      } catch (error) {
        console.error(
          "Notifications loading error:",
          error
        );

        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            setNotifications([]);
            setLoading(false);
            return;
          }

          await loadNotifications();
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const markRead =
    async (
      notification: AppNotification
    ) => {
      if (
        !notification.id ||
        notification.read === true
      ) {
        return;
      }

      try {
        await markNotificationRead(
          notification.id
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      read: true,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          "Notification read error:",
          error
        );
      }
    };

  const markAllRead =
    async () => {
      try {
        await markAllNotificationsRead();

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Mark all notifications error:",
          error
        );
      }
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">
            🔔
          </div>

          <p className="mt-4 font-black">
            Loading notifications...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow">
          <div className="text-6xl">
            🔔
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Notifications dekhne ke liye login karein.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-2xl bg-yellow-400 py-4 font-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const unreadCount =
    notifications.filter(
      (item) =>
        item.read !== true
    ).length;

  return (
    <main className="min-h-screen bg-zinc-50 px-3 py-5 pb-24 text-black">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-3">

          <Link
            href="/profile"
            className="text-sm font-black text-zinc-500"
          >
            ← Profile
          </Link>

          <h1 className="text-xl font-black">
            Notifications
          </h1>

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-black text-yellow-600"
            >
              Mark all read
            </button>
          ) : (
            <span />
          )}

        </div>

        {/* NOTIFICATIONS */}

        <div className="mt-5 space-y-3">

          {notifications.length === 0 ? (

            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="text-6xl">
                🔔
              </div>

              <h2 className="mt-4 text-xl font-black">
                No Notifications
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Order updates and important messages will appear here.
              </p>

            </div>

          ) : (

            notifications.map(
              (item) => (

                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    markRead(item)
                  }
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm ${
                    item.read
                      ? "border-zinc-200 bg-white"
                      : "border-yellow-200 bg-yellow-50"
                  }`}
                >

                  <div className="flex gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400">

                      {item.type === "order"
                        ? "📦"
                        : item.type?.includes(
                            "return"
                          )
                        ? "↩️"
                        : item.type?.includes(
                            "exchange"
                          )
                        ? "🔄"
                        : "🔔"}

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <h2 className="text-sm font-black">
                          {item.title ||
                            "Notification"}
                        </h2>

                        {!item.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        )}

                      </div>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.message || ""}
                      </p>

                      {item.orderId && (
                        <p className="mt-2 text-[10px] font-black text-zinc-400">
                          Order: #
                          {String(
                            item.orderId
                          ).slice(0, 8)}
                        </p>
                      )}

                    </div>

                  </div>

                </button>

              )
            )

          )}

        </div>

      </div>
    </main>
  );
}