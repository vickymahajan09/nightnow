"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  markNotificationRead,
  subscribeToAdminNotifications,
} from "../services/notificationService";

export default function AdminNotificationBell() {
  const [
    notifications,
    setNotifications,
  ] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe =
      subscribeToAdminNotifications(
        (data) => {
          setNotifications(data);
        }
      );

    return () => unsubscribe();
  }, []);

  const unread =
    notifications.filter(
      (item) =>
        item.read !== true
    );

  const unreadCount =
    unread.length;

  const latest =
    unread[0];

  const getNotificationLink = (
    notification: any
  ) => {
    if (
      notification?.orderId
    ) {
      return `/admin/orders/${notification.orderId}`;
    }

    return "/admin/notifications";
  };

  const handleOpen = async (
    notification: any
  ) => {
    try {
      if (
        notification?.id &&
        notification.read !== true
      ) {
        await markNotificationRead(
          notification.id
        );
      }
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );
    }
  };

  return (
    <div className="relative shrink-0">

      {/* BELL */}

      <Link
        href="/admin/notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl transition hover:border-yellow-400 hover:bg-zinc-800"
        title="Admin Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </Link>

      {/* POPUP */}

      {latest &&
        unreadCount > 0 && (
          <Link
            href={getNotificationLink(
              latest
            )}
            onClick={() =>
              handleOpen(
                latest
              )
            }
            className="absolute right-0 top-12 z-[999] block w-80 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-left shadow-2xl transition hover:border-yellow-400 hover:bg-zinc-900"
          >

            <span className="block text-[10px] font-black uppercase tracking-wider text-yellow-400">
              NEW NOTIFICATION
            </span>

            <span className="mt-1 block text-sm font-black text-white">
              {latest.title ||
                "New Order Received 🔔"}
            </span>

            <span className="mt-2 block text-[11px] leading-5 text-zinc-400">
              {latest.message ||
                ""}
            </span>

            <span className="mt-3 block text-[10px] font-black text-yellow-400">
              {latest.orderId
                ? "Open Order →"
                : "View Notification →"}
            </span>

          </Link>
        )}

    </div>
  );
}