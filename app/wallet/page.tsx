"use client";

import Link from "next/link";

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/profile"
          className="text-sm font-bold text-zinc-500"
        >
          ← Profile
        </Link>

        <section className="mt-5 rounded-3xl bg-black p-6 text-white">
          <p className="text-xs font-bold text-zinc-400">
            NIGHT NOW WALLET
          </p>

          <p className="mt-3 text-4xl font-black text-yellow-400">
            ₹0
          </p>

          <p className="mt-2 text-xs text-zinc-400">
            Available wallet balance
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h2 className="font-black">
            Wallet
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Cancelled eligible orders ka refund
            wallet me show hoga.
          </p>
        </section>

      </div>
    </main>
  );
}