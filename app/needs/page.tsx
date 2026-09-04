"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNeeds, type Need } from "../services/needService";

export default function NeedsPage() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [selected, setSelected] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNeeds()
      .then((items) => setNeeds(items.filter((item) => item.active !== false)))
      .catch((error) => console.error("Needs loading error:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-900 dark:text-white">
          <p className="text-xs font-black text-yellow-600">NIGHT NOW SMART</p>
          <h1 className="mt-1 text-3xl font-black">आपकी जरूरत क्या है?</h1>
          <p className="mt-2 text-sm text-slate-500">
            Product ka naam yaad nahi hai? Bas apni need select karein.
          </p>
        </div>

        {loading ? (
          <div className="mt-5 rounded-3xl bg-white p-8 text-center text-slate-500 dark:bg-zinc-900">
            Loading needs...
          </div>
        ) : needs.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-white p-8 text-center text-slate-500 dark:bg-zinc-900">
            Abhi koi active need available nahi hai.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {needs.map((need) => (
              <button
                key={need.id}
                type="button"
                onClick={() => setSelected(need)}
                className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:ring-2 hover:ring-yellow-400 dark:bg-zinc-900 dark:text-white"
              >
                <div className="text-4xl">{need.icon}</div>
                <p className="mt-4 text-sm font-black">{need.title}</p>
                {need.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {need.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm dark:bg-zinc-900 dark:text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-yellow-600">SUGGESTED SEARCH</p>
                <h2 className="mt-1 text-2xl font-black">
                  {selected.icon} {selected.title}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl text-slate-400">×</button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selected.keywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/?search=${encodeURIComponent(keyword)}`}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black text-black"
                >
                  {keyword}
                </Link>
              ))}
              {selected.brandIds.map((brandId) => (
                <Link
                  key={brandId}
                  href={`/?need=${encodeURIComponent(selected.id)}`}
                  className="rounded-xl bg-zinc-100 px-4 py-3 text-xs font-black dark:bg-zinc-800"
                >
                  View selected products
                </Link>
              ))}
            </div>

            {selected.keywords.length === 0 && selected.productIds.length === 0 && selected.brandIds.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">No products or keywords linked to this need yet.</p>
            )}

            <Link href="/cart" className="mt-5 block rounded-2xl bg-slate-900 py-4 text-center font-black text-white">
              🛒 View Cart
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}