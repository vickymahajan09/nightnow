"use client";

import { useEffect, useState } from "react";

import {
  addNotification,
  getNotifications,
  deleteNotification,
} from "../../services/notificationService";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await getNotifications());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      await addNotification(
        title,
        message
      );

      setTitle("");
      setMessage("");

      await load();

      alert("Notification Added");
    } catch (error) {
      console.error(error);
      alert("Failed to add notification");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete notification?")) return;

    try {
      await deleteNotification(id);

      setItems((old) =>
        old.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete notification");
    }
  };

  return (
    <main className="min-h-screen bg-black p-5 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black text-yellow-400">
          Notifications
        </h1>

        <p className="mt-1 text-zinc-500">
          Admin notification management
        </p>

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">
          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Notification Title"
            className="mb-4 w-full rounded-xl bg-zinc-800 p-4 outline-none"
          />

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Notification Message"
            rows={4}
            className="mb-4 w-full rounded-xl bg-zinc-800 p-4 outline-none"
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Add Notification"}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-center text-zinc-500">
              Loading...
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">
              No Notifications
            </div>
          ) : (
            items.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl bg-zinc-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-zinc-400">
                      {item.message}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      remove(item.id)
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
