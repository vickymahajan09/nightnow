"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

type Category = {
  id: string;
  name?: string;
  icon?: string;
  image?: string;
  active?: boolean;
  [key: string]: any;
};

const DEFAULT_CATEGORIES = [
  { name: "Vegetables", icon: "🥦" },
  { name: "Fruits", icon: "🍎" },
  { name: "Dairy", icon: "🥛" },
  { name: "Beverages", icon: "🥤" },
  { name: "Snacks", icon: "🍿" },
  { name: "Biscuits", icon: "🍪" },
  { name: "Chocolates", icon: "🍫" },
  { name: "Ice Cream", icon: "🍦" },
  { name: "Personal Care", icon: "🧴" },
  { name: "Baby Care", icon: "👶" },
  { name: "Household", icon: "🏠" },
  { name: "Pharmacy", icon: "💊" },
  { name: "Daily Essentials", icon: "🛒" },
  { name: "Others", icon: "📦" },
];

export default function CategoriesPage() {
  const [name, setName] =
    useState("");

  const [icon, setIcon] =
    useState("");

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const loadCategories = async () => {
    try {
      setPageLoading(true);

      const data =
        await getCategories();

      setCategories(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Category loading error:",
        error
      );

      alert(
        "Failed to load categories"
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredCategories =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return categories;
      }

      return categories.filter(
        (category) =>
          String(
            category.name || ""
          )
            .toLowerCase()
            .includes(value)
      );
    }, [
      categories,
      search,
    ]);

  // ==========================================
  // SAVE
  // ==========================================

  const saveCategory = async () => {
    const cleanName =
      name.trim();

    const cleanIcon =
      icon.trim();

    if (!cleanName) {
      alert(
        "Category name required"
      );
      return;
    }

    if (!cleanIcon) {
      alert(
        "Category icon required"
      );
      return;
    }

    // duplicate check
    const duplicate =
      categories.some(
        (category) =>
          category.id !==
            editingId &&
          String(
            category.name || ""
          )
            .trim()
            .toLowerCase() ===
            cleanName.toLowerCase()
      );

    if (duplicate) {
      alert(
        "This category already exists."
      );
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updateCategory(
          editingId,
          cleanName,
          cleanIcon
        );

        alert(
          "✅ Category Updated"
        );
      } else {
        await addCategory(
          cleanName,
          cleanIcon
        );

        alert(
          "✅ Category Added"
        );
      }

      clearForm();

      await loadCategories();
    } catch (error) {
      console.error(
        "Category save error:",
        error
      );

      alert(
        "❌ Failed to save category"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const editCategory = (
    category: Category
  ) => {
    setEditingId(
      category.id
    );

    setName(
      category.name || ""
    );

    setIcon(
      category.icon || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const removeCategory = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Delete this category?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteCategory(
        id
      );

      alert(
        "✅ Category Deleted"
      );

      await loadCategories();
    } catch (error) {
      console.error(
        "Category delete error:",
        error
      );

      alert(
        "❌ Failed to delete category"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR
  // ==========================================

  const clearForm = () => {
    setEditingId("");
    setName("");
    setIcon("");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
                NIGHT NOW ADMIN
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Category Master
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Front page ki categories yahan
                manage karein.
              </p>

            </div>

            <div className="rounded-2xl bg-yellow-50 px-5 py-3 text-center">

              <p className="text-2xl font-black text-yellow-700">
                {categories.length}
              </p>

              <p className="text-xs font-bold text-yellow-600">
                Total Categories
              </p>

            </div>

          </div>

        </div>

        {/* =====================================
            ADD / EDIT FORM
        ====================================== */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 font-black text-yellow-700">
              {editingId
                ? "✏️"
                : "+"}
            </span>

            <div>

              <h2 className="text-xl font-black">
                {editingId
                  ? "Edit Category"
                  : "Add Category"}
              </h2>

              <p className="text-xs text-slate-500">
                Category name aur icon set karein.
              </p>

            </div>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]">

            {/* NAME */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Category Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    saveCategory();
                  }
                }}
                placeholder="Example: Vegetables"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100"
              />

            </div>

            {/* ICON */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Icon
              </label>

              <input
                type="text"
                value={icon}
                onChange={(event) =>
                  setIcon(
                    event.target.value
                  )
                }
                placeholder="🥦"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100"
              />

            </div>

            {/* BUTTON */}

            <div className="flex items-end gap-2">

              <button
                type="button"
                onClick={
                  saveCategory
                }
                disabled={loading}
                className="h-12 flex-1 rounded-2xl bg-yellow-400 px-6 font-black text-black hover:bg-yellow-300 disabled:opacity-50 md:flex-none"
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Add Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={
                    clearForm
                  }
                  disabled={loading}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-5 font-black text-slate-700"
                >
                  Cancel
                </button>
              )}

            </div>

          </div>

          {/* QUICK CATEGORIES */}

          {!editingId && (
            <div className="mt-5">

              <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">
                Quick Add
              </p>

              <div className="flex flex-wrap gap-2">

                {DEFAULT_CATEGORIES.map(
                  (item) => (
                    <button
                      key={
                        item.name
                      }
                      type="button"
                      onClick={() => {
                        setName(
                          item.name
                        );
                        setIcon(
                          item.icon
                        );
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold transition hover:border-yellow-300 hover:bg-yellow-50"
                    >
                      {item.icon}{" "}
                      {item.name}
                    </button>
                  )
                )}

              </div>

            </div>
          )}

        </section>

        {/* =====================================
            SEARCH
        ====================================== */}

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">

          <div className="relative">

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search category..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-yellow-400 focus:bg-white"
            />

          </div>

        </section>

        {/* =====================================
            CATEGORY LIST
        ====================================== */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-black">
                All Categories
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredCategories.length}{" "}
                categories showing
              </p>

            </div>

            <button
              type="button"
              onClick={
                loadCategories
              }
              disabled={
                pageLoading ||
                loading
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50"
            >
              ↻ Refresh
            </button>

          </div>

          {pageLoading ? (

            <div className="py-16 text-center">

              <div className="text-4xl">
                ⏳
              </div>

              <p className="mt-3 font-bold text-slate-500">
                Loading categories...
              </p>

            </div>

          ) : filteredCategories.length ===
            0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl">
                📦
              </div>

              <p className="mt-3 font-black">
                No categories found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add your first category above.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {filteredCategories.map(
                (category) => (
                  <div
                    key={
                      category.id
                    }
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-yellow-300 hover:bg-yellow-50"
                  >

                    {/* ICON */}

                    <div className="flex items-start justify-between">

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                        {category.icon ||
                          "📦"}
                      </div>

                      <span className="rounded-full bg-green-100 px-2 py-1 text-[9px] font-black text-green-700">
                        ACTIVE
                      </span>

                    </div>

                    {/* NAME */}

                    <h3 className="mt-4 truncate font-black">
                      {category.name ||
                        "Unnamed"}
                    </h3>

                    {/* ACTIONS */}

                    <div className="mt-4 flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          editCategory(
                            category
                          )
                        }
                        className="flex-1 rounded-xl bg-white py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-yellow-100"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeCategory(
                            category.id
                          )
                        }
                        disabled={loading}
                        className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}