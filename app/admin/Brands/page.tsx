"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

type Brand = {
  id: string;
  name: string;
  active?: boolean;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadBrands = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "brands")
      );

      setBrands(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Brand[]
      );
    } catch (error) {
      console.error(error);
      alert("Brand load failed");
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return brands;

    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const saveBrand = async () => {
    if (!name.trim()) {
      alert("Brand name required");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updateDoc(
          doc(db, "brands", editingId),
          {
            name: name.trim(),
            updatedAt: serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(db, "brands"),
          {
            name: name.trim(),
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      }

      setName("");
      setEditingId("");

      await loadBrands();
    } catch (error) {
      console.error(error);
      alert("Brand save failed");
    } finally {
      setLoading(false);
    }
  };

  const editBrand = (brand: Brand) => {
    setEditingId(brand.id);
    setName(brand.name);
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Delete this brand?")) return;

    try {
      await deleteDoc(
        doc(db, "brands", id)
      );

      await loadBrands();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-8">

      <div className="mx-auto max-w-6xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Brand Master
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Brands add, edit aur delete karein.
          </p>
        </div>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Brand name"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
            />

            <button
              onClick={saveBrand}
              disabled={loading}
              className="rounded-2xl bg-yellow-400 px-6 font-black text-black"
            >
              {editingId ? "Update" : "Add Brand"}
            </button>

            {editingId && (
              <button
                onClick={() => {
                  setEditingId("");
                  setName("");
                }}
                className="rounded-2xl border px-5 font-black"
              >
                Cancel
              </button>
            )}

          </div>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="🔎 Search brand..."
            className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
          />

        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {filtered.map((brand) => (
              <div
                key={brand.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                  🏷️
                </div>

                <h3 className="mt-3 font-black">
                  {brand.name}
                </h3>

                <div className="mt-4 flex gap-2">

                  <button
                    onClick={() =>
                      editBrand(brand)
                    }
                    className="flex-1 rounded-xl bg-white py-2 text-xs font-black"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteBrand(brand.id)
                    }
                    className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-black text-red-600"
                  >
                    🗑️ Delete
                  </button>

                </div>

              </div>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}