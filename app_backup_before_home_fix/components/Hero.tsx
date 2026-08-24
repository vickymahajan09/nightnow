"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white px-4 py-4 text-black">
      <div className="mx-auto max-w-7xl">

        <div className="relative overflow-hidden rounded-3xl bg-black">

          {/* BACKGROUND */}

          <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-yellow-500/20" />

          {/* CONTENT */}

          <div className="relative grid min-h-[280px] items-center gap-6 px-6 py-10 sm:px-10 md:min-h-[340px] md:grid-cols-2 md:px-14">

            {/* LEFT */}

            <div className="max-w-xl text-white">

              <div className="mb-4 inline-flex rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-black">
                ⚡ NIGHT DELIVERY
              </div>

              <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
                Everything you need.
                <br />

                <span className="text-yellow-400">
                  Delivered Fast.
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300 sm:text-base">
                Medicines, groceries, dairy, snacks
                and everyday essentials — delivered
                right to your doorstep.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                <Link href="#products">
                  <button
                    type="button"
                    className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300"
                  >
                    Shop Now →
                  </button>
                </Link>

                <Link href="/cart">
                  <button
                    type="button"
                    className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    🛒 View Cart
                  </button>
                </Link>

              </div>

            </div>

            {/* RIGHT */}

            <div className="relative hidden min-h-[250px] items-center justify-center md:flex">

              <div className="absolute h-56 w-56 rounded-full bg-yellow-400/20 blur-3xl" />

              <div className="relative text-center">

                <div className="text-8xl lg:text-9xl">
                  🛵
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-md">

                  <p className="text-xs font-semibold text-zinc-300">
                    DELIVERY STARTS FROM
                  </p>

                  <p className="text-2xl font-black text-yellow-400">
                    ₹30
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* QUICK BENEFITS */}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-2xl bg-zinc-100 p-4">
            <div className="text-2xl">
              ⚡
            </div>
            <p className="mt-2 text-sm font-black">
              Fast Delivery
            </p>
            <p className="text-xs text-zinc-500">
              Get it at your doorstep
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-100 p-4">
            <div className="text-2xl">
              💊
            </div>
            <p className="mt-2 text-sm font-black">
              Medicines
            </p>
            <p className="text-xs text-zinc-500">
              Essential healthcare
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-100 p-4">
            <div className="text-2xl">
              🛒
            </div>
            <p className="mt-2 text-sm font-black">
              Daily Essentials
            </p>
            <p className="text-xs text-zinc-500">
              Grocery & more
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-100 p-4">
            <div className="text-2xl">
              💳
            </div>
            <p className="mt-2 text-sm font-black">
              Easy Payment
            </p>
            <p className="text-xs text-zinc-500">
              COD & Online Payment
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}