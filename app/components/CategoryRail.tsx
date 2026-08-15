"use client";

import Link from "next/link";

const categories = [
  { label: "All", icon: "🛍️", value: "" },
  { label: "Medicines", icon: "💊", value: "Medicines" },
  { label: "Grocery", icon: "🛒", value: "Grocery" },
  { label: "Dairy", icon: "🥛", value: "Dairy" },
  { label: "Personal Care", icon: "🧴", value: "Personal Care" },
  { label: "Baby Care", icon: "👶", value: "Baby Care" },
  { label: "Pet Care", icon: "🐶", value: "Pet Care" },
];

export default function CategoryRail({ selected = "" }: { selected?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-3 pb-1">
        {categories.map((item) => {
          const active = selected.toLowerCase() === item.value.toLowerCase();
          const href = item.value ? `/?category=${encodeURIComponent(item.value)}` : "/";
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "border-yellow-400 bg-yellow-50 text-zinc-950 shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
