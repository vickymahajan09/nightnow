"use client";

import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";

interface CategoriesProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export default function Categories({
  selectedCategory = "",
  onSelectCategory,
}: CategoriesProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-7xl">

        <h2 className="mb-4 text-2xl font-bold text-white">
          Shop by Category
        </h2>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 min-w-[100px] animate-pulse rounded-xl bg-zinc-900"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">

            <button
              onClick={() =>
                onSelectCategory?.("")
              }
              className={`flex min-w-[100px] flex-col items-center rounded-xl p-4 transition ${
                selectedCategory === ""
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              <span className="text-3xl">
                🛍️
              </span>

              <span className="mt-2 text-sm font-bold">
                All
              </span>
            </button>

            {categories.map(
              (category: any) => (
                <button
                  key={category.id}
                  onClick={() =>
                    onSelectCategory?.(
                      category.id
                    )
                  }
                  className={`flex min-w-[100px] flex-col items-center rounded-xl p-4 transition ${
                    selectedCategory ===
                    category.id
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-3xl">
                    {category.icon || "📦"}
                  </span>

                  <span className="mt-2 max-w-[90px] truncate text-sm font-bold">
                    {category.name}
                  </span>
                </button>
              )
            )}

          </div>
        )}

        {!loading &&
          categories.length === 0 && (
            <p className="mt-4 text-sm text-zinc-500">
              No categories available.
            </p>
          )}

      </div>
    </section>
  );
}