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
  getUserNotifications,
  markNotificationRead,
} from "../services/notificationService";

export default function NotificationBell() {
  const [user, setUser] =
    useState<any>(null);

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(
            currentUser
          );

          if (!currentUser) {
            setNotifications([]);
            return;
          }

          try {
            const data =
              await getUserNotifications(
                currentUser.uid
              );

            setNotifications(
              data
            );
          } catch (
            error
          ) {
            console.error(
              "Notification loading error:",
              error
            );

            setNotifications([]);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  if (!user) {
    return null;
  }

  const unreadCount =
    notifications.filter(
      (item) =>
        item.read !== true
    ).length;

  const handleRead =
    async (
      item: any
    ) => {
      if (
        item.id &&
        item.read !== true
      ) {
        try {
          await markNotificationRead(
            item.id
          );

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
        } catch (
          error
        ) {
          console.error(
            "Notification read error:",
            error
          );
        }
      }

      setOpen(false);
    };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {unreadCount >
            99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close notifications"
          />

          <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-sm font-black">
                Notifications
              </h3>

              {unreadCount >
                0 && (
                <span className="text-[10px] font-black text-red-500">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No notifications
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
                        className={`w-full border-b p-4 text-left ${
                          item.read
                            ? "bg-white"
                            : "bg-yellow-50"
                        }`}
                      >
                        <p className="text-xs font-black">
                          {item.title ||
                            "Notification"}
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                          {item.message ||
                            ""}
                        </p>
                      </button>
                    )
                  )
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() =>
                setOpen(false)
              }
              className="block border-t bg-zinc-50 p-3 text-center text-xs font-black"
            >
              View All Notifications →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}