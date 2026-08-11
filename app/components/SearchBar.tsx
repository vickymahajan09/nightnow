"use client";

import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <section className="bg-white px-4 pb-4 pt-2 text-black">
      <div className="mx-auto max-w-7xl">
        <div
          className={`flex items-center gap-3 rounded-2xl border bg-zinc-100 px-4 transition ${
            focused
              ? "border-yellow-400 bg-white shadow-md"
              : "border-transparent"
          }`}
        >
          <span className="text-xl">
            🔍
          </span>

          <input
            type="text"
            value={value}
            onChange={(e) =>
              onChange(e.target.value)
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search for medicines, groceries & more"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-500"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-300 text-sm font-bold hover:bg-zinc-400"
            >
              ×
            </button>
          )}

          <button
            type="button"
            className="hidden rounded-xl bg-black px-4 py-2 text-sm font-bold text-white sm:block"
          >
            Search
          </button>
        </div>

        {!value && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 text-xs">
            {[
              "Medicines",
              "Grocery",
              "Snacks",
              "Dairy",
              "Beverages",
              "Personal Care",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className="shrink-0 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 hover:bg-yellow-100 hover:text-black"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}