"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getCategories,
  addCategory,
  updateCategory,
  updateCategorySettings,
  deleteCategory,
  getCategoriesPageHeading,
  setCategoriesPageHeading,
  type Category,
} from "../../services/categoryService";

import {
  getProducts,
  updateProduct,
  type Product,
} from "../../services/productService";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [image, setImage] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // "All Categories" page heading
  const [pageHeading, setPageHeading] = useState("All Categories");
  const [headingSaving, setHeadingSaving] = useState(false);
  const [headingSaved, setHeadingSaved] = useState(false);

  // Product-assignment panel
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [categoryData, productData, heading] = await Promise.all([
        getCategories(),
        getProducts(),
        getCategoriesPageHeading(),
      ]);
      setCategories(categoryData);
      setProducts(productData.filter((p) => p.active !== false));
      setPageHeading(heading);
    } catch (err) {
      console.error("Load categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeading = async () => {
    try {
      setHeadingSaving(true);
      await setCategoriesPageHeading(pageHeading);
      setHeadingSaved(true);
      setTimeout(() => setHeadingSaved(false), 2000);
    } catch (err) {
      console.error("Save heading error:", err);
      alert("Could not save the heading.");
    } finally {
      setHeadingSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName("");
    setIcon("");
    setImage("");
    setSection("");
    setEditingId(null);
    setError("");
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name || "");
    setIcon(category.icon || "");
    setImage(category.image || "");
    setSection(category.section || "");
    setError("");
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please keep the image under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateCategory(editingId, name.trim(), icon.trim(), image.trim(), section.trim());
      } else {
        await addCategory(name.trim(), icon.trim(), image.trim(), section.trim());
      }

      resetForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await updateCategorySettings(category.id, { active: !category.active });
      await load();
    } catch (err) {
      console.error("Toggle active error:", err);
      alert("Could not toggle Active/Off.");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? It will be removed from the live website immediately.`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      if (managingCategory?.id === category.id) setManagingCategory(null);
      await load();
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Delete failed. Please try again.");
    }
  };

  const isInCategory = (product: Product, category: Category) =>
    (product.category || "").trim().toLowerCase() === category.name.trim().toLowerCase();

  const toggleProductInCategory = async (product: Product, category: Category) => {
    try {
      setTogglingProductId(product.id);
      const currentlyIn = isInCategory(product, category);

      await updateProduct(product.id, {
        category: currentlyIn ? "" : category.name,
        categoryId: currentlyIn ? "" : category.id,
      });

      await load();
    } catch (err) {
      console.error("Toggle product category error:", err);
      alert("Could not update the product's category.");
    } finally {
      setTogglingProductId(null);
    }
  };

  const existingSections = useMemo(() => {
    const seen = new Set<string>();
    categories.forEach((c) => {
      const s = (c.section || "").trim();
      if (s) seen.add(s);
    });
    return Array.from(seen).sort();
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 100);
    return products
      .filter((p) => (p.name || "").toLowerCase().includes(q))
      .slice(0, 100);
  }, [products, productSearch]);

  return (
    <main className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-black">🗂️ Category Management</h1>
        <p className="mt-1 text-sm text-zinc-500">
          This is directly connected to Firestore — any add, edit, or delete here updates the live website
          instantly.
        </p>

        {/* ALL CATEGORIES PAGE HEADING */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-black">🏷️ "All Categories" Page Heading</h2>
          <p className="mt-1 text-xs text-zinc-500">
            This text appears at the top of the Categories page on the storefront.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={pageHeading}
              onChange={(e) => setPageHeading(e.target.value)}
              placeholder="All Categories"
              className="flex-1 rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={handleSaveHeading}
              disabled={headingSaving}
              className="shrink-0 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60"
            >
              {headingSaving ? "Saving..." : headingSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

        {/* FORM */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-black">
            {editingId ? "Edit Category" : "+ Add New Category"}
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category Name (e.g. Grocery)"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Emoji icon (e.g. 🛒) — optional"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />

            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {image ? (
                  <img src={image} alt="preview" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-lg">🖼️</span>
                )}
              </div>
              <label className="flex-1 cursor-pointer rounded-xl border border-zinc-200 p-3 text-center text-xs font-black text-zinc-600">
                {image ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="shrink-0 rounded-xl border border-zinc-200 px-2 py-3 text-[10px] font-black text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder='Group / Section (e.g. "Snacks & Drinks") — categories with the same group show together'
              list="category-sections"
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />
            <datalist id="category-sections">
              {existingSections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-black">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-black">
            Categories ({categories.length})
          </h2>

          {loading ? (
            <p className="mt-4 text-xs text-zinc-400">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="mt-4 text-xs text-zinc-400">No categories yet. Add one above.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {categories.map((category) => {
                const productCount = products.filter((p) => isInCategory(p, category)).length;
                const isManaging = managingCategory?.id === category.id;

                return (
                  <div key={category.id} className="rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xl">{category.icon || "🛍️"}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{category.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {category.active !== false ? "Active" : "Off"} • {productCount} products
                          {category.section ? ` • 🏷️ ${category.section}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleActive(category)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black ${
                          category.active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {category.active !== false ? "Active" : "Off"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setManagingCategory(isManaging ? null : category);
                          setProductSearch("");
                        }}
                        className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700"
                      >
                        {isManaging ? "Close" : "Products"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-[10px] font-black text-zinc-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    {/* PRODUCT ASSIGNMENT PANEL */}
                    {isManaging && (
                      <div className="border-t border-zinc-100 p-3">
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search product..."
                          className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs outline-none"
                        />

                        <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <p className="text-xs text-zinc-400">No products found.</p>
                          ) : (
                            filteredProducts.map((product) => {
                              const checked = isInCategory(product, category);
                              return (
                                <label
                                  key={product.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={togglingProductId === product.id}
                                    onChange={() => toggleProductInCategory(product, category)}
                                    className="h-4 w-4"
                                  />
                                  <span className="flex-1 truncate text-xs font-semibold">{product.name}</span>
                                  {product.category && !checked && (
                                    <span className="shrink-0 text-[9px] text-zinc-400">
                                      currently: {product.category}
                                    </span>
                                  )}
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
