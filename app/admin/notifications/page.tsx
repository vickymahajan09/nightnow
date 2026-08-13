"use client";

import { useEffect, useState } from "react";

import {
  addNotification,
  getNotifications,
  deleteNotification,
} from "../../services/notificationService";

type Notification = {
  id: string;
  title?: string;
  message?: string;
  active?: boolean;
  createdAt?: any;
};

export default function AdminNotificationsPage() {
  const [title, setTitle] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    notifications,
    setNotifications,
  ] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const load =
    async () => {
      try {
        const data =
          await getNotifications();

        const sorted =
          (
            data as Notification[]
          ).sort(
            (a, b) =>
              getTime(
                b.createdAt
              ) -
              getTime(
                a.createdAt
              )
          );

        setNotifications(
          sorted
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  const create =
    async () => {
      if (!title.trim()) {
        alert(
          "Notification title required"
        );
        return;
      }

      if (!message.trim()) {
        alert(
          "Notification message required"
        );
        return;
      }

      try {
        setLoading(true);

        await addNotification(
          title.trim(),
          message.trim()
        );

        setTitle("");
        setMessage("");

        await load();

        alert(
          "✅ Notification sent"
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Notification failed"
        );
      } finally {
        setLoading(false);
      }
    };

  const remove =
    async (
      id: string
    ) => {
      if (
        !confirm(
          "Delete notification?"
        )
      ) {
        return;
      }

      try {
        await deleteNotification(
          id
        );

        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id
            )
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Delete failed"
        );
      }
    };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">

      <div className="mx-auto max-w-5xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Customer ko announcement / offer / update bhejein.
          </p>

        </div>

        {/* CREATE */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Create Notification
          </h2>

          <div className="mt-5 space-y-4">

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Title"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
            />

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Message..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={
                create
              }
              disabled={loading}
              className="rounded-2xl bg-yellow-400 px-7 py-3 font-black text-black disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "🔔 Send Notification"}
            </button>

          </div>

        </section>

        {/* LIST */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Sent Notifications
          </h2>

          <div className="mt-5 space-y-3">

            {notifications.length ===
              0 ? (

              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                No notifications.
              </div>

            ) : (

              notifications.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3 className="font-black">
                          🔔{" "}
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(
                            item.createdAt
                          )}
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          remove(
                            item.id
                          )
                        }
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                )
              )

            )}

          </div>

        </section>

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