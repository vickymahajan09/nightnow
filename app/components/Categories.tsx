"use client";

const categories = [
  {
    id: "all",
    name: "All",
    icon: "✨",
    bg: "bg-yellow-50",
  },
  {
    id: "grocery",
    name: "Grocery",
    icon: "🛒",
    bg: "bg-green-50",
  },
  {
    id: "snacks",
    name: "Snacks",
    icon: "🍿",
    bg: "bg-orange-50",
  },
  {
    id: "beverages",
    name: "Drinks",
    icon: "🥤",
    bg: "bg-blue-50",
  },
  {
    id: "dairy",
    name: "Dairy",
    icon: "🥛",
    bg: "bg-cyan-50",
  },
  {
    id: "baby",
    name: "Baby Care",
    icon: "👶",
    bg: "bg-pink-50",
  },
  {
    id: "personal care",
    name: "Personal Care",
    icon: "🧴",
    bg: "bg-purple-50",
  },
  {
    id: "household",
    name: "Household",
    icon: "🏠",
    bg: "bg-amber-50",
  },
  {
    id: "chocolate",
    name: "Chocolate",
    icon: "🍫",
    bg: "bg-rose-50",
  },
  {
    id: "ice cream",
    name: "Ice Cream",
    icon: "🍦",
    bg: "bg-indigo-50",
  },
  {
    id: "vegetables",
    name: "Vegetables",
    icon: "🥦",
    bg: "bg-emerald-50",
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: "🍎",
    bg: "bg-red-50",
  },
];

export default function Categories({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string;
  onSelectCategory: (
    category: string
  ) => void;
}) {
  const activeCategory =
    selectedCategory || "all";

  return (
    <section className="bg-[#f7f8fa] px-4 py-5">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-black text-zinc-900">
              Shop by Category
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Choose your category
            </p>
          </div>

          {activeCategory !== "all" && (
            <button
              type="button"
              onClick={() =>
                onSelectCategory("")
              }
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-zinc-600 shadow-sm"
            >
              Clear
            </button>
          )}

        </div>

        {/* CATEGORY SCROLL */}

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

          {categories.map(
            (category) => {

              const isActive =
                category.id ===
                activeCategory;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    onSelectCategory(
                      category.id === "all"
                        ? ""
                        : category.id
                    )
                  }
                  className={`flex min-w-[92px] shrink-0 flex-col items-center rounded-2xl border p-3 transition active:scale-95 ${
                    isActive
                      ? "border-yellow-400 bg-yellow-100 shadow-sm"
                      : `border-zinc-200 ${category.bg} hover:border-yellow-300`
                  }`}
                >

                  {/* ICON */}

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                      isActive
                        ? "bg-yellow-400"
                        : "bg-white"
                    }`}
                  >
                    {category.icon}
                  </div>

                  {/* NAME */}

                  <span
                    className={`mt-2 text-xs font-black ${
                      isActive
                        ? "text-zinc-900"
                        : "text-zinc-700"
                    }`}
                  >
                    {category.name}
                  </span>

                </button>
              );
            }
          )}

        </div>

      </div>

    </section>
  );
}