"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProducts } from "../services/productService";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
  selectedCategory?: string;
  search?: string;
}

export default function ProductCard({
  selectedCategory = "",
  search = "",
}: ProductCardProps) {
  const {
    cart,
    addToCart,
    removeFromCart,
  } = useCart();

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(
        data.filter(
          (item: any) =>
            item.active !== false
        )
      );
    } catch (error) {
      console.error(
        "Products loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FILTER PRODUCTS
  // ==============================

  const filteredProducts =
    products.filter((item: any) => {
      const categoryMatch =
        selectedCategory === "" ||
        item.category ===
          selectedCategory;

      const searchText =
        search.trim().toLowerCase();

      const searchMatch =
        searchText === "" ||
        item.name
          ?.toLowerCase()
          .includes(searchText) ||
        item.description
          ?.toLowerCase()
          .includes(searchText);

      return (
        categoryMatch &&
        searchMatch
      );
    });

  // ==============================
  // CART QUANTITY
  // ==============================

  const getCartQuantity = (
    id: string
  ) => {
    const item = cart.find(
      (cartItem: any) =>
        cartItem.id === id
    );

    return Number(
      item?.quantity || 0
    );
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <section
        id="products"
        className="px-4 py-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-5 h-7 w-48 animate-pulse rounded bg-zinc-800" />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-xl bg-zinc-900"
                />
              )
            )}

          </div>
        </div>
      </section>
    );
  }

  // ==============================
  // PRODUCT LIST
  // ==============================

  return (
    <section
      id="products"
      className="bg-white px-4 py-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-5 flex items-center justify-between">

          <div>
            <p className="text-[10px] font-bold uppercase text-yellow-500">
              Night Now
            </p>

            <h2 className="text-2xl font-black text-zinc-900">
              {search
                ? "Search Results"
                : "Popular Products"}
            </h2>
          </div>

          <span className="text-sm text-zinc-500">
            {filteredProducts.length} Products
          </span>

        </div>

        {/* PRODUCTS */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

          {filteredProducts.map(
            (item: any) => {

              const stock =
                Number(
                  item.stock || 0
                );

              const quantity =
                getCartQuantity(
                  item.id
                );

              // ==========================
              // PRICE / DISCOUNT
              // ==========================

              const price =
                Number(
                  item.price || 0
                );

              const mrp =
                Number(
                  item.mrp || price
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

              // ==========================
              // PRODUCT IMAGE
              // ==========================

              const productImage =
                item.image ||
                (Array.isArray(
                  item.images
                )
                  ? item.images[0]
                  : null) ||
                "/no-image.png";

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >

                  {/* ====================== */}
                  {/* IMAGE */}
                  {/* ====================== */}

                  <Link
                    href={`/product/${item.id}`}
                  >
                    <div className="relative flex h-[150px] items-center justify-center bg-zinc-50 p-2">

                      {/* DISCOUNT BADGE */}

                      {discount > 0 && (
                        <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-blue-500 px-2 py-1 text-[10px] font-black text-white">
                          {discount}% OFF
                        </div>
                      )}

                      {/* IMAGE */}

                      <img
                        src={
                          productImage
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-full w-full object-contain transition duration-300 hover:scale-105"
                      />

                    </div>
                  </Link>

                  {/* ====================== */}
                  {/* PRODUCT INFO */}
                  {/* ====================== */}

                  <div className="p-3">

                    <Link
                      href={`/product/${item.id}`}
                    >
                      <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-zinc-900 hover:text-yellow-600">
                        {item.name}
                      </h3>
                    </Link>

                    {/* UNIT */}

                    {(item.unit ||
                      item.weight ||
                      item.packSize) && (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {item.unit ||
                          item.weight ||
                          item.packSize}
                      </p>
                    )}

                    {/* PRICE */}

                    <div className="mt-2 flex items-center gap-2">

                      <span className="text-lg font-black text-zinc-900">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{mrp}
                        </span>
                      )}

                    </div>

                    {/* STOCK */}

                    {stock > 0 &&
                      stock <= 5 && (
                        <p className="mt-1 text-[10px] font-bold text-red-500">
                          Only {stock} left
                        </p>
                      )}

                    {/* ================== */}
                    {/* CART BUTTON */}
                    {/* ================== */}

                    {stock <= 0 ? (

                      <button
                        disabled
                        className="mt-3 w-full rounded-lg bg-zinc-200 py-2 text-sm font-bold text-zinc-500"
                      >
                        Out of Stock
                      </button>

                    ) : quantity === 0 ? (

                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            ...item,
                            quantity: 1,
                          })
                        }
                        className="mt-3 w-full rounded-lg border-2 border-yellow-400 bg-yellow-400 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
                      >
                        ADD
                      </button>

                    ) : (

                      <div className="mt-3 flex h-10 items-center justify-between rounded-lg bg-yellow-400 p-1">

                        {/* MINUS */}

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="flex h-8 w-9 items-center justify-center rounded-md bg-black text-lg font-black text-white"
                        >
                          −
                        </button>

                        {/* QUANTITY */}

                        <span className="text-sm font-black text-black">
                          {quantity}
                        </span>

                        {/* PLUS */}

                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              ...item,
                              quantity: 1,
                            })
                          }
                          disabled={
                            quantity >=
                            stock
                          }
                          className="flex h-8 w-9 items-center justify-center rounded-md bg-black text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>

                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

        {/* NO PRODUCTS */}

        {filteredProducts.length ===
          0 && (
          <div className="py-16 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <p className="mt-4 text-xl font-black text-zinc-900">
              No Products Found
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Try another product name.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}