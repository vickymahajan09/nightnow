"use client";

import Link from "next/link";

export default function OfferBanner() {
  return (
    <section className="bg-white px-4 py-3 text-black">
      <div className="mx-auto max-w-7xl">

        <div className="grid gap-3 sm:grid-cols-3">

          <div className="flex items-center gap-3 rounded-2xl bg-yellow-100 p-4">
            <div className="text-3xl">
              🎁
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500">
                FIRST ORDER
              </p>

              <p className="font-black">
                FREE DELIVERY
              </p>

              <p className="text-xs text-zinc-600">
                Your first order is on us
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-green-100 p-4">
            <div className="text-3xl">
              🚀
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500">
                FAST DELIVERY
              </p>

              <p className="font-black">
                At Your Doorstep
              </p>

              <p className="text-xs text-zinc-600">
                Quick & reliable delivery
              </p>
            </div>
          </div>

          <Link
            href="/#products"
            className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-4 transition hover:bg-zinc-200"
          >
            <div className="text-3xl">
              🔥
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500">
                NIGHT NOW DEALS
              </p>

              <p className="font-black">
                Shop Best Sellers
              </p>

              <p className="text-xs text-zinc-600">
                Grab today's deals
              </p>
            </div>

            <span className="ml-auto font-black">
              →
            </span>
          </Link>

        </div>

      </div>
    </section>
  );
}