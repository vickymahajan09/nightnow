"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { addCategory, getCategories, updateCategory, deleteCategory } from "../../services/categoryService";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload";

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [image, setImage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadCategories = async () => {
    try { setCategories(await getCategories()); } catch (error) { console.error(error); }
  };

  useEffect(() => { loadCategories(); }, []);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "nightnow");
      const response = await axios.post(CLOUDINARY_URL, formData);
      setImage(response.data?.secure_url || "");
      if (!response.data?.secure_url) throw new Error("Upload URL missing");
    } catch (error) {
      console.error(error);
      alert("Category image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveCategory = async () => {
    if (!name.trim()) return alert("Enter category name.");
    setLoading(true);
    try {
      if (editingId) await updateCategory(editingId, name, icon, image);
      else await addCategory(name, icon, image);
      clearForm();
      await loadCategories();
      alert(editingId ? "Category Updated" : "Category Added");
    } catch (error) {
      console.error(error);
      alert("Failed to save category.");
    } finally { setLoading(false); }
  };

  const editCategory = (category: any) => {
    setEditingId(category.id);
    setName(category.name || "");
    setIcon(category.icon || "");
    setImage(category.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await deleteCategory(id); await loadCategories(); } catch (error) { console.error(error); alert("Failed to delete category"); }
  };

  const clearForm = () => { setName(""); setIcon(""); setImage(""); setEditingId(""); };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black text-yellow-400 sm:text-4xl">Categories</h1>
        <p className="mt-2 text-sm text-zinc-500">Mobile se category create/edit aur image upload karein.</p>

        <div className="mt-6 max-w-xl rounded-2xl bg-zinc-900 p-4 sm:p-6">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category Name" className="mb-3 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Emoji Icon (optional)" className="mb-3 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />
          <label className="mb-3 block cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-800 p-4 text-center font-bold">
            {uploading ? "Uploading..." : "📷 Upload Category Image"}
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" />
          </label>
          {image && <img src={image} alt="Category preview" className="mb-4 h-28 w-28 rounded-2xl object-cover" />}
          <button onClick={saveCategory} disabled={loading || uploading} className="w-full rounded-xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50">{loading ? "Saving..." : editingId ? "Update Category" : "Save Category"}</button>
          {editingId && <button onClick={clearForm} className="mt-3 w-full rounded-xl bg-zinc-800 py-3 font-bold">Cancel</button>}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category: any) => (
            <div key={category.id} className="rounded-2xl bg-zinc-900 p-3 sm:p-5">
              {category.image ? <img src={category.image} alt={category.name} className="h-24 w-full rounded-xl object-cover sm:h-32" /> : <div className="flex h-24 items-center justify-center rounded-xl bg-zinc-800 text-4xl sm:h-32">{category.icon || "📦"}</div>}
              <h2 className="mt-3 truncate font-bold">{category.name}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => editCategory(category)} className="rounded-lg bg-blue-600 py-2 text-sm font-bold">Edit</button>
                <button onClick={() => removeCategory(category.id)} className="rounded-lg bg-red-600 py-2 text-sm font-bold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
