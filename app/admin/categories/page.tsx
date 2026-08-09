"use client";

import { useEffect, useState } from "react";

import {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const [categories, setCategories] =
    useState<any[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const saveCategory = async () => {
    if (!name.trim() || !icon.trim()) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await updateCategory(
          editingId,
          name.trim(),
          icon.trim()
        );

        alert("Category Updated");
      } else {
        await addCategory(
          name.trim(),
          icon.trim()
        );

        alert("Category Added");
      }

      setName("");
      setIcon("");
      setEditingId("");

      await loadCategories();
    } catch (error) {
      console.error(error);
      alert("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const editCategory = (category: any) => {
    setEditingId(category.id);
    setName(category.name || "");
    setIcon(category.icon || "");
  };

  const removeCategory = async (
    id: string
  ) => {
    if (!confirm("Delete this category?")) {
      return;
    }

    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (error) {
      console.error(error);
      alert("Failed to delete category");
    }
  };

  const cancelEdit = () => {
    setEditingId("");
    setName("");
    setIcon("");
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-bold text-yellow-400">
          Categories
        </h1>

        <div className="mt-8 max-w-md rounded-2xl bg-zinc-900 p-5">

          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <input
            type="text"
            placeholder="Category Icon (💊)"
            value={icon}
            onChange={(e) =>
              setIcon(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <button
            onClick={saveCategory}
            disabled={loading}
            className="w-full rounded-lg bg-yellow-400 py-3 font-bold text-black disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update Category"
              : "Save Category"}
          </button>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="mt-3 w-full rounded-lg bg-zinc-800 py-3 font-bold"
            >
              Cancel
            </button>
          )}

        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {categories.map(
            (category: any) => (
              <div
                key={category.id}
                className="rounded-2xl bg-zinc-900 p-5"
              >

                <div className="text-5xl">
                  {category.icon || "📦"}
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  {category.name}
                </h2>

                <div className="mt-5 flex gap-2">

                  <button
                    onClick={() =>
                      editCategory(category)
                    }
                    className="flex-1 rounded-lg bg-blue-600 py-2 font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      removeCategory(
                        category.id
                      )
                    }
                    className="flex-1 rounded-lg bg-red-600 py-2 font-bold"
                  >
                    Delete
                  </button>

                </div>

              </div>
            )
          )}

        </div>

        {categories.length === 0 && (
          <div className="mt-10 rounded-xl bg-zinc-900 p-10 text-center text-zinc-400">
            No Categories Found
          </div>
        )}

      </div>

    </main>
  );
}