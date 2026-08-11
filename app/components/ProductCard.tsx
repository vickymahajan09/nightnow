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

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          "Product loading failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const getCartQuantity = (id: string) => {
    const item = cart.find(
      (cartItem: any) =>
        cartItem.id === id
    );

    return Number(
      item?.quantity || 0
    );
  };

  const filteredProducts = products.filter(
    (item: any) => {
      const categoryMatch =
        !selectedCategory ||
        item.category === selectedCategory;

      const searchText =
        search.trim().toLowerCase();

      const searchMatch =
        !searchText ||
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
    }
  );

  if (loading) {
    return (
      <section
        id="products"
        className="bg-white px-4 py-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-5">
            <div className="h-7 w-44 animate-pulse rounded bg-zinc-200" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-2xl bg-zinc-100"
                />
              )
            )}
          </div>

        </div>
      </section>
    );
  }

  return (
    <section
      id="products"
      className="bg-white px-4 py-8 text-black"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-5 flex items-end justify-between">

          <div>
            <p className="text-xs font-bold uppercase text-yellow-600">
              Night Now
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {search
                ? "Search Results"
                : selectedCategory
                ? selectedCategory
                : "Popular Products"}
            </h2>
          </div>

          <span className="text-xs font-semibold text-zinc-500">
            {filteredProducts.length} products
          </span>

        </div>

        {/* PRODUCT GRID */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

          {filteredProducts.map(
            (item: any) => {
              const stock = Number(
                item.stock || 0
              );

              const quantity =
                getCartQuantity(item.id);

              const mrp = Number(
                item.mrp || item.price || 0
              );

              const price = Number(
                item.price || 0
              );

              const discount =
                mrp > price
                  ? Math.round(
                      ((mrp - price) /
                        mrp) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* IMAGE */}

                  <Link
                    href={`/product/${item.id}`}
                    className="block"
                  >
                    <div className="relative bg-zinc-50">

                      {discount > 0 && (
                        <span className="absolute left-2 top-2 z-10 rounded-md bg-green-600 px-2 py-1 text-[10px] font-black text-white">
                          {discount}% OFF
                        </span>
                      )}

                      <img
                        src={
                          item.image ||
                          "/no-image.png"
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-44"
                      />

                    </div>
                  </Link>

                  {/* DETAILS */}

                  <div className="p-3">

                    <p className="mb-1 text-[10px] font-semibold uppercase text-zinc-400">
                      {item.category ||
                        "Daily Essential"}
                    </p>

                    <Link
                      href={`/product/${item.id}`}
                    >
                      <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 hover:text-yellow-600">
                        {item.name}
                      </h3>
                    </Link>

                    <p className="mt-1 text-xs text-zinc-500">
                      {item.pack ||
                        item.quantityLabel ||
                        "1 pack"}
                    </p>

                    {/* PRICE */}

                    <div className="mt-2 flex items-center gap-2">

                      <span className="text-lg font-black">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{mrp}
                        </span>
                      )}

                    </div>

                    {/* BUTTON */}

                    {stock <= 0 ? (
                      <button
                        disabled
                        className="mt-3 w-full rounded-xl bg-zinc-200 py-2.5 text-xs font-black text-zinc-500"
                      >
                        OUT OF STOCK
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
                        className="mt-3 w-full rounded-xl border-2 border-yellow-400 bg-yellow-400 py-2.5 text-sm font-black text-black transition hover:bg-yellow-300"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="mt-3 flex h-10 items-center justify-between overflow-hidden rounded-xl bg-yellow-400">

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="flex h-full w-10 items-center justify-center bg-black text-lg font-black text-white"
                        >
                          −
                        </button>

                        <span className="font-black">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            quantity >=
                            stock
                          }
                          onClick={() =>
                            addToCart({
                              ...item,
                              quantity: 1,
                            })
                          }
                          className="flex h-full w-10 items-center justify-center bg-black text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
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

        {/* EMPTY */}

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">

            <div className="text-6xl">
              🔍
            </div>

            <h3 className="mt-4 text-xl font-black">
              No Products Found
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Try another product name or category.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}