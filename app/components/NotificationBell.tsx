"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  subscribeToMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

export default function NotificationBell() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // =====================================================
  // AUTH + REAL-TIME NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }

        if (!currentUser) {
          setNotifications([]);
          return;
        }

        unsubscribeNotifications =
          subscribeToMyNotifications(
            (data) => {
              setNotifications(data);
            }
          );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount =
    notifications.filter(
      (item) => item.read !== true
    ).length;

  // =====================================================
  // MARK SINGLE READ
  // =====================================================

  const handleRead = async (
    item: any
  ) => {
    try {
      if (
        item.id &&
        item.read !== true
      ) {
        await markNotificationRead(
          item.id
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              item.id
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );

      setOpen(false);

      // Order notification → order detail
      if (item.orderId) {
        window.location.href =
          `/orders/${item.orderId}`;
      }
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );
    }
  };

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const handleMarkAllRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(true);

        await markAllNotificationsRead();

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Mark all notifications read error:",
          error
        );
      } finally {
        setMarkingAll(false);
      }
    };

  // =====================================================
  // LOGGED OUT
  // =====================================================

  if (!user) {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative">
      {/* BELL */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}

      {open && (
        <>
          {/* BACKDROP */}

          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close notifications"
          />

          {/* PANEL */}

          <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            
            {/* HEADER */}

            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-black">
                  Notifications
                </h3>

                {notifications.length >
                  0 && (
                  <p className="mt-1 text-[9px] text-zinc-400">
                    {notifications.length}{" "}
                    total
                  </p>
                )}
              </div>

              {unreadCount >
                0 && (
                <button
                  type="button"
                  onClick={
                    handleMarkAllRead
                  }
                  disabled={
                    markingAll
                  }
                  className="text-[10px] font-black text-yellow-600 disabled:opacity-50"
                >
                  {markingAll
                    ? "..."
                    : "Mark all read"}
                </button>
              )}
            </div>

            {/* LIST */}

            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length ===
              0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl">
                    🔔
                  </div>

                  <p className="mt-3 text-sm font-black text-zinc-700">
                    No notifications
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-400">
                    Your order updates will appear here.
                  </p>
                </div>
              ) : (
                notifications
                  .slice(0, 20)
                  .map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          handleRead(
                            item
                          )
                        }
                        className={`w-full border-b p-4 text-left transition ${
                          item.read
                            ? "bg-white hover:bg-zinc-50"
                            : "bg-yellow-50 hover:bg-yellow-100"
                        }`}
                      >
                        <div className="flex gap-3">
                          
                          {/* ICON */}

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm">
                            {getNotificationIcon(
                              item
                            )}
                          </div>

                          {/* CONTENT */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-black">
                                {item.title ||
                                  "Notification"}
                              </p>

                              {item.read !==
                                true && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              )}
                            </div>

                            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                              {item.message ||
                                ""}
                            </p>

                            {item.createdAt && (
                              <p className="mt-2 text-[9px] font-bold text-zinc-400">
                                {formatNotificationDate(
                                  item.createdAt
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  )
              )}
            </div>

            {/* FOOTER */}

            <Link
              href="/notifications"
              onClick={() =>
                setOpen(false)
              }
              className="block border-t bg-zinc-50 p-3 text-center text-xs font-black hover:bg-zinc-100"
            >
              View All Notifications →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// NOTIFICATION ICON
// =====================================================

function getNotificationIcon(
  notification: any
) {
  const type =
    notification?.type || "";

  const status =
    notification?.status || "";

  if (
    type === "new-order"
  ) {
    return "🛍️";
  }

  if (
    type === "order-cancelled" ||
    status === "Cancelled"
  ) {
    return "❌";
  }

  if (
    status === "Delivered"
  ) {
    return "✅";
  }

  if (
    status ===
    "Out for Delivery"
  ) {
    return "🚚";
  }

  if (
    status === "Preparing"
  ) {
    return "👨‍🍳";
  }

  if (
    status === "Packed"
  ) {
    return "📦";
  }

  if (
    status === "Confirmed"
  ) {
    return "🔵";
  }

  return "🔔";
}

// =====================================================
// DATE
// =====================================================

function getNotificationTime(
  value: any
) {
  if (!value) {
    return 0;
  }

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate().getTime();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return (
      value.seconds * 1000
    );
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatNotificationDate(
  value: any
) {
  const time =
    getNotificationTime(
      value
    );

  if (!time) {
    return "";
  }

  return new Date(
    time
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}     