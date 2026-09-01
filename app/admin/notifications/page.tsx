"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

type Notification = {
  id: string;
  audience?: string;
  title?: string;
  message?: string;
  type?: string;
  status?: string;
  orderId?: string;
  read?: boolean;
  active?: boolean;
  createdAt?: any;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("audience", "==", "admin"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map(
            (item) =>
              ({
                id: item.id,
                ...item.data(),
              }) as Notification
          )
          .filter(
            (item) =>
              item.active !== false
          );

        setNotifications(data);
        setLoading(false);
        setError("");
      },
      (error) => {
        console.error(
          "Admin notifications subscription error:",
          error
        );

        setNotifications([]);
        setLoading(false);
        setError(
          "Unable to load notifications."
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Notifications
          </h1>
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold">
            Loading...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              ⚠️
            </div>

            <p className="mt-4 font-black">
              {error}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              🔔
            </div>

            <p className="mt-4 font-black">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">

            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl bg-white p-5 shadow-sm ${
                  item.read === false
                    ? "ring-2 ring-yellow-200"
                    : ""
                }`}
              >
                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
                    🔔
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <h2 className="font-black">
                        {item.title ||
                          "Night Now"}
                      </h2>

                      {item.read === false && (
                        <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-black text-yellow-700">
                          NEW
                        </span>
                      )}

                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>

                    {item.orderId && (
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        Order: #
                        {item.orderId.slice(
                          0,
                          8
                        )}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(
                        item.createdAt
                      )}
                    </p>

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

function getTime(value: any) {
  if (!value) return 0;

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return value.seconds * 1000;
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDate(value: any) {
  const time =
    getTime(value);

  if (!time) return "";

  return new Date(
    time
  ).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}