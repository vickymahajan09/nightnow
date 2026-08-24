"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addNeed,
  deleteNeed,
  getNeeds,
  toggleNeed,
  updateNeed,
  type Need,
} from "../../services/needService";
import { getBrands, type Brand } from "../../services/brandService";
import { getProducts, type Product } from "../../services/productService";

export default function AdminNeedsPage() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [icon, setIcon] = useState("🎉");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [needData, brandData, productData] = await Promise.all([getNeeds(), getBrands(), getProducts()]);
      setNeeds(needData);
      setBrands(brandData.filter((b) => b.active !== false));
      setProducts(productData.filter((p) => p.active !== false));
    } catch (error) {
      console.error(error);
      alert("Aapki Zarurat data load nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const reset = () => {
    setEditingId(null);
    setIcon("🎉");
    setTitle("");
    setDescription("");
    setKeywordsText("");
    setBrandIds([]);
    setProductIds([]);
    setSortOrder("0");
    setActive(true);
  };

  const toggleId = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((id) => id !== value) : [...current, value]);
  };

  const save = async () => {
    if (!title.trim()) return alert("Need title enter karein.");
    if (brandIds.length === 0 && productIds.length === 0) return alert("Kam se kam 1 brand ya product select karein.");

    const keywords = keywordsText.split(",").map((item) => item.trim()).filter(Boolean);
    setSaving(true);
    try {
      const payload = { icon, title, description, keywords, brandIds, productIds, sortOrder: Number(sortOrder || 0), active };
      if (editingId) {
        await updateNeed(editingId, payload);
        alert("Need updated.");
      } else {
        await addNeed(payload);
        alert("Need created.");
      }
      reset();
      await loadAll();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Need save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (need: Need) => {
    setEditingId(need.id);
    setIcon(need.icon);
    setTitle(need.title);
    setDescription(need.description || "");
    setKeywordsText((need.keywords || []).join(", "));
    setBrandIds(need.brandIds || []);
    setProductIds(need.productIds || []);
    setSortOrder(String(need.sortOrder || 0));
    setActive(need.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this requirement?")) return;
    await deleteNeed(id);
    setNeeds((items) => items.filter((item) => item.id !== id));
  };

  const brandNames = useMemo(() => (ids: string[]) => ids.map((id) => brands.find((b) => b.id === id)?.name).filter(Boolean).join(", "), [brands]);

  return (
    <main className="min-h-screen bg-black px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black text-yellow-400">Aapki Zarurat</h1>
        <p className="mt-1 text-sm text-zinc-400">Admin fix karega kis need par kaunsi brands/products customer ko dikhengi.</p>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-black">{editingId ? "Edit Requirement" : "Create Requirement"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Emoji" className="rounded-2xl bg-zinc-800 p-4 outline-none" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mujhe party me jana hai" className="rounded-2xl bg-zinc-800 p-4 outline-none md:col-span-2" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="rounded-2xl bg-zinc-800 p-4 outline-none md:col-span-2" />
            <input value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} placeholder="Keywords: party, function, snacks" className="rounded-2xl bg-zinc-800 p-4 outline-none" />
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Sort order" className="rounded-2xl bg-zinc-800 p-4 outline-none" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-black text-yellow-400">Brands to show</div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-zinc-950 p-3">
                {brands.map((brand) => (
                  <label key={brand.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-900 p-3">
                    <input type="checkbox" checked={brandIds.includes(brand.id)} onChange={() => toggleId(brand.id, brandIds, setBrandIds)} />
                    <span className="font-bold">{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-black text-yellow-400">Specific products to show</div>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-zinc-950 p-3">
                {products.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-zinc-900 p-3">
                    <input type="checkbox" checked={productIds.includes(product.id)} onChange={() => toggleId(product.id, productIds, setProductIds)} />
                    <div className="min-w-0"><p className="truncate font-bold">{product.name}</p><p className="text-xs text-zinc-500">{product.brandName || product.brandId || "No brand"} · ₹{product.price}</p></div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Show on customer side</label>
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Requirement" : "Create Requirement"}</button>
            {editingId && <button onClick={reset} className="rounded-2xl bg-zinc-700 px-6 font-black">Cancel</button>}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {loading ? <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">Loading...</div> : needs.length === 0 ? <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">No requirements found.</div> : needs.map((need) => (
            <div key={need.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><h3 className="text-xl font-black text-yellow-400">{need.icon} {need.title}</h3><span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-black">{need.active ? "ACTIVE" : "OFF"}</span></div>
                  <p className="mt-1 text-sm text-zinc-400">{need.description}</p>
                  <p className="mt-2 text-xs text-zinc-500">Brands: {brandNames(need.brandIds || []) || "None"} · Products: {(need.productIds || []).length}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleNeed(need.id, !need.active).then(loadAll)} className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-black">{need.active ? "Disable" : "Enable"}</button>
                  <button onClick={() => edit(need)} className="rounded-xl bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300">Edit</button>
                  <button onClick={() => remove(need.id)} className="rounded-xl bg-red-500/15 px-4 py-2 text-xs font-black text-red-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}