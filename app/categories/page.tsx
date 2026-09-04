"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getCategories, getCategoriesPageHeading, type Category } from "../services/categoryService";
import { getProducts, type Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import { Search } from "lucide-react";

function getProductImage(product: Product) {
  if (typeof (product as any).image === "string" && (product as any).image) {
    return (product as any).image;
  }
  if (Array.isArray((product as any).images) && (product as any).images.length > 0) {
    return (product as any).images[0];
  }
  return "";
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();

  const image = getProductImage(product);
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const stock = Number(product.stock || 0);
  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const variantId = (product as any).variantId || undefined;
  const quantity = getItemQuantity(product.id, variantId);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stock <= 0) return;
    addToCart({ ...product, quantity: 1, ...(variantId ? { variantId } : {}) } as any);
    window.dispatchEvent(new CustomEvent("nightnow:cart-added", { detail: { product: { ...product } } }));
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stock <= 0 || quantity >= stock) return;
    addToCart({ ...product, quantity: 1, ...(variantId ? { variantId } : {}) } as any);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    removeFromCart(product.id, variantId);
  };

  return (
    <div className="flex aspect-square flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition hover:-translate-y-1">
      <Link href={`/product/${product.id}`} className="flex h-full flex-col">
        <div className="relative min-h-0 flex-[3] bg-zinc-50">
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[7px] font-black text-yellow-300">
            🌙 15 MIN
          </span>
          {discount > 0 && (
            <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-1.5 py-0.5 text-[7px] font-black text-white">
              {discount}% OFF
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {image ? (
              <img
                src={image}
                alt={product.name || "Product"}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>

          <div className="absolute -bottom-2 right-1.5">
            {quantity > 0 ? (
              <div className="flex h-8 items-center gap-1.5 rounded-xl bg-yellow-400 px-1.5 shadow-lg">
                <button onClick={handleDecrease} className="h-5 w-5 rounded-md bg-black text-[12px] font-black text-white">
                  −
                </button>
                <span className="text-[10px] font-black text-black">{quantity}</span>
                <button
                  onClick={handleIncrease}
                  disabled={stock <= 0 || quantity >= stock}
                  className="h-5 w-5 rounded-md bg-black text-[12px] font-black text-white disabled:opacity-30"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={stock <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400 text-base font-black text-black shadow-lg disabled:bg-zinc-300"
              >
                {stock <= 0 ? "✕" : "+"}
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 px-1.5 pb-1.5 pt-1">
          <p className="line-clamp-1 text-[9px] font-bold leading-tight text-zinc-900">
            {product.name || "Product"}
          </p>
          <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[11px] font-black text-zinc-900">₹{price}</span>
            {mrp > price && <span className="truncate text-[7px] text-zinc-400 line-through">₹{mrp}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function CategoriesPage() {
  const params = useSearchParams();
  const activeCategoryName = params.get("category") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageHeading, setPageHeading] = useState("All Categories");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const [categoryList, productList, heading] = await Promise.all([
          getCategories(),
          getProducts(),
          // Heading lives in the `settings` doc — if it is ever
          // unreadable we must NOT let it kill the whole page,
          // otherwise the category list silently disappears.
          getCategoriesPageHeading().catch(() => "All Categories"),
        ]);
        if (!alive) return;

        setCategories(categoryList.filter((c) => c.active !== false));
        setProducts(productList.filter((p) => p.active !== false));
        setPageHeading(heading);
      } catch (error) {
        console.error("Categories page load error:", error);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Real categories only — pulled straight from Admin > Categories.
  // No hardcoded/demo category list.
  const categoriesWithCounts = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        count: products.filter(
          (p) => (p.category || "").trim().toLowerCase() === category.name.trim().toLowerCase()
        ).length,
      }))
      .filter((c) => (search.trim() ? c.category.name.toLowerCase().includes(search.trim().toLowerCase()) : true));
  }, [categories, products, search]);

  const [sort, setSort] = useState<"new" | "low" | "high" | "discount">("new");

  // Group categories by their admin-assigned "section" (e.g. "Snacks &
  // Drinks") — matches the reference design: a heading per group, then
  // a 2-column grid of that group's category tiles underneath.
  const groupedCategories = useMemo(() => {
    const groups: { section: string; items: typeof categoriesWithCounts }[] = [];
    const indexBySection = new Map<string, number>();

    categoriesWithCounts.forEach((entry) => {
      const section = (entry.category.section || "").trim();
      const key = section || "\u0000ungrouped";

      if (!indexBySection.has(key)) {
        indexBySection.set(key, groups.length);
        groups.push({ section, items: [] });
      }

      groups[indexBySection.get(key)!].items.push(entry);
    });

    return groups;
  }, [categoriesWithCounts]);

  const activeCategoryProducts = useMemo(() => {
    if (!activeCategoryName) return [];

    let list = products.filter(
      (p) => (p.category || "").trim().toLowerCase() === activeCategoryName.trim().toLowerCase()
    );

    const getDiscount = (p: Product) => {
      const price = Number(p.price || 0);
      const mrp = Number(p.mrp || 0);
      return mrp > price && mrp > 0 ? (mrp - price) / mrp : 0;
    };

    if (sort === "low") {
      list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === "high") {
      list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === "discount") {
      list = [...list].sort((a, b) => getDiscount(b) - getDiscount(a));
    } else {
      list = [...list].sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    return list;
  }, [products, activeCategoryName, sort]);

  useEffect(() => {
    const title = activeCategoryName || pageHeading;
    document.title = `${title} | NightNow`;
  }, [activeCategoryName, pageHeading]);

  return (
    <main className="min-h-screen bg-[#FFF8ED] pb-24 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#FFF8ED]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          {activeCategoryName ? (
            <Link href="/categories" className="text-lg" aria-label="Back">
              ←
            </Link>
          ) : null}
          <h1 className="text-lg font-black">{activeCategoryName || pageHeading}</h1>
        </div>

        {!activeCategoryName && (
          <div className="mx-auto mt-2 flex max-w-7xl items-center rounded-2xl border border-zinc-200 bg-white px-3">
            <span className="text-base text-zinc-400"><Search size={16} /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="h-10 w-full bg-transparent px-2 text-[12px] outline-none placeholder:text-zinc-400"
            />
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
            ))}
          </div>
        ) : activeCategoryName ? (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: "new", label: "New" },
                { id: "low", label: "Low to High MRP" },
                { id: "high", label: "High to Low MRP" },
                { id: "discount", label: "Discount" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSort(option.id as typeof sort)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black transition ${
                    sort === option.id
                      ? "border-orange-400 bg-orange-400 text-black"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {activeCategoryProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <p className="text-2xl">🌙✨</p>
                <p className="mt-2 text-sm font-black">Fresh stock landing soon in this category!</p>
                <p className="mt-1 text-xs text-zinc-400">Check back shortly — we're restocking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {activeCategoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        ) : categoriesWithCounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="text-2xl">🗂️</p>
            <p className="mt-2 text-sm font-black">No categories added yet</p>
            <p className="mt-1 text-xs text-zinc-400">Add one from Admin &gt; Categories</p>
          </div>
        ) : (
          <div className="space-y-7">
            {groupedCategories.map((group, groupIndex) => (
              <div key={group.section || `ungrouped-${groupIndex}`}>
                {group.section && (
                  <h2 className="mb-3 text-xl font-black text-zinc-900">{group.section}</h2>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {group.items.map(({ category }) => (
                    <Link
                      key={category.id}
                      href={`/categories?category=${encodeURIComponent(category.name)}`}
                      className="flex flex-col items-center text-center active:scale-95"
                    >
                      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 p-3">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-4xl">{category.icon || "🛍️"}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-bold leading-tight text-zinc-900">{category.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
