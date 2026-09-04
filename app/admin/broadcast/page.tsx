"use client";

import { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; totalTokens: number } | null>(null);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Please enter both a title and a message.");
      return;
    }

    if (!confirm(`Send this notification to ALL customers right now?\n\n"${title}"\n${body}`)) {
      return;
    }

    setError("");
    setResult(null);
    setSending(true);

    try {
      const user = await new Promise<any>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          unsubscribe();
          resolve(u);
        });
      });

      if (!user) {
        setError("Please login again.");
        setSending(false);
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
        }),
      });

      const rawText = await response.text();
      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // The server returned something that isn't JSON at all —
        // most likely a platform/framework error page (404/500 HTML)
        // rather than our route's own JSON response. Surface enough
        // of it to debug instead of crashing on .json().
        setError(
          `Server didn't return a valid response (status ${response.status}). ` +
            "This usually means the API route didn't run — check that " +
            "FIREBASE_SERVICE_ACCOUNT_BASE64 (or the admin env vars) are " +
            "set on the server, then redeploy. " +
            `Raw response: ${rawText.slice(0, 200)}`
        );
        return;
      }

      if (!response.ok || !data?.success) {
        setError(data?.error || "Failed to send broadcast.");
        return;
      }

      setResult({
        sent: data.sent ?? 0,
        failed: data.failed ?? 0,
        totalTokens: data.totalTokens ?? 0,
      });

      setTitle("");
      setBody("");
      setUrl("");
    } catch (err: any) {
      setError(err?.message || "Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black text-yellow-400 sm:text-4xl">📣 Broadcast Notification</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Send a push notification to every customer who has notifications enabled — great for offers,
          festival sales, or "we're back online" announcements.
        </p>

        <div className="mt-6 space-y-4 rounded-2xl bg-zinc-900 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-black text-zinc-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎉 Flat 20% OFF Today!"
              maxLength={65}
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-zinc-400">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Use code NIGHT20 on all orders above ₹299. Valid till midnight!"
              rows={3}
              maxLength={200}
              className="w-full resize-none rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-zinc-400">
              Link when tapped (optional)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/offers or /categories"
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {error && <p className="text-xs font-bold text-red-400">{error}</p>}

          {result && (
            <div className="rounded-xl bg-green-950 p-3 text-xs font-semibold text-green-300">
              ✅ Sent to {result.sent} of {result.totalTokens} devices
              {result.failed > 0 ? ` (${result.failed} failed)` : ""}.
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50"
          >
            {sending ? "Sending..." : "📣 Send to All Customers"}
          </button>
        </div>
      </div>
    </main>
  );
}
