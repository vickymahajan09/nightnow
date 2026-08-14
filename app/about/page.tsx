"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">

      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl bg-black p-7 text-white">

          <div className="text-3xl font-black">
            Night
            <span className="text-yellow-400">
              Now
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            Fast delivery. Anytime.
          </p>

        </section>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-900">

          <h1 className="text-2xl font-black">
            About Us
          </h1>

          <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
            Night Now is a fast-delivery platform
            designed to make everyday shopping
            simple, convenient and reliable.
          </p>

          <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
            Customers can discover everyday
            essentials, groceries, personal care
            products, medicines and other useful
            products from one convenient platform.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <div className="text-2xl">
                ⚡
              </div>
              <p className="mt-2 font-black">
                Fast
              </p>
              <p className="text-xs text-zinc-500">
                Quick delivery experience.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <div className="text-2xl">
                🛒
              </div>
              <p className="mt-2 font-black">
                Convenient
              </p>
              <p className="text-xs text-zinc-500">
                Everything in one place.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <div className="text-2xl">
                🔒
              </div>
              <p className="mt-2 font-black">
                Reliable
              </p>
              <p className="text-xs text-zinc-500">
                Safe and simple shopping.
              </p>
            </div>

          </div>

        </section>

      </div>

    </main>
  );
}