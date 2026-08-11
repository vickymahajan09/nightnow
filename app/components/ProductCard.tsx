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
  const { cart, addToCart, removeFromCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(
        data.filter(
          (item: any) => item.active !== false
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (item: any) => {
      const categoryMatch =
        selectedCategory === "" ||
        item.category === selectedCategory;

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

      return categoryMatch && searchMatch;
    }
  );

  const getCartQuantity = (id: string) => {
    const item = cart.find(
      (cartItem: any) =>
        cartItem.id === id
    );

    return Number(
      item?.quantity || 0
    );
  };

  if (loading) {
    return (
      <section
        id="products"
        className="px-4 py-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl bg-zinc-900"
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
      className="px-4 py-8"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-2xl font-black text-white">
            {search
              ? "Search Results"
              : "Popular Products"}
          </h2>

          <span className="text-sm text-zinc-400">
            {filteredProducts.length} Products
          </span>

        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

          {filteredProducts.map(
            (item: any) => {

              const stock = Number(
                item.stock || 0
              );

              const quantity =
                getCartQuantity(
                  item.id
                );

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl bg-white text-black shadow-lg"
                >

                  <Link
                    href={`/product/${item.id}`}
                  >
                    <img
                      src={
                        item.image ||
                        "/no-image.png"
                      }
                      alt={item.name}
                      className="h-44 w-full object-cover transition hover:scale-105"
                    />
                  </Link>

                  <div className="p-3">

                    <Link
                      href={`/product/${item.id}`}
                    >
                      <h3 className="line-clamp-2 min-h-12 text-sm font-bold hover:text-yellow-600">
                        {item.name}
                      </h3>
                    </Link>

                    <p className="mt-2 text-lg font-black text-green-600">
                      ₹{item.price}
                    </p>

                    {stock <= 0 ? (
                      <button
                        disabled
                        className="mt-3 w-full rounded-lg bg-zinc-300 py-2 font-bold text-zinc-500"
                      >
                        Out of Stock
                      </button>
                    ) : quantity === 0 ? (
                      <button
                        onClick={() =>
                          addToCart({
                            ...item,
                            quantity: 1,
                          })
                        }
                        className="mt-3 w-full rounded-lg bg-yellow-400 py-2 font-bold hover:bg-yellow-500"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-yellow-400 p-1">

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-lg font-black text-white"
                        >
                          −
                        </button>

                        <span className="text-lg font-black">
                          {quantity}
                        </span>

                        <button
                          onClick={() =>
                            addToCart({
                              ...item,
                              quantity: 1,
                            })
                          }
                          disabled={
                            quantity >= stock
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>
                    )}

                    {quantity > 0 && (
                      <p className="mt-2 text-center text-xs font-semibold text-zinc-500">
                        {quantity} item
                        {quantity > 1
                          ? "s"
                          : ""}{" "}
                        added
                      </p>
                    )}

                  </div>

                </div>
              );
            }
          )}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-white">

              <div className="text-5xl">
                🔍
              </div>

              <p className="mt-4 text-xl font-bold">
                No Products Found
              </p>

              <p className="mt-2 text-zinc-400">
                Try another product name.
              </p>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}