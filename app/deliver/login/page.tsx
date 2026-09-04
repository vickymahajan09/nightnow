"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { loginDeliveryPartner } from "../../services/deliveryPartnerService";

export default function DeliveryPartnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginDeliveryPartner(email, password);
      router.replace("/deliver/dashboard");
    } catch (err: any) {
      const code = err?.code || "";
      if (
        code.includes("wrong-password") ||
        code.includes("invalid-credential") ||
        code.includes("user-not-found")
      ) {
        setError("Email ya password galat hai.");
      } else {
        setError(err?.message || "Login fail ho gaya.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-white">
      <div className="w-full max-w-sm">
        <p className="text-center text-3xl">🛵</p>

        <h1 className="mt-2 text-center text-xl font-black">
          Delivery Partner Login
        </h1>

        <p className="mt-1 text-center text-xs text-zinc-400">
          NightNow delivery partner account se login karein.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          />

          {error && (
            <p className="rounded-xl bg-red-950 p-3 text-xs font-semibold text-red-300">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-black text-black disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          New partner?{" "}
          <Link href="/deliver/register" className="font-bold text-yellow-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
