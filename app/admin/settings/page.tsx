"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Night Now");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(
      "nightnow_settings"
    );

    if (saved) {
      try {
        const data = JSON.parse(saved);

        setStoreName(data.storeName || "Night Now");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const saveSettings = () => {
    setSaving(true);

    localStorage.setItem(
      "nightnow_settings",
      JSON.stringify({
        storeName,
        phone,
        email,
        address,
      })
    );

    setTimeout(() => {
      setSaving(false);
      alert("Settings Saved Successfully");
    }, 500);
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white md:p-8">

      <div className="mx-auto max-w-3xl">

        <h1 className="text-4xl font-black text-yellow-400">
          Store Settings
        </h1>

        <p className="mt-1 text-zinc-400">
          Manage your store information
        </p>

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Store Name
              </label>

              <input
                value={storeName}
                onChange={(e) =>
                  setStoreName(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter phone number"
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter email"
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Store Address
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                rows={4}
                placeholder="Enter store address"
                className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full rounded-xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}