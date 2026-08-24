"use client";

import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { icon: "⚡", title: "10 Min Delivery", href: "#products" },
    { icon: "🔥", title: "Best Sellers", href: "#products" },
    { icon: "🎁", title: "Offers", href: "#offers" },
    { icon: "💊", title: "Pharmacy", href: "#products" },
    { icon: "🥤", title: "Beverages", href: "#products" },
    { icon: "🍪", title: "Snacks", href: "#products" },
  ];

  return (
    <section className="bg-black px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex min-w-[105px] shrink-0 flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center transition hover:border-yellow-400 hover:bg-zinc-800"
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="mt-2 text-xs font-bold text-white">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}