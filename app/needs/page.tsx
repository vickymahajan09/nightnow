"use client";

import { useState } from "react";
import Link from "next/link";

const needs = [
  {
    icon: "🎉",
    title: "मुझे पार्टी करनी है",
    items: [
      "Chips",
      "Cold Drinks",
      "Namkeen",
      "Ice",
      "Disposable Plates",
      "Tissue",
    ],
  },
  {
    icon: "👨‍👩‍👧",
    title: "मेहमान आने वाले हैं",
    items: [
      "Snacks",
      "Biscuits",
      "Cold Drinks",
      "Chocolates",
      "Plates",
      "Tissue",
    ],
  },
  {
    icon: "👶",
    title: "Baby Emergency",
    items: [
      "Diapers",
      "Baby Wipes",
      "Baby Care",
      "Baby Food",
    ],
  },
  {
    icon: "🏠",
    title: "घर का सामान खत्म हो गया",
    items: [
      "Milk",
      "Bread",
      "Eggs",
      "Atta",
      "Oil",
      "Daily Essentials",
    ],
  },
  {
    icon: "🌙",
    title: "Midnight Snacks",
    items: [
      "Chips",
      "Chocolate",
      "Cold Drink",
      "Ice Cream",
      "Namkeen",
    ],
  },
  {
    icon: "🧴",
    title: "Personal Care",
    items: [
      "Soap",
      "Shampoo",
      "Toothpaste",
      "Skin Care",
    ],
  },
];

export default function NeedsPage() {
  const [selected, setSelected] =
    useState<
      (typeof needs)[number] | null
    >(null);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">

      <div className="mx-auto max-w-6xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW SMART
          </p>

          <h1 className="mt-1 text-3xl font-black">
            आपकी जरूरत क्या है?
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Product ka naam yaad nahi hai?
            Bas apni need select karein.
          </p>

        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">

          {needs.map((need) => (
            <button
              key={need.title}
              type="button"
              onClick={() =>
                setSelected(
                  need
                )
              }
              className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:ring-2 hover:ring-yellow-400"
            >

              <div className="text-4xl">
                {need.icon}
              </div>

              <p className="mt-4 text-sm font-black">
                {need.title}
              </p>

            </button>
          ))}

        </div>

        {selected && (
          <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-black text-yellow-600">
                  SUGGESTED ITEMS
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {selected.icon}{" "}
                  {selected.title}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="text-2xl text-slate-400"
              >
                ×
              </button>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">

              {selected.items.map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <span className="font-bold">
                      {item}
                    </span>

                    <Link
                      href={`/?search=${encodeURIComponent(
                        item
                      )}`}
                      className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black"
                    >
                      Add
                    </Link>

                  </div>
                )
              )}

            </div>

            <Link
              href="/cart"
              className="mt-5 block rounded-2xl bg-slate-900 py-4 text-center font-black text-white"
            >
              🛒 View Cart
            </Link>

          </section>
        )}

      </div>

    </main>
  );
}