"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, type Product } from "../services/productService";
import { useCart } from "../context/CartContext";

type CategoryCard = {
  name: string;
  keywords: string[];
  wide?: boolean;
};

type CategorySection = {
  title: string;
  items: CategoryCard[];
};

const categorySections: CategorySection[] = [
  {
    title: "Grocery & Kitchen",
    items: [
      { name: "Fruits & Vegetables", keywords: ["fruit", "vegetable", "sabzi", "veg", "tomato", "onion", "potato"], wide: true },
      { name: "Dairy, Bread & Eggs", keywords: ["dairy", "milk", "bread", "egg", "curd", "butter", "paneer"], wide: true },
      { name: "Atta, Rice, Oil & Dals", keywords: ["atta", "rice", "dal", "flour", "oil", "ghee", "pulses"] },
      { name: "Masala & Dry Fruits", keywords: ["masala", "spice", "dry fruit", "almond", "cashew", "kishmish"] },
      { name: "Breakfast & Sauces", keywords: ["breakfast", "sauce", "ketchup", "cereal", "corn", "spread", "jam"] },
      { name: "Packaged Food", keywords: ["noodle", "pasta", "packaged", "instant", "maggi", "food"] },
    ],
  },
  {
    title: "Snacks & Drinks",
    items: [
      { name: "Tea, Coffee & More", keywords: ["tea", "coffee", "bournvita", "nescafe", "drink"], wide: true },
      { name: "Ice Creams & More", keywords: ["ice cream", "icecream", "kulfi", "frozen dessert"] },
      { name: "Frozen Food", keywords: ["frozen", "fries", "nugget", "frozen food"] },
      { name: "Sweet Cravings", keywords: ["sweet", "chocolate", "mithai", "cake", "candy"] },
      { name: "Cold Drinks & Juices", keywords: ["cold drink", "juice", "coke", "pepsi", "real", "frooti", "soft drink"] },
      { name: "Munchies", keywords: ["chips", "namkeen", "snack", "munch", "lays", "kurkure"] },
      { name: "Biscuits & Cookies", keywords: ["biscuit", "cookie", "oreo", "parle", "britannia"] },
    ],
  },
  {
    title: "Beauty & Personal Care",
    items: [
      { name: "Bath & Body", keywords: ["soap", "body wash", "shampoo", "conditioner", "bath"] },
      { name: "Skin Care", keywords: ["skin", "face", "cream", "lotion", "moisturizer", "sunscreen"] },
      { name: "Hair Care", keywords: ["hair", "shampoo", "conditioner", "oil", "serum"] },
      { name: "Makeup & Cosmetics", keywords: ["makeup", "lipstick", "cosmetic", "foundation", "beauty"] },
    ],
  },
  {
    title: "Household Essentials",
    items: [
      { name: "Cleaning Essentials", keywords: ["cleaner", "detergent", "floor", "toilet", "dishwash", "cleaning"] },
      { name: "Kitchen Essentials", keywords: ["kitchen", "utensil", "bottle", "container", "appliance"] },
      { name: "Home Care", keywords: ["home", "room", "air freshener", "tissue", "paper"] },
    ],
  },
  {
    title: "Baby Care",
    items: [
      { name: "Diapers & Wipes", keywords: ["diaper", "nappy", "wipes", "baby"] },
      { name: "Baby Food", keywords: ["baby food", "cerelac", "formula", "infant"] },
      { name: "Baby Care", keywords: ["baby care", "baby lotion", "baby soap", "baby shampoo"] },
    ],
  },
];

function searchableProductText(product: any) {
  return [
    product?.name,
    product?.title,
    product?.productName,
    product?.brandName,
    product?.brandId,
    product?.category,
    product?.description,
    product?.tags,
    product?.keywords,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function productImage(product: any) {
  if (product?.image) return String(product.image);
  if (Array.isArray(product?.images) && product.images.length) {
    return String(product.images[0] || "");
  }
  return "";
}

function getCategoryByName(name: string) {
  for (const section of categorySections) {
    const found = section.items.find((item) => item.name === name);
    if (found) return found;
  }
  return null;
}

function hasBuyOneGetTwo(product: any) {
  const values = [
    product?.offer,
    product?.offerText,
    product?.discountText,
    product?.badge,
    product?.promotion,
    product?.scheme,
    product?.schemeText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    values.includes("buy 1 get 2") ||
    values.includes("buy1get2") ||
    values.includes("buy one get two") ||
    product?.buy1get2 === true ||
    product?.buyOneGetTwo === true
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const activeCategoryName = params.get("category") || "";

  const { addToCart, cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "low" | "high">("default");

  const activeCategory = useMemo(
    () => getCategoryByName(activeCategoryName),
    [activeCategoryName]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getProducts();

        if (!alive) return;

        setProducts(
          Array.isArray(data)
            ? data.filter((item: any) => item?.active !== false)
            : []
        );
      } catch (error) {
        console.error("Categories products loading error:", error);
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const imageForCategory = useMemo(() => {
    const map = new Map<string, string>();

    for (const section of categorySections) {
      for (const category of section.items) {
        const match = products.find((product: any) => {
          const text = searchableProductText(product);
          return category.keywords.some((keyword) =>
            text.includes(keyword.toLowerCase())
          );
        });

        if (match) map.set(category.name, productImage(match));
      }
    }

    return map;
  }, [products]);

  const activeProducts = useMemo(() => {
    if (!activeCategory) return [];

    const filtered = products.filter((product: any) => {
      const text = searchableProductText(product);
      return activeCategory.keywords.some((keyword) =>
        text.includes(keyword.toLowerCase())
      );
    });

    const query = search.trim().toLowerCase();

    const searched = query
      ? filtered.filter((product: any) =>
          searchableProductText(product).includes(query)
        )
      : filtered;

    return [...searched].sort((a: any, b: any) => {
      if (sort === "low") {
        return Number(a?.price || 0) - Number(b?.price || 0);
      }

      if (sort === "high") {
        return Number(b?.price || 0) - Number(a?.price || 0);
      }

      return 0;
    });
  }, [products, activeCategory, search, sort]);

  const cartQuantity = (productId: string) => {
    const item = (cart as any[]).find(
      (entry) => entry?.productId === productId || entry?.id === productId
    );
    return Number(item?.quantity || 0);
  };

  const openCategory = (name: string) => {
    router.push(`/categories?category=${encodeURIComponent(name)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================================================
     PRODUCT LISTING VIEW
     Mobile: exactly 4 compact cards visible + horizontal scroller
     ========================================================= */
  if (activeCategory) {
    return (
      <main className="min-h-screen bg-white pb-24 text-zinc-900">
        <header className="sticky top-0 z-[90] border-b border-zinc-100 bg-white">
          <div className="mx-auto flex h-[64px] max-w-7xl items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-black"
              aria-label="Back to categories"
            >
              ←
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] font-black">
                {activeCategory.name}
              </h1>
              <p className="text-[9px] font-bold text-zinc-400">
                {loading ? "Loading..." : `${activeProducts.length} products`}
              </p>
            </div>

            <Link
              href="/wishlist"
              className="flex h-9 w-9 items-center justify-center text-xl"
              aria-label="Wishlist"
            >
              ♡
            </Link>

            <Link
              href="/cart"
              className="flex h-9 w-9 items-center justify-center text-lg"
              aria-label="Cart"
            >
              🛒
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-3 pt-3">
          <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-2.5">
            <span className="text-zinc-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${activeCategory.name}`}
              className="min-w-0 flex-1 bg-transparent px-2 text-[12px] outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-base text-zinc-400"
              >
                ×
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["default", "Recommended"],
              ["low", "Price ↑"],
              ["high", "Price ↓"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSort(value as "default" | "low" | "high")
                }
                className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black ${
                  sort === value
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-3 pt-4">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl bg-zinc-100"
                />
              ))}
            </div>
          ) : activeProducts.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 p-8 text-center">
              <div className="text-4xl">📦</div>
              <p className="mt-2 text-xs font-black">
                Is category me product nahi mila
              </p>
              <button
                type="button"
                onClick={() => router.push("/categories")}
                className="mt-3 rounded-full bg-yellow-400 px-4 py-1.5 text-[10px] font-black"
              >
                Back to Categories
              </button>
            </div>
          ) : (
            /*
             * Four cards are visible at a time on mobile.
             * Every card is fixed at calc((100% - 24px) / 4),
             * and the row can be swiped horizontally.
             */
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeProducts.map((product: any) => {
                const image = productImage(product);
                const price = Number(product?.price || 0);
                const mrp = Number(product?.mrp || 0);
                const qty = cartQuantity(product.id);
                const buyOneGetTwo = hasBuyOneGetTwo(product);

                return (
                  <article
                    key={product.id}
                    className="w-[calc((100%-24px)/4)] min-w-[calc((100%-24px)/4)] max-w-[calc((100%-24px)/4)] shrink-0 snap-start overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-50">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name || "Product"}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}

                        {/* Small button-style blue + */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            addToCart(product);
                          }}
                          className="absolute bottom-1 right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[16px] font-black leading-none text-white shadow-md active:scale-90"
                          aria-label={`Add ${product.name || "product"} to cart`}
                        >
                          +
                        </button>
                      </div>
                    </Link>

                    <div className="p-1.5">
                      {buyOneGetTwo && (
                        <span className="mb-1 inline-flex rounded-[4px] border border-pink-200 bg-pink-50 px-1 py-[1px] text-[6px] font-black leading-none text-pink-600">
                          BUY 1 GET 2
                        </span>
                      )}

                      <p className="line-clamp-2 min-h-[24px] text-[8px] font-black leading-[11px]">
                        {product.name || "Product"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-0.5">
                        <span className="text-[10px] font-black text-green-600">
                          ₹{price}
                        </span>

                        {mrp > price && (
                          <span className="text-[7px] text-zinc-400 line-through">
                            ₹{mrp}
                          </span>
                        )}
                      </div>

                      {qty > 0 && (
                        <div className="mt-1 rounded-[4px] bg-green-50 px-1 py-0.5 text-center text-[6px] font-black text-green-700">
                          {qty} in cart
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+7px)] pt-2 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
            >
              <span className="text-2xl">⌂</span>
              Home
            </Link>

            <Link
              href="/categories"
              className="flex flex-col items-center gap-1 py-1 text-[11px] font-black text-pink-600"
            >
              <span className="text-2xl">▦</span>
              Categories
            </Link>

            <Link
              href="/orders"
              className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
            >
              <span className="text-2xl">↗</span>
              Trending
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
            >
              <span className="text-2xl">🛒</span>
              Cart
            </Link>
          </div>
        </nav>
      </main>
    );
  }

  /* =========================================================
     ALL CATEGORIES VIEW
     ========================================================= */
  const visibleSections = categorySections
    .map((section) => ({
      ...section,
      items: search.trim()
        ? section.items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
          )
        : section.items,
    }))
    .filter((section) => section.items.length > 0);

  return (
    <main className="min-h-screen bg-white pb-24 text-zinc-900">
      <header className="sticky top-0 z-[90] border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-5">
          <h1 className="text-[24px] font-black tracking-tight">
            All Categories
          </h1>

          <div className="flex items-center gap-5 text-[28px]">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="leading-none"
            >
              ♡
            </Link>

            <button
              type="button"
              onClick={() =>
                document.getElementById("category-search")?.focus()
              }
              aria-label="Search"
              className="text-[26px] leading-none"
            >
              ⌕
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pt-3">
        <div className="flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-3 shadow-sm">
          <span className="text-lg text-zinc-400">⌕</span>

          <input
            id="category-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-lg text-zinc-400"
            >
              ×
            </button>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl">
        {visibleSections.map((section) => (
          <section key={section.title} className="px-5 pt-5">
            <h2 className="mb-3 text-[22px] font-black tracking-tight">
              {section.title}
            </h2>

            <div className="grid grid-cols-4 gap-x-3 gap-y-6">
              {section.items.map((item) => {
                const image = imageForCategory.get(item.name) || "";

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openCategory(item.name)}
                    className={`group text-center ${
                      item.wide ? "col-span-2" : "col-span-1"
                    }`}
                  >
                    <div className="flex h-[112px] items-center justify-center overflow-hidden rounded-2xl bg-[#f7f7f7] transition group-active:scale-95 sm:h-[145px]">
                      {image ? (
                        <img
                          src={image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-4xl opacity-70">
                          {item.name.includes("Fruit")
                            ? "🥬"
                            : item.name.includes("Dairy")
                            ? "🥛"
                            : item.name.includes("Tea")
                            ? "☕"
                            : item.name.includes("Ice")
                            ? "🍦"
                            : item.name.includes("Drink")
                            ? "🥤"
                            : item.name.includes("Beauty")
                            ? "💄"
                            : item.name.includes("Baby")
                            ? "🍼"
                            : "🛍️"}
                        </span>
                      )}
                    </div>

                    <p className="mx-auto mt-2 max-w-[150px] text-[13px] font-bold leading-[17px]">
                      {item.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+7px)] pt-2 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
          >
            <span className="text-2xl">⌂</span>
            Home
          </Link>

          <Link
            href="/categories"
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-black text-pink-600"
          >
            <span className="text-2xl">▦</span>
            Categories
          </Link>

          <Link
            href="/orders"
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
          >
            <span className="text-2xl">↗</span>
            Trending
          </Link>

          <Link
            href="/cart"
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-zinc-600"
          >
            <span className="text-2xl">🛒</span>
            Cart
          </Link>
        </div>
      </nav>
    </main>
  );
}