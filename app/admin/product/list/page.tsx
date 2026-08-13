"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

type Product = {
  id: string;
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  image?: string;
  active?: boolean;
};

export default function ProductListPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const snapshot =
        await getDocs(
          collection(db, "products")
        );

      setProducts(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Product[]
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) =>
      [
        product.name,
        product.brand,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  const removeProduct = async (
    id: string
  ) => {
    if (!confirm("Delete product?"))
      return;

    try {
      await deleteDoc(
        doc(db, "products", id)
      );

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-8">

      <div className="mx-auto max-w-7xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black text-yellow-600">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Product Management
          </h1>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="🔎 Search product, brand, category..."
            className="mt-5 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
          />

        </div>

        {loading ? (
          <div className="py-20 text-center">
            Loading products...
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {filtered.map((product) => {

              const price =
                Number(product.price || 0);

              const mrp =
                Number(product.mrp || 0);

              const discount =
                mrp > price && mrp > 0
                  ? Math.round(
                      ((mrp - price) /
                        mrp) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm"
                >

                  <div className="relative h-48 bg-slate-50">

                    <img
                      src={
                        product.image ||
                        "/no-image.png"
                      }
                      alt={
                        product.name ||
                        "Product"
                      }
                      className="h-full w-full object-contain"
                    />

                    {discount > 0 && (
                      <span className="absolute left-3 top-3 rounded-lg bg-green-600 px-2 py-1 text-xs font-black text-white">
                        {discount}% OFF
                      </span>
                    )}

                  </div>

                  <div className="p-4">

                    <p className="text-xs text-slate-400">
                      {product.category}
                    </p>

                    <h2 className="mt-1 line-clamp-2 font-black">
                      {product.name}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {product.brand}
                    </p>

                    <div className="mt-3 flex items-center gap-2">

                      <span className="text-xl font-black text-green-600">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{mrp}
                        </span>
                      )}

                    </div>

                    <p className="mt-2 text-xs font-bold">
                      Stock:{" "}
                      {product.stock ?? 0}
                    </p>

                    <div className="mt-4 flex gap-2">

                      <a
                        href={`/admin/product/${product.id}`}
                        className="flex-1 rounded-xl bg-yellow-400 py-2 text-center text-xs font-black"
                      >
                        ✏️ Edit
                      </a>

                      <button
                        onClick={() =>
                          removeProduct(
                            product.id
                          )
                        }
                        className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-black text-red-600"
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}