"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { getProducts } from "../../services/productService";

type Product = {
  id: string;
  name?: string;
  image?: string;
  images?: string[];
  price?: number;
  mrp?: number;
  category?: string;
  brandName?: string;
  active?: boolean;
};

type Category = {
  id: string;
  name: string;
  section: string;
  image: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
};

const STORAGE_KEY = "nightnow_admin_categories";

const DEFAULT_CATEGORY_ROWS: Array<
  [string, string, string, string, number]
> = [
  ["vegetables-fruits", "Vegetables & Fruits", "Grocery & Kitchen", "/categories/vegetables.png", 1],
  ["atta-rice-dal", "Atta, Rice & Dal", "Grocery & Kitchen", "/categories/atta-rice-dal.png", 2],
  ["oil-ghee-masala", "Oil, Ghee & Masala", "Grocery & Kitchen", "/categories/oil-ghee-masala.png", 3],
  ["dairy-bread-eggs", "Dairy, Bread & Eggs", "Grocery & Kitchen", "/categories/dairy-bread-eggs.png", 4],
  ["bakery-biscuits", "Bakery & Biscuits", "Grocery & Kitchen", "/categories/bakery-biscuits.png", 5],
  ["dry-fruits-cereals", "Dry Fruits & Cereals", "Grocery & Kitchen", "/categories/dry-fruits-cereals.png", 6],
  ["chicken-meat-fish", "Chicken, Meat & Fish", "Grocery & Kitchen", "/categories/chicken-meat-fish.png", 7],
  ["kitchenware", "Kitchenware & Appliances", "Grocery & Kitchen", "/categories/kitchenware.png", 8],
  ["chips-namkeen", "Chips & Namkeen", "Snacks & Drinks", "/categories/chips-namkeen.png", 1],
  ["sweets-chocolates", "Sweets & Chocolates", "Snacks & Drinks", "/categories/sweets-chocolates.png", 2],
  ["drinks-juices", "Drinks & Juices", "Snacks & Drinks", "/categories/drinks-juices.png", 3],
  ["tea-coffee", "Tea, Coffee & Milk", "Snacks & Drinks", "/categories/tea-coffee.png", 4],
  ["instant-food", "Instant Food", "Snacks & Drinks", "/categories/instant-food.png", 5],
  ["sauces-spreads", "Sauces & Spreads", "Snacks & Drinks", "/categories/sauces-spreads.png", 6],
  ["paan-corner", "Paan Corner", "Snacks & Drinks", "/categories/paan-corner.png", 7],
  ["ice-creams", "Ice Creams & More", "Snacks & Drinks", "/categories/ice-creams.png", 8],
  ["bath-body", "Bath & Body", "Beauty & Personal Care", "/categories/bath-body.png", 1],
  ["hair-care", "Hair Care", "Beauty & Personal Care", "/categories/hair-care.png", 2],
  ["skin-care", "Skin Care", "Beauty & Personal Care", "/categories/skin-care.png", 3],
  ["makeup", "Makeup", "Beauty & Personal Care", "/categories/makeup.png", 4],
];

const DEFAULT_CATEGORIES: Category[] =
  DEFAULT_CATEGORY_ROWS.map(
    ([id, name, section, image, order]): Category => ({
      id,
      name,
      section,
      image,
      order,
      active: true,
      showOnHome: true,
      productIds: [],
    })
  );

const SECTIONS = [
  "Grocery & Kitchen",
  "Snacks & Drinks",
  "Beauty & Personal Care",
  "Medicines",
  "Home & Cleaning",
  "Other",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState(SECTIONS[0]);
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProducts();
        const list = Array.isArray(data)
          ? data.filter((item: any) => item?.active !== false)
          : [];
        setProducts(list as Product[]);
      } catch (error) {
        console.error("Category product loading failed:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedId),
    [categories, selectedId]
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.brandName,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [products, search]);

  const persist = (next: Category[]) => {
    setCategories(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateCategory = (
    id: string,
    changes: Partial<Category>
  ) => {
    persist(
      categories.map((category) =>
        category.id === id
          ? { ...category, ...changes }
          : category
      )
    );
  };

  const toggleProduct = (productId: string) => {
    if (!selectedCategory) return;

    const hasProduct = selectedCategory.productIds.includes(productId);

    updateCategory(selectedCategory.id, {
      productIds: hasProduct
        ? selectedCategory.productIds.filter((id) => id !== productId)
        : [...selectedCategory.productIds, productId],
    });
  };

  const addCategory = () => {
    const name = newName.trim();

    if (!name) {
      alert("Category name enter karein.");
      return;
    }

    if (
      categories.some(
        (category) =>
          category.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("Ye category already exist karti hai.");
      return;
    }

    const sectionCount = categories.filter(
      (category) => category.section === newSection
    ).length;

    const category: Category = {
      id: `${slugify(name)}-${Date.now()}`,
      name,
      section: newSection,
      image: newImage.trim() || "/categories/default.png",
      order: sectionCount + 1,
      active: true,
      showOnHome: true,
      productIds: [],
    };

    persist([...categories, category]);
    setSelectedId(category.id);
    setNewName("");
    setNewImage("");
    setShowAdd(false);
  };

  const deleteCategory = (id: string) => {
    if (!window.confirm("Ye category delete karni hai?")) return;

    persist(categories.filter((category) => category.id !== id));

    if (selectedId === id) {
      setSelectedId("");
    }
  };

  const moveCategory = (id: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((category) => category.id === id);

    if (index < 0) return;

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sorted.length) return;

    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];

    persist(
      sorted.map((category, index) => ({
        ...category,
        order: index + 1,
      }))
    );
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewImage(String(reader.result || ""));
    };

    reader.readAsDataURL(file);
  };

  const handleSelectedImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateCategory(selectedCategory.id, {
        image: String(reader.result || ""),
      });
    };

    reader.readAsDataURL(file);
  };

  const saveAll = () => {
    setSaving(true);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(categories)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6">

        <header className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black">
              Category Management
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Home categories, images aur product mapping manage karein.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdd((value) => !value)}
              className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black"
            >
              + Add Category
            </button>

            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="rounded-xl bg-black px-4 py-3 text-xs font-black text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </header>

        {showAdd && (
          <section className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Add New Category</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Category Name"
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <select
                value={newSection}
                onChange={(event) => setNewSection(event.target.value)}
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none"
              >
                {SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>

              <input
                value={newImage}
                onChange={(event) => setNewImage(event.target.value)}
                placeholder="/categories/image.png"
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>

              {newImage && (
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-100">
                  <img
                    src={newImage}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={addCategory}
                className="rounded-xl bg-green-600 px-5 py-3 text-xs font-black text-white"
              >
                Create Category
              </button>
            </div>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">

          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black">Categories</h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black">
                {categories.length}
              </span>
            </div>

            <div className="space-y-2">
              {[...categories]
                .sort((a, b) => a.order - b.order)
                .map((category, index) => (
                  <div
                    key={category.id}
                    className={[
                      "rounded-2xl border p-3",
                      selectedId === category.id
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-zinc-200 bg-white",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(category.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eefafa]">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {category.name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-zinc-400">
                          {category.section}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-green-600">
                          {category.productIds.length} products
                        </p>
                      </div>
                    </button>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => moveCategory(category.id, "up")}
                        disabled={index === 0}
                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-black disabled:opacity-30"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCategory(category.id, "down")}
                        disabled={index === categories.length - 1}
                        className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-black disabled:opacity-30"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateCategory(category.id, {
                            active: !category.active,
                          })
                        }
                        className={[
                          "rounded-lg px-2 py-1 text-[10px] font-black",
                          category.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {category.active ? "Active" : "Off"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateCategory(category.id, {
                            showOnHome: !category.showOnHome,
                          })
                        }
                        className={[
                          "rounded-lg px-2 py-1 text-[10px] font-black",
                          category.showOnHome
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500",
                        ].join(" ")}
                      >
                        {category.showOnHome ? "Home" : "Hidden"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
                        className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            {!selectedCategory ? (
              <div className="flex min-h-[400px] items-center justify-center text-center">
                <div>
                  <div className="text-5xl">📂</div>
                  <h2 className="mt-3 font-black">
                    Select a Category
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Left side se category select karein.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 md:flex-row md:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eefafa]">
                    {selectedCategory.image ? (
                      <img
                        src={selectedCategory.image}
                        alt={selectedCategory.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black">
                      {selectedCategory.name}
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                      {selectedCategory.section}
                    </p>

                    <p className="mt-2 text-xs font-bold text-green-600">
                      {selectedCategory.productIds.length} products selected
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelectedImageUpload}
                        className="hidden"
                      />
                    </label>

                    <select
                      value={selectedCategory.section}
                      onChange={(event) =>
                        updateCategory(selectedCategory.id, {
                          section: event.target.value,
                        })
                      }
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black outline-none"
                    >
                      {SECTIONS.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product / brand..."
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="mt-4">
                  {loading ? (
                    <div className="py-10 text-center text-sm text-zinc-400">
                      Loading products...
                    </div>
                  ) : visibleProducts.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="text-4xl">🔍</div>
                      <p className="mt-2 text-sm font-bold text-zinc-500">
                        Product nahi mila.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {visibleProducts.map((product) => {
                        const selected =
                          selectedCategory.productIds.includes(product.id);

                        const image =
                          product.image ||
                          product.images?.[0] ||
                          "";

                        return (
                          <button
                            type="button"
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={[
                              "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                              selected
                                ? "border-green-400 bg-green-50"
                                : "border-zinc-200 bg-white hover:border-yellow-300",
                            ].join(" ")}
                          >
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name || "Product"}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <span>📦</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-black">
                                {product.name || "Product"}
                              </p>

                              {product.brandName && (
                                <p className="mt-1 truncate text-[10px] font-bold text-yellow-600">
                                  {product.brandName}
                                </p>
                              )}

                              <p className="mt-1 text-[10px] text-zinc-400">
                                Current: {product.category || "Not set"}
                              </p>
                            </div>

                            <span
                              className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black",
                                selected
                                  ? "bg-green-600 text-white"
                                  : "bg-zinc-100 text-zinc-400",
                              ].join(" ")}
                            >
                              {selected ? "✓" : "+"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}