"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  useEffect(() => {
    try {
      localStorage.removeItem(
        "nightnow-payment-pending"
      );
    } catch {}
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-black">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-black">
          Payment Successful!
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Your Night Now order has been
          successfully placed.
        </p>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm">
          🚀 Your order is being processed.
        </div>

        <div className="mt-6 space-y-3">

          <Link href="/orders">
            <button className="w-full rounded-xl bg-yellow-400 py-4 font-black">
              Track My Order →
            </button>
          </Link>

          <Link href="/">
            <button className="w-full rounded-xl bg-black py-4 font-black text-white">
              Continue Shopping
            </button>
          </Link>

        </div>

      </div>
    </main>
  );
}