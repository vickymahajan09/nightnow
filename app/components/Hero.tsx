"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2">

        <div>
          <div className="mb-4 inline-block rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400">
           ⚡ 15 Minute Delivery
           <p className="mt-3 text-lg font-bold text-yellow-400">
  "Raat ho ya din, zarurat ki cheez Night Now se turant."
</p>
          </div>

          <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
            Everything You Need,
            <span className="block text-yellow-400">
              Delivered Fast.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-zinc-400">
            Medicines, grocery, dairy and daily essentials
            delivered to your doorstep with Night Now.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#products">
              <button className="rounded-xl bg-yellow-400 px-7 py-3 font-bold text-black hover:bg-yellow-500">
                Start Shopping
              </button>
            </Link>

            <Link href="/orders">
              <button className="rounded-xl bg-zinc-800 px-7 py-3 font-bold text-white hover:bg-zinc-700">
                My Orders
              </button>
            </Link>
          </div>
        </div>

        {/* DELIVERY IMAGE */}
        <div className="flex justify-center">
          <div className="relative flex h-72 w-full max-w-md items-center justify-center overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl md:h-96">

            <img
              src="/nightnow-bike.png"
              alt="Night Now Delivery"
              className="h-full w-full object-contain p-6"
            />

          </div>
        </div>

      </div>
    </section>
  );
}