"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="bg-black px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="relative">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">
            🔍
          </span>

          <input
            type="text"
            value={value}
            onChange={(e) =>
              onChange(e.target.value)
            }
            placeholder="Search medicines, grocery, snacks..."
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-4 pl-12 pr-5 text-white shadow-lg outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          />

        </div>
      </div>
    </div>
  );
}