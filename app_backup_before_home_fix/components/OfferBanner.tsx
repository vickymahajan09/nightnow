"use client";

import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="border-b border-zinc-100 bg-white px-4 py-3">
      <div className="mx-auto max-w-7xl">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            value={value}
            onChange={(e) =>
              onChange(e.target.value)
            }
            placeholder="Search products..."
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-12 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-100"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-200 text-zinc-600"
            >
              <X size={17} />
            </button>
          )}

        </div>

      </div>
    </div>
  );
}