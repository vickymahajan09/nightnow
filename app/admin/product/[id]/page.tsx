"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  getProductById,
  updateProductStock,
} from "../../../services/productService";

export default function AdminProductDetailsPage() {
  const params = useParams();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadProduct();
    }
  }, [params]);

  const loadProduct = async () => {
    try {
      const data = await getProductById(
        params.id as string
      );

      setProduct(data);

      if (data) {
        setStock(String(data.stock || 0));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveStock = async () => {
    if (!product) return;

    const newStock = Number(stock);

    if (newStock < 0) {
      alert("Stock cannot be negative");
      return;
    }

    setSaving(true);

    try {
      await updateProductStock(
        product.id,
        newStock
      );

      setProduct({
        ...product,
        stock: newStock,
      });

      alert("Stock Updated Successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-center text-white">
        Loading...
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-center text-white">
        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>

        <Link href="/admin/product">
          <button className="mt-6 rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black">
            Back to Products
          </button>
        </Link>
      </main>
    );
  }

  const currentStock = Number(
    product.stock || 0
  );

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white md:p-8">

      <div className="mx-auto max-w-5xl">

        <Link href="/admin/product">
          <button className="mb-6 rounded-lg bg-zinc-800 px-5 py-2">
            ← Back
          </button>
        </Link>

        <div className="grid gap-8 md:grid-cols-2">

          <div>
            <img
              src={
                product.image ||
                "/no-image.png"
              }
              alt={product.name}
              className="h-[450px] w-full rounded-2xl object-cover"
            />
          </div>

          <div>

            <h1 className="text-4xl font-black">
              {product.name}
            </h1>

            <p className="mt-4 text-3xl font-bold text-yellow-400">
              ₹ {product.price}
            </p>

            <div className="mt-6 rounded-xl bg-zinc-900 p-5">

              <p className="text-zinc-400">
                Current Stock
              </p>

              <p
                className={`mt-2 text-3xl font-black ${
                  currentStock <= 5
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {currentStock}
              </p>

              {currentStock <= 5 && (
                <p className="mt-2 text-sm font-bold text-red-400">
                  ⚠️ LOW STOCK
                </p>
              )}

            </div>

            <div className="mt-5 rounded-xl bg-zinc-900 p-5">

              <p className="text-zinc-400">
                Update Stock
              </p>

              <div className="mt-3 flex gap-2">

                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value)
                  }
                  className="min-w-0 flex-1 rounded-lg bg-zinc-800 p-3 outline-none"
                />

                <button
                  onClick={saveStock}
                  disabled={saving}
                  className="rounded-lg bg-yellow-400 px-5 font-bold text-black disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Update"}
                </button>

              </div>

            </div>

            <div className="mt-5 rounded-xl bg-zinc-900 p-5">

              <p className="text-zinc-400">
                Description
              </p>

              <p className="mt-2 text-zinc-300">
                {product.description ||
                  "No Description"}
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}