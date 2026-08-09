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
    <div className="bg-black px-4 py-5">
      <div className="mx-auto max-w-3xl">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🔍 Search medicines, grocery, dairy..."
          className="w-full rounded-xl border-2 border-yellow-400 bg-zinc-900 px-5 py-4 text-white outline-none"
        />
      </div>
    </div>
  );
}