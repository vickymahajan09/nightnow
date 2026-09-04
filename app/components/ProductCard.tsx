"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { useCart } from "../context/CartContext";

type Product = {
  id: string;
  name?: string;
  category?: string;
  image?: string;
  images?: string[];
  price?: number;
  mrp?: number;
  stock?: number;
  size?: string;
  weight?: string;
  volume?: string;
  pack?: string;
  variantId?: string;
  variantName?: string;
  variants?: any[];
  [key: string]: any;
};

export default function ProductCard({
  selectedCategory = "",
  search = "",
}: {
  selectedCategory?: string;
  search?: string;
}) {
  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
  } = useCart();

  const [products, setProducts] =
    useState<Product[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [wishlist, setWishlist] =
    useState<string[]>([]);
  const [retryKey, setRetryKey] =
    useState(0);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        // Guard against a hung Firestore request (bad config / blocked
        // rules / network issue) so the UI never gets stuck on
        // "Loading..." forever.
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("timeout")),
            10000
          )
        );

        const snapshot = await Promise.race([
          getDocs(collection(db, "products")),
          timeout,
        ]);

        if (!mounted) return;

        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          // Skip products explicitly marked inactive, same rule
          // ProductGridPro already applies — keeps both lists consistent.
          .filter((p: any) => p?.active !== false) as Product[];

        setProducts(data);
      } catch (err) {
        console.error(
          "Product loading error:",
          err
        );
        if (mounted) {
          setError(
            "Couldn't load products. Please check your connection and try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [retryKey]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "nightnow_wishlist"
        ) || "[]"
      );

      if (Array.isArray(saved)) {
        setWishlist(saved);
      }
    } catch (err) {
      console.error(
        "Wishlist loading error:",
        err
      );
    }
  }, []);

  const toggleWishlist = (
    productId: string
  ) => {
    setWishlist((current) => {
      const updated =
        current.includes(productId)
          ? current.filter(
              (id) => id !== productId
            )
          : [
              ...current,
              productId,
            ];

      try {
        localStorage.setItem(
          "nightnow_wishlist",
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error(
          "Wishlist save error:",
          err
        );
      }

      return updated;
    });
  };

  const filteredProducts =
    useMemo(() => {
      const searchText =
        search.trim().toLowerCase();

      const categoryText =
        selectedCategory
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const productCategory =
            String(
              product.category || ""
            ).toLowerCase();

          const categoryMatch =
            !categoryText ||
            categoryText === "all" ||
            productCategory ===
              categoryText;

          if (!searchText) {
            return categoryMatch;
          }

          const searchableText = [
            product.name,
            product.category,
            product.description,
            product.brand,
            product.subcategory,
            product.searchKeywords,
          ]
            .flatMap((value) =>
              Array.isArray(value)
                ? value
                : [value]
            )
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            categoryMatch &&
            searchableText.includes(
              searchText
            )
          );
        }
      );
    }, [
      products,
      selectedCategory,
      search,
    ]);

  if (loading) {
    return (
      <section className="px-3 py-6 sm:px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-4xl">
                ⏳
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-500">
                Products loading...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-3 py-6 sm:px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            ⚠️
          </div>
          <p className="mt-4 font-bold text-red-500">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetryKey((key) => key + 1);
            }}
            className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <section className="px-3 py-6 sm:px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="text-6xl">
            🔍
          </div>
          <h2 className="mt-4 text-xl font-black">
            No Products Found
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try another product name or category.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-2.5 py-5 sm:px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <h2 className="text-lg font-black text-zinc-900 sm:text-2xl">
              {search
                ? "Search Results"
                : selectedCategory
                  ? selectedCategory
                  : "Popular Products"}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-500 sm:text-xs">
              {filteredProducts.length} products
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map(
            (product) => {
              const price =
                Number(
                  product.price || 0
                );

              const mrp =
                Number(
                  product.mrp || 0
                );

              const stock =
                Number(
                  product.stock || 0
                );

              const variantKey =
                product.variantId ||
                "default";

              const quantity =
                getItemQuantity(
                  product.id,
                  product.variantId
                );

              const discount =
                mrp > price && mrp > 0
                  ? Math.round(
                      ((mrp - price) /
                        mrp) *
                        100
                    )
                  : 0;

              const liked =
                wishlist.includes(
                  product.id
                );

              const image =
                product.image ||
                product.images?.[0] ||
                "/no-image.png";

              return (
                <article
                  key={product.id}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl"
                >
                  <div className="relative">
                    <Link
                      href={`/product/${product.id}`}
                      className="block"
                    >
                      <div className="flex aspect-square w-full items-center justify-center bg-zinc-50 p-2.5 sm:p-3">
                        <img
                          src={image}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>

                    {discount > 0 && (
                      <div className="absolute left-1.5 top-1.5 z-10 rounded-md bg-green-600 px-1.5 py-0.5 text-[8px] font-black text-white sm:left-2 sm:top-2 sm:text-[10px]">
                        {discount}% OFF
                      </div>
                    )}

                    <button
                      type="button"
                      aria-label={
                        liked
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      onClick={() =>
                        toggleWishlist(
                          product.id
                        )
                      }
                      className={`absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-base shadow-sm sm:right-2 sm:top-2 sm:h-8 sm:w-8 sm:text-lg ${
                        liked
                          ? "text-red-500"
                          : "text-zinc-500"
                      }`}
                    >
                      {liked
                        ? "♥"
                        : "♡"}
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-2 sm:p-3">
                    {product.category && (
                      <p className="truncate text-[8px] font-bold uppercase tracking-wide text-zinc-400 sm:text-[10px]">
                        {product.category}
                      </p>
                    )}

                    <Link
                      href={`/product/${product.id}`}
                    >
                      <h3 className="mt-0.5 line-clamp-2 min-h-[32px] text-[12px] font-black leading-4 text-zinc-900 sm:mt-1 sm:min-h-[38px] sm:text-sm sm:leading-5">
                        {product.name ||
                          "Product"}
                      </h3>
                    </Link>

                    {(product.pack ||
                      product.weight ||
                      product.volume ||
                      product.size) && (
                      <p className="mt-0.5 truncate text-[9px] font-medium text-zinc-500 sm:mt-1 sm:text-[11px]">
                        {product.pack ||
                          product.weight ||
                          product.volume ||
                          product.size}
                      </p>
                    )}

                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5 sm:mt-2 sm:gap-2">
                      <span className="truncate text-base font-black text-zinc-900 sm:text-lg">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <span className="truncate text-[9px] text-zinc-400 line-through sm:text-[11px]">
                          ₹{mrp}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 sm:mt-3">
                      {quantity <= 0 ? (
                        <button
                          type="button"
                          disabled={stock === 0}
                          onClick={() =>
                            addToCart({
                              ...product,
                              quantity: 1,
                              variantId:
                                variantKey,
                            })
                          }
                          className="flex h-9 w-full items-center justify-center rounded-lg bg-yellow-400 text-xs font-black text-black transition hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 sm:h-10 sm:text-sm"
                        >
                          {stock === 0
                            ? "OUT OF STOCK"
                            : "+ ADD"}
                        </button>
                      ) : (
                        <div className="flex h-9 items-center overflow-hidden rounded-lg bg-yellow-400 sm:h-10">
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                product.id,
                                variantKey
                              )
                            }
                            className="h-full w-9 bg-black text-base font-black text-white sm:w-10 sm:text-lg"
                          >
                            −
                          </button>

                          <span className="flex-1 text-center text-xs font-black sm:text-sm">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            disabled={
                              stock > 0 &&
                              quantity >=
                                stock
                            }
                            onClick={() =>
                              addToCart({
                                ...product,
                                quantity: 1,
                                variantId:
                                  variantKey,
                              })
                            }
                            className="h-full w-9 bg-black text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-10 sm:text-lg"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {quantity > 0 && (
                      <Link
                        href="/cart"
                        className="mt-1.5 block text-center text-[9px] font-black text-green-600 sm:mt-2 sm:text-[11px]"
                      >
                        View Cart →
                      </Link>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}