"use client";

import { useEffect, useState } from "react";

import { getCategories } from "../services/categoryService";

interface CategoriesProps {
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
}

export default function Categories({
  selectedCategory = "",
  onSelectCategory,
}: CategoriesProps) {
  const [categories, setCategories] = useState<any[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(
          data.filter(
            (item: any) =>
              item.active !== false
          )
        );
      } catch (error) {
        console.error(
          "Category loading failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const fallbackCategories = [
    {
      id: "medicine",
      name: "Medicines",
      icon: "💊",
    },
    {
      id: "grocery",
      name: "Grocery",
      icon: "🛒",
    },
    {
      id: "snacks",
      name: "Snacks",
      icon: "🍿",
    },
    {
      id: "dairy",
      name: "Dairy",
      icon: "🥛",
    },
    {
      id: "beverages",
      name: "Beverages",
      icon: "🥤",
    },
    {
      id: "personal-care",
      name: "Personal Care",
      icon: "🧴",
    },
    {
      id: "baby-care",
      name: "Baby Care",
      icon: "🍼",
    },
    {
      id: "household",
      name: "Household",
      icon: "🏠",
    },
  ];

  const displayCategories =
    categories.length > 0
      ? categories
      : fallbackCategories;

  return (
    <section className="bg-white px-4 py-5 text-black">
      <div className="mx-auto max-w-7xl">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              Shop by Category
            </h2>

            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Everything you need, all in one place
            </p>
          </div>

          {selectedCategory && (
            <button
              type="button"
              onClick={() =>
                onSelectCategory("")
              }
              className="text-xs font-bold text-yellow-600"
            >
              Clear
            </button>
          )}

        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-zinc-100"
                />
              )
            )}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">

            {displayCategories.map(
              (item: any, index: number) => {
                const name =
                  item.name ||
                  item.title ||
                  "Category";

                const icon =
                  item.icon ||
                  item.emoji ||
                  ["💊", "🛒", "🍿", "🥛", "🥤", "🧴", "🍼", "🏠"][
                    index % 8
                  ];

                const categoryValue =
                  item.name || item.title || "";

                const active =
                  selectedCategory ===
                  categoryValue;

                return (
                  <button
                    key={
                      item.id ||
                      `${name}-${index}`
                    }
                    type="button"
                    onClick={() =>
                      onSelectCategory(
                        active
                          ? ""
                          : categoryValue
                      )
                    }
                    className={`group flex w-24 shrink-0 flex-col items-center rounded-2xl border p-3 transition sm:w-28 ${
                      active
                        ? "border-yellow-400 bg-yellow-100"
                        : "border-zinc-100 bg-zinc-50 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >

                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition ${
                        active
                          ? "bg-yellow-400"
                          : "bg-white shadow-sm group-hover:scale-105"
                      }`}
                    >
                      {icon}
                    </div>

                    <p className="mt-2 line-clamp-2 text-center text-xs font-bold">
                      {name}
                    </p>

                  </button>
                );
              }
            )}

          </div>
        )}

      </div>
    </section>
  );
}