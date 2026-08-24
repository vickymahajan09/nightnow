"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
} from "../lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  markNotificationRead,
  subscribeToAdminNotifications,
} from "../services/notificationService";

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

export default function AdminNotificationBell() {
  const [isAdmin, setIsAdmin] =
    useState(false);

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    let stop: (() => void) | null =
      null;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          const admin =
            !!user &&
            user.email
              ?.trim()
              .toLowerCase() ===
              ADMIN_EMAIL.toLowerCase();

          setIsAdmin(
            admin
          );

          if (
            stop
          ) {
            stop();
            stop = null;
          }

          if (!admin) {
            setNotifications([]);
            return;
          }

          stop =
            subscribeToAdminNotifications(
              (
                data
              ) => {
                setNotifications(
                  data
                );
              }
            );
        }
      );

    return () => {
      unsubscribe();

      if (
        stop
      ) {
        stop();
      }
    };
  }, []);

  if (!isAdmin) {
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
                (
                  notification
                ) =>
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
            "Admin notification read error:",
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
      >
        🔔

        {unreadCount >
          0 && (
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
            className="fixed inset-0 z-40"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close"
          />

          <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="border-b p-4">
              <p className="text-sm font-black">
                Admin Notifications
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No new notifications
                </div>
              ) : (
                notifications
                  .slice(0, 30)
                  .map(
                    (item) => (
                      <button
                        type="button"
                        key={
                          item.id
                        }
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
                            "Admin Notification"}
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
          </div>
        </>
      )}
    </div>
  );
}