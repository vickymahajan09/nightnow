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


// =====================================================
// TYPE
// =====================================================

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


// =====================================================
// COMPONENT
// =====================================================

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


  // ===================================================
  // LOAD PRODUCTS
  // ===================================================

  useEffect(() => {

    const loadProducts =
      async () => {

        try {

          setLoading(true);
          setError("");

          const snapshot =
            await getDocs(
              collection(
                db,
                "products"
              )
            );


          const data =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            ) as Product[];


          setProducts(data);

        } catch (err) {

          console.error(
            "Product loading error:",
            err
          );

          setError(
            "Products load nahi ho pa rahe."
          );

        } finally {

          setLoading(false);

        }

      };


    loadProducts();

  }, []);


  // ===================================================
  // LOAD WISHLIST
  // ===================================================

  useEffect(() => {

    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            "nightnow_wishlist"
          ) || "[]"
        );


      if (
        Array.isArray(saved)
      ) {
        setWishlist(saved);
      }

    } catch (err) {

      console.error(
        "Wishlist loading error:",
        err
      );

    }

  }, []);


  // ===================================================
  // TOGGLE LIKE
  // ===================================================

  const toggleWishlist = (
    productId: string
  ) => {

    setWishlist(
      (current) => {

        const updated =
          current.includes(
            productId
          )
            ? current.filter(
                (id) =>
                  id !== productId
              )
            : [
                ...current,
                productId,
              ];


        try {

          localStorage.setItem(
            "nightnow_wishlist",
            JSON.stringify(
              updated
            )
          );

        } catch (err) {

          console.error(
            "Wishlist save error:",
            err
          );

        }


        return updated;

      }
    );

  };


  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      const categoryText =
        selectedCategory
          .trim()
          .toLowerCase();


      return products.filter(
        (product) => {

          // -------------------------------------------
          // CATEGORY
          // -------------------------------------------

          const productCategory =
            String(
              product.category ||
                ""
            ).toLowerCase();


          const categoryMatch =
            !categoryText ||
            categoryText === "all" ||
            productCategory ===
              categoryText;


          // -------------------------------------------
          // SEARCH
          // -------------------------------------------

          if (!searchText) {
            return categoryMatch;
          }


          const searchableText =
            [
              product.name,
              product.category,
              product.description,
              product.brand,
              product.subcategory,
              product.searchKeywords,
            ]
              .flatMap((value) => {

                if (
                  Array.isArray(
                    value
                  )
                ) {
                  return value;
                }

                return [value];

              })
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


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <section className="px-4 py-8">

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


  // ===================================================
  // ERROR
  // ===================================================

  if (error) {

    return (
      <section className="px-4 py-8">

        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">
            ⚠️
          </div>

          <p className="mt-4 font-bold text-red-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black"
          >
            Try Again
          </button>

        </div>

      </section>
    );

  }


  // ===================================================
  // NO PRODUCTS
  // ===================================================

  if (
    filteredProducts.length === 0
  ) {

    return (
      <section className="px-4 py-8">

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


  // ===================================================
  // MAIN
  // ===================================================

  return (
    <section className="px-3 py-6 sm:px-4">

      <div className="mx-auto max-w-7xl">

        {/* ============================================
            HEADING
        ============================================= */}

        <div className="mb-4 flex items-end justify-between">

          <div>

            <h2 className="text-xl font-black text-zinc-900 sm:text-2xl">
              {search
                ? "Search Results"
                : selectedCategory
                  ? selectedCategory
                  : "Popular Products"}
            </h2>

            <p className="mt-1 text-xs font-medium text-zinc-500">
              {filteredProducts.length} products
            </p>

          </div>

        </div>


        {/* ============================================
            PRODUCT GRID
        ============================================= */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

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


              const quantity =
                getItemQuantity(
                  product.id,
                  product.variantId
                );


              const discount =
                mrp > price &&
                mrp > 0
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
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  {/* =================================
                      LIKE
                  ================================== */}

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
                    className={`absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg shadow-sm ${
                      liked
                        ? "text-red-500"
                        : "text-zinc-500"
                    }`}
                  >
                    {liked
                      ? "♥"
                      : "♡"}
                  </button>


                  {/* =================================
                      DISCOUNT
                  ================================== */}

                  {discount > 0 && (

                    <div className="absolute left-2 top-2 z-10 rounded-md bg-green-600 px-2 py-1 text-[10px] font-black text-white">
                      {discount}% OFF
                    </div>

                  )}


                  {/* =================================
                      PRODUCT IMAGE
                  ================================== */}

                  <Link
                    href={`/product/${product.id}`}
                    className="block"
                  >

                    <div className="flex h-40 items-center justify-center bg-zinc-50 p-3 sm:h-44">

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


                  {/* =================================
                      PRODUCT INFO
                  ================================== */}

                  <div className="p-3">

                    {/* CATEGORY */}

                    {product.category && (

                      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        {product.category}
                      </p>

                    )}


                    {/* NAME */}

                    <Link
                      href={`/product/${product.id}`}
                    >

                      <h3 className="mt-1 line-clamp-2 min-h-[38px] text-sm font-black leading-5 text-zinc-900">
                        {product.name ||
                          "Product"}
                      </h3>

                    </Link>


                    {/* VARIANT / PACK */}

                    {(product.pack ||
                      product.weight ||
                      product.volume ||
                      product.size) && (

                      <p className="mt-1 truncate text-[11px] font-medium text-zinc-500">

                        {product.pack ||
                          product.weight ||
                          product.volume ||
                          product.size}

                      </p>

                    )}


                    {/* PRICE */}

                    <div className="mt-2 flex items-center gap-2">

                      <span className="text-lg font-black text-zinc-900">
                        ₹{price}
                      </span>

                      {mrp > price && (

                        <span className="text-[11px] text-zinc-400 line-through">
                          ₹{mrp}
                        </span>

                      )}

                    </div>


                    {/* =================================
                        ADD / QUANTITY
                    ================================== */}

                    <div className="mt-3">

                      {quantity <= 0 ? (

                        <button
                          type="button"
                          disabled={
                            stock === 0
                          }
                          onClick={() =>
                            addToCart({
                              ...product,
                              quantity: 1,
                              variantId:
                                product.variantId ||
                                "default",
                            })
                          }
                          className="w-full rounded-lg bg-yellow-400 py-2.5 text-sm font-black text-black transition hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
                        >
                          {stock === 0
                            ? "OUT OF STOCK"
                            : "ADD"}
                        </button>

                      ) : (

                        <div className="flex h-10 items-center overflow-hidden rounded-lg bg-yellow-400">

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                product.id,
                                product.variantId ||
                                  "default"
                              )
                            }
                            className="h-full w-10 bg-black text-lg font-black text-white"
                          >
                            −
                          </button>


                          <span className="flex-1 text-center text-sm font-black">
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
                                  product.variantId ||
                                  "default",
                              })
                            }
                            className="h-full w-10 bg-black text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>

                        </div>

                      )}

                    </div>


                    {/* =================================
                        VIEW CART
                    ================================== */}

                    {quantity > 0 && (

                      <Link
                        href="/cart"
                        className="mt-2 block text-center text-[11px] font-black text-green-600"
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