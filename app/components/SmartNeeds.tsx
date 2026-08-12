"use client";

import { useState } from "react";

const scenarios = [
  { id: "party", icon: "🎉", title: "मुझे पार्टी करनी है", items: ["Chips", "Cold Drinks", "Namkeen", "Ice", "Disposable Plates", "Tissue"] },
  { id: "guests", icon: "👨‍👩‍👧", title: "मेहमान आने वाले हैं", items: ["Snacks", "Cold Drinks", "Biscuits", "Chocolates", "Plates", "Tissue"] },
  { id: "baby", icon: "👶", title: "Baby Emergency", items: ["Diapers", "Baby Wipes", "Baby Care", "Baby Food"] },
  { id: "home", icon: "🏠", title: "घर का सामान खत्म हो गया", items: ["Milk", "Bread", "Eggs", "Atta", "Oil", "Daily Essentials"] },
  { id: "midnight", icon: "🌙", title: "Midnight Snacks", items: ["Chips", "Chocolate", "Cold Drink", "Ice Cream", "Namkeen"] },
  { id: "personal", icon: "🧴", title: "Personal Care", items: ["Soap", "Shampoo", "Toothpaste", "Skin Care"] },
];

export default function SmartNeeds() {
  const [selected, setSelected] = useState<any>(null);
  const [text, setText] = useState("");

  const choose = (scenario: any) => setSelected(scenario);

  return (
    <section className="bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-7">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Night Now Smart</p>
          <h2 className="mt-1 text-2xl font-black md:text-3xl">Night Now: “आपकी जरूरत क्या है?”</h2>
          <p className="mt-2 text-sm text-zinc-400">Product ढूँढने के बजाय अपनी जरूरत बताइए — हम सही items suggest करेंगे.</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {scenarios.map((item) => (
              <button key={item.id} type="button" onClick={() => choose(item)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-yellow-400 hover:bg-zinc-800">
                <div className="text-3xl">{item.icon}</div>
                <p className="mt-3 text-sm font-black">{item.title}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
            <p className="text-sm font-bold text-zinc-300">🤖 मुझे पता नहीं क्या चाहिए</p>
            <div className="mt-3 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="जैसे: रात में 5 लोगों के लिए कुछ खाने-पीने का चाहिए" className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
              <button type="button" onClick={() => setSelected({ title: "आपकी जरूरत", items: [text || "Daily Essentials"] })} className="rounded-xl bg-yellow-400 px-4 font-black text-black">Find</button>
            </div>
          </div>

          {selected && (
            <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-zinc-900 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-yellow-400">Smart Suggestion</p>
                  <h3 className="mt-1 text-xl font-black">{selected.title}</h3>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-zinc-500">✕</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.items.map((item: string) => (
                  <span key={item} className="rounded-full bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200">{item}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-500">अभी यह Smart Scenario suggestions हैं. अगला step इन्हें आपके actual stock/products से automatic cart में जोड़ना होगा.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
