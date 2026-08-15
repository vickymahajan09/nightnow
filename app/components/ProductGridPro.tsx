"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/productService";
import ProductCardPro from "./ProductCardPro";
import CategoryRail from "./CategoryRail";

type Product = { id: string; name?: string; brandName?: string; brand?: string; category?: string; description?: string; searchKeywords?: string[]; active?: boolean; [key:string]: any };

export default function ProductGridPro({ search = "", category = "" }: { search?: string; category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getProducts().then((data) => {
      if (!mounted) return;
      setProducts((Array.isArray(data) ? data : []).filter((p:any) => p?.active !== false));
    }).catch((err) => {
      console.error(err);
      if (mounted) setError("Products load nahi ho pa rahe.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = category.trim().toLowerCase();
    return products.filter((p) => {
      const categoryText = String(p.category || "").toLowerCase();
      const haystack = [p.name, p.brandName, p.brand, p.category, p.description, ...(Array.isArray(p.searchKeywords) ? p.searchKeywords : [])].filter(Boolean).join(" ").toLowerCase();
      return (!c || c === "all" || categoryText.includes(c)) && (!q || haystack.includes(q));
    });
  }, [products, search, category]);

  if (loading) return <section className="px-4 py-8"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-9 w-44 rounded bg-zinc-100"/><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"><div className="h-72 rounded-2xl bg-zinc-100"/><div className="h-72 rounded-2xl bg-zinc-100"/><div className="h-72 rounded-2xl bg-zinc-100"/></div></div></section>;
  if (error) return <section className="px-4 py-10"><div className="mx-auto max-w-lg rounded-2xl border bg-white p-6 text-center"><p className="font-bold text-red-500">{error}</p></div></section>;

  return (
    <section className="px-4 py-5 pb-28">
      <div className="mx-auto max-w-7xl">
        {!search && <div className="mb-5"><CategoryRail selected={category} /></div>}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{search ? "Search Results" : category || "All Products"}</p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">{search ? `Results for “${search}”` : "Shop products"}</h2>
          </div>
          <span className="text-xs font-bold text-zinc-400">{filtered.length} items</span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center">
            <div className="text-5xl">🔎</div>
            <h3 className="mt-4 text-lg font-black">No products found</h3>
            <p className="mt-1 text-sm text-zinc-500">Try another name, brand or category.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => <ProductCardPro key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </section>
  );
}
