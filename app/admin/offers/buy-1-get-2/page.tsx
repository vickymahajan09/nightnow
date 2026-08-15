"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addBuy1Get2Offer,
  deleteBuy1Get2Offer,
  getBuy1Get2Offers,
  toggleBuy1Get2Offer,
  updateBuy1Get2Offer,
  type Buy1Get2Offer,
} from "../../../services/offerService";
import { getBrands, type Brand } from "../../../services/brandService";
import { getProducts, type Product } from "../../../services/productService";

export default function AdminBuy1Get2Page() {
  const [offers, setOffers] = useState<Buy1Get2Offer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("Buy 1 Get 2");
  const [description, setDescription] = useState("Selected brands par special Buy 1 Get 2 offer.");
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [offerData, brandData, productData] = await Promise.all([
        getBuy1Get2Offers(),
        getBrands(),
        getProducts(),
      ]);
      setOffers(offerData);
      setBrands(brandData.filter((b) => b.active !== false));
      setProducts(productData.filter((p) => p.active !== false));
    } catch (error) {
      console.error(error);
      alert("Buy 1 Get 2 data load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const visibleProducts = useMemo(() => products, [products]);

  const reset = () => {
    setEditingId(null);
    setTitle("Buy 1 Get 2");
    setDescription("Selected brands par special Buy 1 Get 2 offer.");
    setBrandIds([]);
    setProductIds([]);
    setActive(true);
  };

  const toggleId = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((id) => id !== value) : [...current, value]);
  };

  const save = async () => {
    if (!title.trim()) return alert("Offer title enter karein.");
    if (brandIds.length === 0 && productIds.length === 0) {
      return alert("Kam se kam 1 brand ya 1 product select karein.");
    }

    setSaving(true);
    try {
      const payload = { title, description, brandIds, productIds, active };
      if (editingId) {
        await updateBuy1Get2Offer(editingId, payload);
        alert("Buy 1 Get 2 offer updated.");
      } else {
        await addBuy1Get2Offer(payload);
        alert("Buy 1 Get 2 offer created.");
      }
      reset();
      await loadAll();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Offer save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (offer: Buy1Get2Offer) => {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description || "");
    setBrandIds(offer.brandIds || []);
    setProductIds(offer.productIds || []);
    setActive(offer.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this Buy 1 Get 2 offer?")) return;
    try {
      await deleteBuy1Get2Offer(id);
      setOffers((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Offer delete nahi hua.");
    }
  };

  const brandNames = (ids: string[]) => ids.map((id) => brands.find((b) => b.id === id)?.name).filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white pb-24">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-3xl font-black text-yellow-400">Buy 1 Get 2</h1>
          <p className="mt-1 text-sm text-zinc-400">Customer ko sirf yahi configured brands/products dikhaye jayenge.</p>
        </div>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-black">{editingId ? "Edit Offer" : "Create Offer"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Offer title" className="rounded-2xl bg-zinc-800 p-4 outline-none" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="rounded-2xl bg-zinc-800 p-4 outline-none" />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-black text-yellow-400">Brands</div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-zinc-950 p-3">
                {brands.length === 0 ? <p className="p-3 text-sm text-zinc-500">No brands found.</p> : brands.map((brand) => (
                  <label key={brand.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-900 p-3">
                    <input type="checkbox" checked={brandIds.includes(brand.id)} onChange={() => toggleId(brand.id, brandIds, setBrandIds)} />
                    <span className="font-bold">{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-black text-yellow-400">Specific Products (optional)</div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-zinc-950 p-3">
                {visibleProducts.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-900 p-3">
                    <input type="checkbox" checked={productIds.includes(product.id)} onChange={() => toggleId(product.id, productIds, setProductIds)} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.brandName || product.brandId || "No brand"} · ₹{product.price}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Offer Active
          </label>

          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && <button onClick={reset} className="rounded-2xl bg-zinc-700 px-6 font-black">Cancel</button>}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">Loading...</div>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">No Buy 1 Get 2 offers found.</div>
          ) : offers.map((offer) => (
            <div key={offer.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-yellow-400">{offer.title}</h3>
                    <span className={offer.active ? "rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-400" : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-400"}>{offer.active ? "ACTIVE" : "OFF"}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{offer.description}</p>
                  <p className="mt-3 text-xs text-zinc-500">Brands: {brandNames(offer.brandIds || []) || "None"}</p>
                  <p className="mt-1 text-xs text-zinc-500">Specific products: {(offer.productIds || []).length}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleBuy1Get2Offer(offer.id, !offer.active).then(loadAll)} className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-black">{offer.active ? "Disable" : "Enable"}</button>
                  <button onClick={() => edit(offer)} className="rounded-xl bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300">Edit</button>
                  <button onClick={() => remove(offer.id)} className="rounded-xl bg-red-500/15 px-4 py-2 text-xs font-black text-red-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
