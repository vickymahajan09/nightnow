"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

type Category = {
  id: string;
  name: string;
  image?: string;
  icon?: string;
};

type Product = {
  id: string;
  name?: string;
  title?: string;
  productName?: string;
  category?: string;
  categoryName?: string;
  brandName?: string;
  price?: number | string;
  mrp?: number | string;
  stock?: number | string;
  image?: string;
  imageUrl?: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categorySnap, productSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
        ]);

        const categoryData = categorySnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, "id">),
        }));

        const productData = productSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, "id">),
        }));

        setCategories(categoryData);
        setProducts(productData);
      } catch (error) {
        console.error("Categories loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedProducts = useMemo(() => {
    if (!selectedCategory) return [];

    const selected = selectedCategory.trim().toLowerCase();

    return products.filter((product) => {
      const category = String(
        product.categoryName || product.category || ""
      )
        .trim()
        .toLowerCase();

      return category === selected;
    });
  }, [products, selectedCategory]);

  const getProductImage = (product: Product) => {
    return product.imageUrl || product.image || "";
  };

  const getCategoryIcon = (category: Category) => {
    if (category.icon) return category.icon;

    const name = category.name.toLowerCase();

    if (name.includes("grocery")) return "🛒";
    if (name.includes("kitchen")) return "🍳";
    if (name.includes("snack")) return "🍿";
    if (name.includes("drink")) return "🥤";
    if (name.includes("beauty")) return "💄";
    if (name.includes("personal")) return "🧴";
    if (name.includes("health")) return "💊";
    if (name.includes("care")) return "❤️";
    if (name.includes("clean")) return "🧹";
    if (name.includes("baby")) return "👶";
    if (name.includes("pet")) return "🐶";

    return "📦";
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm font-black text-white"
          >
            🌙 Night<span className="text-yellow-400">Now</span>
          </Link>

          <h1 className="text-lg font-black sm:text-xl">
            Categories
          </h1>

          <Link
            href="/"
            className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5">
        {/* CATEGORY LIST */}

        {!selectedCategory ? (
          <>
            <div className="mb-5">
              <h2 className="text-2xl font-black">
                Shop by Category
              </h2>

              <p className="mt-1 text-xs text-zinc-400">
                Apni category select karein
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-zinc-100"
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 p-10 text-center">
                <div className="text-4xl">📦</div>

                <p className="mt-3 text-sm font-black">
                  No categories found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-yellow-400 hover:shadow-md"
                  >
                    <div className="flex h-28 items-center justify-center bg-zinc-50">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-full w-full object-contain p-4"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-5xl">
                          {getCategoryIcon(category)}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 p-3">
                      <p className="truncate text-sm font-black">
                        {category.name}
                      </p>

                      <p className="mt-1 text-[10px] font-bold text-yellow-600">
                        View Products →
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* SELECTED CATEGORY */}

            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-black"
              >
                ←
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">
                  {selectedCategory}
                </h2>

                <p className="text-xs font-bold text-zinc-400">
                  {selectedProducts.length} Products
                </p>
              </div>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 p-10 text-center">
                <div className="text-4xl">🔍</div>

                <p className="mt-3 text-sm font-black">
                  Is category mein products nahi mile
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
                >
                  Back to Categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {selectedProducts.map((product) => {
                  const image = getProductImage(product);
                  const price = Number(product.price || 0);
                  const mrp = Number(product.mrp || 0);

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex h-32 items-center justify-center bg-zinc-50">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name || "Product"}
                            className="h-full w-full object-contain p-3"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="line-clamp-2 min-h-[36px] text-xs font-black">
                          {product.name ||
                            product.title ||
                            product.productName ||
                            "Product"}
                        </h3>

                        {product.brandName && (
                          <p className="mt-1 truncate text-[9px] font-bold text-yellow-600">
                            {product.brandName}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm font-black text-green-600">
                            ₹{price}
                          </span>

                          {mrp > price && (
                            <span className="text-[9px] text-zinc-400 line-through">
                              ₹{mrp}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-black text-zinc-500"
          >
            <span className="text-xl">🏠</span>
            Home
          </Link>

          <Link
            href="/categories"
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-black text-yellow-600"
          >
            <span className="text-xl">🛍️</span>
            Categories
          </Link>

          <Link
            href="/orders"
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-black text-zinc-500"
          >
            <span className="text-xl">📦</span>
            Orders
          </Link>

          <Link
            href="/cart"
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-black text-zinc-500"
          >
            <span className="text-xl">🛒</span>
            Cart
          </Link>
        </div>
      </nav>
    </main>
  );
}