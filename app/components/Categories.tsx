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
          (item: any) => item.active !== false
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">

        <h2 className="mb-4 text-2xl font-bold">
          Shop by Category
        </h2>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 min-w-[110px] animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3">

            {/* ALL */}

            <button
              onClick={() =>
                onSelectCategory?.("")
              }
              className={`flex min-w-[110px] flex-col items-center rounded-2xl p-3 transition ${
                selectedCategory === ""
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">
                <span className="text-3xl">
                  🛍️
                </span>
              </div>

              <span className="mt-2 text-sm font-bold">
                All
              </span>
            </button>

            {/* CATEGORIES */}

            {categories.map(
              (category: any) => (
                <button
                  key={category.id}
                  onClick={() =>
                    onSelectCategory?.(
                      category.id
                    )
                  }
                  className={`flex min-w-[110px] flex-col items-center rounded-2xl p-3 transition ${
                    selectedCategory ===
                    category.id
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >

                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">

                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">
                        {category.icon || "📦"}
                      </span>
                    )}

                  </div>

                  <span className="mt-2 max-w-[100px] truncate text-sm font-bold">
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