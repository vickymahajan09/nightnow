"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WishlistProduct = {
  id: string;
  name?: string;
  price?: number;
  mrp?: number;
  image?: string;
};

export default function WishlistPage() {
  const [products, setProducts] = useState<
    WishlistProduct[]
  >([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "nightnow_wishlist_products"
        ) || "[]"
      );

      setProducts(
        Array.isArray(saved)
          ? saved
          : []
      );
    } catch {
      setProducts([]);
    }
  }, []);

  const remove = (id: string) => {
    const updated =
      products.filter(
        (item) => item.id !== id
      );

    setProducts(updated);

    localStorage.setItem(
      "nightnow_wishlist_products",
      JSON.stringify(updated)
    );

    const ids = updated.map(
      (item) => item.id
    );

    localStorage.setItem(
      "nightnow_wishlist",
      JSON.stringify(ids)
    );
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">

      <div className="mx-auto max-w-5xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-black">
            Your Wishlist ❤️
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Products you saved for later.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">

            <div className="text-6xl">
              ❤️
            </div>

            <h2 className="mt-4 text-xl font-black">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Like a product and it will appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black"
            >
              Start Shopping
            </Link>

          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {products.map(
              (product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
                >

                  <Link
                    href={`/product/${product.id}`}
                  >
                    <div className="flex h-40 items-center justify-center bg-zinc-100 dark:bg-zinc-800">

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={
                            product.name ||
                            "Product"
                          }
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-4xl">
                          📦
                        </span>
                      )}

                    </div>
                  </Link>

                  <div className="p-3">

                    <p className="line-clamp-2 text-sm font-black">
                      {product.name ||
                        "Product"}
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="font-black">
                        ₹
                        {product.price ||
                          0}
                      </span>

                      {product.mrp &&
                        product.mrp >
                          Number(
                            product.price ||
                              0
                          ) && (
                          <span className="text-xs text-zinc-400 line-through">
                            ₹{product.mrp}
                          </span>
                        )}

                    </div>

                    <button
                      onClick={() =>
                        remove(
                          product.id
                        )
                      }
                      className="mt-3 w-full rounded-lg bg-red-50 py-2 text-xs font-black text-red-600 dark:bg-red-950"
                    >
                      Remove
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </main>
  );
}