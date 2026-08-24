"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "../../services/productService";

type HomeCategory = {
  id: string;
  name: string;
  section: string;
  heading: string;
  subtitle: string;
  image: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
};

type SectionDraft = {
  key: string;
  section: string;
  heading: string;
  subtitle: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
  categories: HomeCategory[];
};

type HistorySection = {
  key: string;
  section: string;
  heading: string;
  subtitle: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
};

type HistoryEntry = {
  id: string;
  savedAt: string;
  items: HomeCategory[];
  sections?: HistorySection[];
};

const STORAGE_KEY = "nightnow_admin_categories";
const HOME_SECTIONS_KEY = "nightnow_home_sections";
const HISTORY_KEY = "nightnow_admin_categories_history";

const SUBTITLE_OPTIONS = [
  "Everyday essentials",
  "Tasty picks for every time",
  "Explore our best picks",
  "Top picks for you",
  "Best deals for you",
  "Fresh picks delivered fast",
  "Shop your daily essentials",
  "More products you may like",
  "New arrivals & popular picks",
  "Value deals for every day",
];

const safe = (v: unknown, fallback = "") => String(v ?? fallback);
const normalizeCategory = (item: Partial<HomeCategory>, index = 0): HomeCategory => ({
  id: safe(item.id, crypto.randomUUID()),
  name: safe(item.name),
  section: safe(item.section || item.heading || item.name, "Products"),
  heading: safe(item.heading || item.section || item.name, "Products"),
  subtitle: safe(item.subtitle, "Explore more products"),
  image: safe(item.image),
  order: Number(item.order || index + 1),
  active: item.active !== false,
  showOnHome: item.showOnHome !== false,
  productIds: Array.isArray(item.productIds) ? item.productIds.map(String) : [],
});

function groupSections(items: HomeCategory[]): SectionDraft[] {
  const map = new Map<string, SectionDraft>();
  items.forEach((raw, index) => {
    const item = normalizeCategory(raw, index);
    const section = item.section.trim() || item.heading.trim() || item.name.trim() || "Products";
    const key = section.toLowerCase();
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        section,
        heading: item.heading || section,
        subtitle: item.subtitle || "Explore more products",
        order: item.order || index + 1,
        active: item.active,
        showOnHome: item.showOnHome,
        productIds: [],
        categories: [],
      };
      map.set(key, group);
    }
    group.categories.push({ ...item, section });
    group.productIds = Array.from(new Set([...group.productIds, ...item.productIds.map(String)]));
    if (group.categories.length === 1) {
      group.heading = item.heading || section;
      group.subtitle = item.subtitle || "Explore more products";
      group.order = item.order || index + 1;
      group.active = item.active;
      group.showOnHome = item.showOnHome;
    }
  });
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function sectionsFromHistory(entry: HistoryEntry): SectionDraft[] {
  const grouped = groupSections(Array.isArray(entry.items) ? entry.items : []);
  if (!Array.isArray(entry.sections) || entry.sections.length === 0) return grouped;
  return grouped.map((group) => {
    const first = group.categories[0];
    const match = entry.sections?.find((s) =>
      String(s.section).trim().toLowerCase() === group.section.trim().toLowerCase()
    );
    if (!match) return group;
    return {
      ...group,
      key: match.key || group.key,
      section: match.section || group.section,
      heading: match.heading || group.heading,
      subtitle: match.subtitle || group.subtitle,
      order: Number(match.order || group.order),
      active: match.active !== false,
      showOnHome: match.showOnHome !== false,
      productIds: Array.from(new Set((match.productIds || []).map(String))),
      categories: group.categories.map((c) => ({
        ...c,
        section: match.section || c.section,
        heading: match.heading || c.heading,
        subtitle: match.subtitle || c.subtitle,
        order: Number(match.order || c.order),
        active: match.active !== false,
        showOnHome: match.showOnHome !== false,
        productIds: Array.from(new Set((match.productIds || []).map(String))),
      })),
    };
  });
}

export default function HomeCategoriesAdminPage() {
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [openProducts, setOpenProducts] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSections(groupSections(Array.isArray(parsed) ? parsed : []));
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      const h = rawHistory ? JSON.parse(rawHistory) : [];
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      setSections([]);
      setHistory([]);
    }
    getProducts().then((data) => setProducts(Array.isArray(data) ? data.filter((p: any) => p?.active !== false) : [])).catch(console.error).finally(() => setLoaded(true));
  }, []);

  const updateSection = (key: string, patch: Partial<SectionDraft>) => {
    setSections((current) => current.map((s) => s.key === key ? { ...s, ...patch } : s));
  };

  const updateCategory = (sectionKey: string, id: string, patch: Partial<HomeCategory>) => {
    setSections((current) => current.map((s) => s.key !== sectionKey ? s : {
      ...s,
      categories: s.categories.map((c) => c.id === id ? { ...c, ...patch } : c),
    }));
  };

  const addSection = () => {
    const id = crypto.randomUUID();
    setSections((current) => [...current, {
      key: id,
      section: "New Section",
      heading: "New Section",
      subtitle: SUBTITLE_OPTIONS[0],
      order: current.length + 1,
      active: true,
      showOnHome: true,
      productIds: [],
      categories: [{ id: crypto.randomUUID(), name: "New Category", section: "New Section", heading: "New Section", subtitle: SUBTITLE_OPTIONS[0], image: "", order: current.length + 1, active: true, showOnHome: true, productIds: [] }],
    }]);
  };

  const addCategory = (sectionKey: string) => {
    setSections((current) => current.map((s) => s.key !== sectionKey ? s : {
      ...s,
      categories: [...s.categories, { id: crypto.randomUUID(), name: "New Category", section: s.section, heading: s.heading, subtitle: s.subtitle, image: "", order: s.categories.length + 1, active: true, showOnHome: true, productIds: [] }],
    }));
  };

  const removeCategory = (sectionKey: string, id: string) => {
    setSections((current) => current.map((s) => s.key !== sectionKey ? s : { ...s, categories: s.categories.filter((c) => c.id !== id) }));
  };

  const removeSection = (key: string) => {
    if (!confirm("Delete this complete Home Page section?")) return;
    setSections((current) => current.filter((s) => s.key !== key));
  };

  const handleImage = (sectionKey: string, id: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    if (file.size > 2 * 1024 * 1024) return alert("Please keep category images below 2 MB.");
    const reader = new FileReader();
    reader.onload = () => updateCategory(sectionKey, id, { image: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  const filteredProducts = (key: string) => {
    const q = String(search[key] || "").toLowerCase().trim();
    if (!q) return products.slice(0, 100);
    return products.filter((p: any) => [p.name, p.title, p.brandName, p.category, p.sku, p.code].join(" ").toLowerCase().includes(q)).slice(0, 100);
  };

  const toggleProduct = (key: string, id: string) => {
    setSections((current) => current.map((s) => {
      if (s.key !== key) return s;
      const has = s.productIds.includes(id);
      return { ...s, productIds: has ? s.productIds.filter((x) => x !== id) : [...s.productIds, id] };
    }));
  };

  const restoreHistory = (entry: HistoryEntry) => {
    const restored = sectionsFromHistory(entry);
    setSections(restored);
    setSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistory = (id: string) => {
    if (!confirm("Delete this history version? This will not change the currently saved Home Page.")) return;
    const next = history.filter((entry) => entry.id !== id);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const save = () => {
    const flat: HomeCategory[] = [];
    sections.forEach((s, si) => {
      const heading = s.heading.trim() || s.section.trim() || "Products";
      const subtitle = s.subtitle.trim() || "Explore more products";
      const section = s.section.trim() || heading;
      s.categories.filter((c) => c.name.trim()).forEach((c, ci) => {
        flat.push({
          ...c,
          section,
          heading,
          subtitle,
          order: Number(s.order || si + 1),
          active: s.active,
          showOnHome: s.showOnHome,
          productIds: [...s.productIds],
          image: c.image || "",
          name: c.name.trim(),
        });
      });
    });
    flat.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    // V10: persist section-level settings separately from individual categories.
    // This makes Heading/Subtitle/Product selection belong to the whole Home section.
    const sectionPayload = sections
      .filter((s) => s.categories.length > 0)
      .map((s, si) => ({
        key: s.key,
        section: s.section.trim() || s.heading.trim() || `Section ${si + 1}`,
        heading: s.heading.trim() || s.section.trim() || `Section ${si + 1}`,
        subtitle: s.subtitle.trim() || "Explore more products",
        order: Number(s.order || si + 1),
        active: s.active,
        showOnHome: s.showOnHome,
        productIds: Array.from(new Set(s.productIds.map(String))),
      }))
      .sort((a, b) => a.order - b.order);

    // Keep history compact. Category images are often base64 data URLs and can
    // easily exceed the browser's localStorage quota if copied into every snapshot.
    // History stores only the editable metadata; the current category store remains
    // the source for images and other large fields.
    const compactItems: HomeCategory[] = flat.map((item) => ({
      id: item.id,
      name: item.name,
      section: item.section,
      heading: item.heading,
      subtitle: item.subtitle,
      image: "",
      order: item.order,
      active: item.active,
      showOnHome: item.showOnHome,
      productIds: [],
    }));

    const snapshot: HistoryEntry = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      items: compactItems,
      sections: sectionPayload,
    };

    // Keep only a small number of compact snapshots. If an older installation
    // already has a large history value, progressively prune it until it fits.
    let nextHistory = [snapshot, ...history].slice(0, 10);
    const persistHistory = () => {
      const serialized = JSON.stringify(nextHistory);
      try {
        localStorage.setItem(HISTORY_KEY, serialized);
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          if (nextHistory.length > 1) {
            nextHistory = nextHistory.slice(0, Math.max(1, Math.floor(nextHistory.length / 2)));
            return persistHistory();
          }
          // Remove any legacy oversized history and keep the current save.
          localStorage.removeItem(HISTORY_KEY);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify([snapshot]));
            nextHistory = [snapshot];
            return true;
          } catch {
            nextHistory = [];
            return false;
          }
        }
        throw error;
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(flat));
    localStorage.setItem(HOME_SECTIONS_KEY, JSON.stringify(sectionPayload));
    persistHistory();

    window.dispatchEvent(new CustomEvent("nightnow_admin_categories_updated"));
    setHistory(nextHistory);
    setSections(groupSections(flat));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!loaded) return <main className="min-h-screen bg-zinc-50 p-6">Loading...</main>;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><h1 className="text-xl font-black">Home Page Sections</h1><p className="mt-1 text-xs text-zinc-500">One heading, subtitle and product selection controls the complete section. Categories are shown inside that section.</p></div>
          <button onClick={addSection} className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white">+ Add Section</button>
        </div>

        <div className="space-y-5">
          {sections.map((s, si) => (
            <section key={s.key} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><p className="text-sm font-black">Home Section #{si + 1}</p><button onClick={() => removeSection(s.key)} className="text-xs font-black text-red-500">Delete Section</button></div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-bold">Section Group<input value={s.section} onChange={(e) => updateSection(s.key, { section: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-bold">Display Order<input type="number" min={1} value={s.order} onChange={(e) => updateSection(s.key, { order: Number(e.target.value) || 1 })} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-bold md:col-span-2">Home Page Heading<input value={s.heading} onChange={(e) => updateSection(s.key, { heading: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Grocery & Kitchen" /></label>
                <label className="text-xs font-bold md:col-span-2">Home Page Subtitle<select value={SUBTITLE_OPTIONS.includes(s.subtitle) ? s.subtitle : SUBTITLE_OPTIONS[0]} onChange={(e) => updateSection(s.key, { subtitle: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">{SUBTITLE_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></label>
                <div className="flex items-end gap-4 pb-2"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={s.showOnHome} onChange={(e) => updateSection(s.key, { showOnHome: e.target.checked })} /> Show on Home</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={s.active} onChange={(e) => updateSection(s.key, { active: e.target.checked })} /> Active</label></div>

                <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-black">Products under this heading</p><p className="mt-1 text-[10px] text-zinc-500">These selected products will appear in this section on Home.</p></div><button type="button" onClick={() => setOpenProducts((v) => ({ ...v, [s.key]: !v[s.key] }))} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black shadow-sm">{openProducts[s.key] ? "Hide Products" : `Choose Products (${s.productIds.length})`}</button></div>
                  {s.productIds.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{s.productIds.map((id) => { const p: any = products.find((x: any) => String(x.id) === id); return <span key={id} className="rounded-full bg-white px-2 py-1 text-[9px] font-bold">{p?.name || id}</span>; })}</div>}
                  {openProducts[s.key] && <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3"><input value={search[s.key] || ""} onChange={(e) => setSearch((v) => ({ ...v, [s.key]: e.target.value }))} placeholder="Search product / brand / category..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs" /><div className="mt-3 grid max-h-80 gap-2 overflow-y-auto md:grid-cols-2">{filteredProducts(s.key).map((p: any) => { const id = String(p.id); const checked = s.productIds.includes(id); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-100 p-2 hover:bg-zinc-50"><input type="checkbox" checked={checked} onChange={() => toggleProduct(s.key, id)} /><div className="min-w-0"><p className="truncate text-[10px] font-black">{p.name || p.title || "Product"}</p><p className="truncate text-[9px] text-zinc-500">{p.brandName || p.category || ""} · ₹{p.price ?? 0}</p></div></label>; })}</div></div>}
                </div>

                <div className="md:col-span-2 flex items-center justify-between"><p className="text-xs font-black">Categories inside this section</p><button onClick={() => addCategory(s.key)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black">+ Add Category</button></div>
                <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {s.categories.map((c) => <div key={c.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-black">Category</span><button onClick={() => removeCategory(s.key, c.id)} className="text-[10px] font-black text-red-500">Delete</button></div><input value={c.name} onChange={(e) => updateCategory(s.key, c.id, { name: e.target.value })} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold" placeholder="Vegetables & Fruits" /><div className="mt-2 flex items-center gap-2"><div className="h-14 w-14 overflow-hidden rounded-lg border bg-white">{c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-contain" /> : <span className="flex h-full items-center justify-center">📦</span>}</div><label className="cursor-pointer rounded-lg border bg-white px-2 py-2 text-[9px] font-black">Upload Image<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(s.key, c.id, e.target.files?.[0])} /></label></div></div>)}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="sticky bottom-3 mt-5 flex justify-end"><button onClick={save} className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black shadow-lg">{saved ? "Saved ✓" : "Save Home Categories"}</button></div>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">Save History</h2>
              <p className="mt-1 text-[10px] text-zinc-500">Last 20 saved versions are kept in this browser. Restore/Edit loads a version into the editor; it does not publish until you press Save.</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {history.length === 0 ? <p className="text-xs text-zinc-400">No save history yet.</p> : history.map((entry) => {
              const sectionCount = entry.sections?.length || new Set(entry.items.map((x) => x.section)).size;
              return (
                <details key={entry.id} className="rounded-xl border border-zinc-200 p-3">
                  <summary className="cursor-pointer text-xs font-black">{new Date(entry.savedAt).toLocaleString()} · {sectionCount} sections</summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => restoreHistory(entry)} className="rounded-lg bg-black px-3 py-2 text-[10px] font-black text-white">Edit / Restore</button>
                    <button type="button" onClick={() => deleteHistory(entry.id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black text-red-600">Delete History</button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {entry.sections?.length ? entry.sections.map((section) => (
                      <div key={`${entry.id}-${section.key}`} className="rounded-lg bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-black text-zinc-800">{section.heading}</p>
                        <p className="text-[9px] text-zinc-500">{section.subtitle} · {section.productIds.length} products</p>
                      </div>
                    )) : Array.from(new Map(entry.items.map((x) => [x.section, x])).values()).map((x) => (
                      <div key={`${entry.id}-${x.section}`} className="rounded-lg bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-black text-zinc-800">{x.heading}</p>
                        <p className="text-[9px] text-zinc-500">{x.subtitle} · {new Set(entry.items.filter((i) => i.section === x.section).flatMap((i) => i.productIds)).size} products · {entry.items.filter((i) => i.section === x.section).length} categories</p>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}