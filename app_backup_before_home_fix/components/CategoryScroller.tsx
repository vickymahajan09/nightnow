"use client";

interface CategoryScrollerProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const categories = [
  { name: "All", icon: "🛍️" },
  { name: "Grocery", icon: "🛒" },
  { name: "Snacks", icon: "🍿" },
  { name: "Beverages", icon: "🥤" },
  { name: "Personal Care", icon: "🧴" },
  { name: "Pharmacy", icon: "💊" },
  { name: "Household", icon: "🏠" },
  { name: "Dairy", icon: "🥛" },
];

export default function CategoryScroller({
  selectedCategory = "",
  onSelectCategory,
}: CategoryScrollerProps) {
  return (
    <section className="bg-black px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">
            Shop by Category
          </h2>

          <span className="text-xs text-zinc-500">
            Explore
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const active =
              category.name === "All"
                ? selectedCategory === ""
                : selectedCategory === category.name;

            return (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  onSelectCategory?.(
                    category.name === "All"
                      ? ""
                      : category.name
                  )
                }
                className={`flex min-w-[90px] shrink-0 flex-col items-center rounded-2xl border p-3 transition ${
                  active
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-zinc-800 bg-zinc-900 text-white hover:border-yellow-400"
                }`}
              >
                <span className="text-3xl">
                  {category.icon}
                </span>

                <span className="mt-2 whitespace-nowrap text-xs font-bold">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}