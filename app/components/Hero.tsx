"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-black px-4 py-10 text-white md:py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">

        {/* LEFT */}
        <div>

          <div className="mb-5 inline-flex rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-400">
            ⚡ 15 Minute Delivery
          </div>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Everything You Need,
            <span className="block text-yellow-400">
              Delivered Fast.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
            Groceries, snacks, dairy, personal care and daily essentials
            delivered to your doorstep with Night Now.
          </p>

          {/* HINDI QUOTE */}
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-zinc-900 p-5">
            <p className="text-lg font-bold text-white">
              "रात हो या दिन,
              <span className="text-yellow-400">
                {" "}Night Now हर जरूरत आपके घर तक।"
              </span>
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">

            <Link href="#products">
              <button className="rounded-xl bg-yellow-400 px-7 py-3 font-black text-black transition hover:bg-yellow-300">
                Start Shopping
              </button>
            </Link>

            <Link href="/orders">
              <button className="rounded-xl bg-zinc-800 px-7 py-3 font-bold text-white transition hover:bg-zinc-700">
                My Orders
              </button>
            </Link>

          </div>

        </div>

        {/* RIGHT — NIGHT NOW IMAGE */}
        <div className="flex justify-center">

          <div className="relative flex w-full max-w-md items-center justify-center overflow-hidden rounded-3xl bg-zinc-900 p-6 shadow-2xl">

            <img
              src="/nightnow.png"
              alt="Night Now"
              className="h-auto max-h-96 w-full object-contain"
            />

          </div>

        </div>

      </div>
    </section>
  );
}