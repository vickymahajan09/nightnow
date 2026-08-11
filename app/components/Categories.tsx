"use client";

import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";

interface CategoriesProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const fallbackCategories = [
  {
    id: "",
    name: "All",
    icon: "🛍️",
  },
  {
    id: "Fruits & Vegetables",
    name: "Fruits & Vegetables",
    icon: "🥬",
  },
  {
    id: "Dairy, Bread & Eggs",
    name: "Dairy, Bread & Eggs",
    icon: "🥛",
  },
  {
    id: "Atta, Rice, Oil & Dals",
    name: "Atta, Rice, Oil & Dals",
    icon: "🌾",
  },
  {
    id: "Meat, Fish & Eggs",
    name: "Meat, Fish & Eggs",
    icon: "🍗",
  },
  {
    id: "Masala & Dry Fruits",
    name: "Masala & Dry Fruits",
    icon: "🌶️",
  },
  {
    id: "Breakfast & Sauces",
    name: "Breakfast & Sauces",
    icon: "🥣",
  },
  {
    id: "Packaged Food",
    name: "Packaged Food",
    icon: "🍪",
  },
  {
    id: "Cafe",
    name: "Cafe",
    icon: "☕",
  },
  {
    id: "Tea, Coffee & More",
    name: "Tea, Coffee & More",
    icon: "🍵",
  },
  {
    id: "Ice Creams & More",
    name: "Ice Creams & More",
    icon: "🍦",
  },
  {
    id: "Frozen Food",
    name: "Frozen Food",
    icon: "🧊",
  },
  {
    id: "Snacks",
    name: "Snacks",
    icon: "🍿",
  },
  {
    id: "Beverages",
    name: "Beverages",
    icon: "🥤",
  },
  {
    id: "Personal Care",
    name: "Personal Care",
    icon: "🧴",
  },
  {
    id: "Household",
    name: "Household",
    icon: "🧹",
  },
  {
    id: "Medicines",
    name: "Medicines",
    icon: "💊",
  },
];

export default function Categories({
  selectedCategory = "",
  onSelectCategory,
}: CategoriesProps) {
  const [categories, setCategories] =
    useState<any[]>(fallbackCategories);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();

      if (
        Array.isArray(data) &&
        data.length > 0
      ) {
        const firebaseCategories = data.map(
          (item: any) => ({
            id: item.id,
            name:
              item.name ||
              "Category",
            icon:
              item.icon ||
              "🛍️",
          })
        );

        setCategories([
          {
            id: "",
            name: "All",
            icon: "🛍️",
          },
          ...firebaseCategories,
        ]);
      }
    } catch (error) {
      console.error(
        "Category loading failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (
    categoryId: string
  ) => {
    if (!onSelectCategory) return;

    onSelectCategory(categoryId);

    setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  return (
    <section className="bg-white px-4 py-4">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-4">
          <h2 className="text-lg font-black text-black">
            Shop by Category
          </h2>

          <p className="text-xs text-zinc-500">
            Everything you need, all in one place
          </p>
        </div>

        {/* CATEGORY BAR */}

        <div className="relative">

          <div
            className="
              flex
              gap-3
              overflow-x-auto
              pb-3
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >

            {loading
              ? fallbackCategories
                  .slice(0, 8)
                  .map((item) => (
                    <div
                      key={item.name}
                      className="h-[105px] w-[82px] shrink-0 animate-pulse rounded-2xl bg-zinc-100"
                    />
                  ))
              : categories.map(
                  (category: any) => {
                    const active =
                      selectedCategory ===
                      category.id;

                    return (
                      <button
                        key={
                          category.id ||
                          category.name
                        }
                        type="button"
                        onClick={() =>
                          handleSelect(
                            category.id
                          )
                        }
                        className={`
                          group
                          flex
                          w-[82px]
                          shrink-0
                          flex-col
                          items-center
                          rounded-2xl
                          border
                          px-2
                          py-2
                          transition-all
                          duration-200

                          ${
                            active
                              ? "border-yellow-400 bg-yellow-50 shadow-md"
                              : "border-zinc-200 bg-white hover:border-yellow-300 hover:bg-yellow-50"
                          }
                        `}
                      >

                        {/* ICON */}

                        <div
                          className={`
                            flex
                            h-16
                            w-16
                            items-center
                            justify-center
                            rounded-xl
                            text-4xl
                            transition
                            group-hover:scale-105

                            ${
                              active
                                ? "bg-yellow-100"
                                : "bg-zinc-50"
                            }
                          `}
                        >
                          {category.icon ||
                            "🛍️"}
                        </div>

                        {/* NAME */}

                        <p
                          className={`
                            mt-2
                            line-clamp-2
                            min-h-[32px]
                            text-center
                            text-[11px]
                            font-bold
                            leading-4

                            ${
                              active
                                ? "text-black"
                                : "text-zinc-600"
                            }
                          `}
                        >
                          {category.name}
                        </p>

                      </button>
                    );
                  }
                )}

          </div>

        </div>

      </div>
    </section>
  );
}