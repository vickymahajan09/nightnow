"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  getUserNotifications,
} from "../services/notificationService";

export default function NotificationBell() {

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {
            setUnreadCount(0);
            return;
          }

          try {

            const data =
              await getUserNotifications(
                user.uid
              );

            const unread =
              data.filter(
                (item: any) =>
                  item.read !== true
              ).length;

            setUnreadCount(
              unread
            );

          } catch (error) {
            console.error(
              error
            );
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);

  return (
    <Link
      href="/notifications"
      className="relative"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-xl hover:bg-zinc-700">
        🔔
      </div>

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
          {unreadCount > 99
            ? "99+"
            : unreadCount}
        </span>
      )}

    </Link>
  );
}