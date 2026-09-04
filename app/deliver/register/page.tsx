"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerDeliveryPartner } from "../../services/deliveryPartnerService";

export default function DeliveryPartnerRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    setLoading(true);

    try {
      await registerDeliveryPartner(name, phone, email, password);
      router.replace("/deliver/dashboard");
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("email-already-in-use")) {
        setError("Ye email pehle se registered hai. Login karein.");
      } else {
        setError(err?.message || "Registration fail ho gaya.");
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
          Delivery Partner Signup
        </h1>

        <p className="mt-1 text-center text-xs text-zinc-400">
          NightNow ke saath delivery partner ban jayein.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          />

          <input
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            inputMode="numeric"
            placeholder="10 Digit Mobile Number"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-yellow-400"
          />

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
            placeholder="Password (min 6 characters)"
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already a partner?{" "}
          <Link href="/deliver/login" className="font-bold text-yellow-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
