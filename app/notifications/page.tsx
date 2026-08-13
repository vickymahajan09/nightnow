"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

type Notification = {
  id: string;
  title?: string;
  message?: string;
  active?: boolean;
  createdAt?: any;
};

export default function NotificationsPage() {
  const [
    notifications,
    setNotifications,
  ] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const load =
      async () => {
        try {
          const snapshot =
            await getDocs(
              collection(
                db,
                "notifications"
              )
            );

          const data =
            snapshot.docs
              .map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              )
              .filter(
                (item: any) =>
                  item.active !==
                  false
              )
              .sort(
                (a: any, b: any) =>
                  getTime(
                    b.createdAt
                  ) -
                  getTime(
                    a.createdAt
                  )
              ) as Notification[];

          setNotifications(
            data
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(false);
        }
      };

    load();
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

        ) : notifications.length ===
          0 ? (

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

            {notifications.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >

                  <div className="flex gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
                      🔔
                    </div>

                    <div className="min-w-0">

                      <h2 className="font-black">
                        {item.title ||
                          "Night Now"}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(
                          item.createdAt
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        )}

      </div>

    </main>
  );
}

function getTime(
  value: any
) {
  if (!value) return 0;

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    value?.seconds
  ) {
    return value.seconds * 1000;
  }

  return (
    new Date(value).getTime() ||
    0
  );
}

function formatDate(
  value: any
) {
  const time =
    getTime(value);

  if (!time) return "";

  return new Date(
    time
  ).toLocaleString(
    "en-IN"
  );
}