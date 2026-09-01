"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getCategories,
  addCategory,
  updateCategory,
  updateCategorySettings,
  deleteCategory,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Product-assignment panel
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [categoryData, productData] = await Promise.all([getCategories(), getProducts()]);
      setCategories(categoryData);
      setProducts(productData.filter((p) => p.active !== false));
    } catch (err) {
      console.error("Load categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName("");
    setIcon("");
    setImage("");
    setEditingId(null);
    setError("");
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name || "");
    setIcon(category.icon || "");
    setImage(category.image || "");
    setError("");
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image 2 MB se choti rakho.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Category ka naam likho.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateCategory(editingId, name.trim(), icon.trim(), image.trim());
      } else {
        await addCategory(name.trim(), icon.trim(), image.trim());
      }

      resetForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Save nahi ho paya.");
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
      alert("Active/Off toggle nahi ho paya.");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" ko delete karna hai? Yeh live website se turant hat jayegi.`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      if (managingCategory?.id === category.id) setManagingCategory(null);
      await load();
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Delete nahi ho paya.");
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
      alert("Product category update nahi ho payi.");
    } finally {
      setTogglingProductId(null);
    }
  };

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
          Yeh seedha Firestore se connected hai — yahan se add/edit/delete karte hi live website turant update
          ho jayegi.
        </p>

        {/* FORM */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-black">
            {editingId ? "Category Edit Karo" : "+ Naya Category Add Karo"}
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category Name (jaise Grocery)"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Emoji icon (jaise 🛒) — optional"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none"
            />

            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {image ? (
                  <img src={image} alt="preview" className="h-full w-full object-cover" />
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

          {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Karo" : "Add Karo"}
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
            <p className="mt-4 text-xs text-zinc-400">Abhi koi category nahi hai. Upar se add karo.</p>
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
                          <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl">{category.icon || "🛍️"}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{category.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {category.active !== false ? "Active" : "Off"} • {productCount} products
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
                            <p className="text-xs text-zinc-400">Koi product nahi mila.</p>
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
