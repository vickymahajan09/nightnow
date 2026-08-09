"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import {
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
} from "../services/notificationService";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setLoading(false);
          return;
        }

        try {
          setItems(
            await getUserNotifications(user.uid)
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    );
  }, []);

  const read = async (id: string) => {
    await markNotificationRead(id);

    setItems((old) =>
      old.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
  };

  const remove = async (id: string) => {
    await deleteNotification(id);

    setItems((old) =>
      old.filter((item) => item.id !== id)
    );
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-yellow-400">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Order updates and messages
            </p>
          </div>

          <Link href="/">
            <button className="rounded-lg bg-zinc-800 px-4 py-2">
              Home
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-yellow-400">
            Loading...
          </p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-zinc-900 p-10 text-center">
            <div className="text-6xl">🔔</div>
            <h2 className="mt-5 text-xl font-bold">
              No Notifications
            </h2>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl bg-zinc-900 p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black">
                    🔔
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <h2 className="font-bold">
                        {item.title}
                      </h2>

                      {!item.read && (
                        <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      {item.message}
                    </p>

                    {item.orderId && (
                      <Link
                        href={`/orders/${item.orderId}`}
                      >
                        <button className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold">
                          View Order
                        </button>
                      </Link>
                    )}

                    <div className="mt-4 flex gap-5">
                      {!item.read && (
                        <button
                          onClick={() =>
                            read(item.id)
                          }
                          className="text-sm font-bold text-yellow-400"
                        >
                          Mark as Read
                        </button>
                      )}

                      <button
                        onClick={() =>
                          remove(item.id)
                        }
                        className="text-sm font-bold text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
