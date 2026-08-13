"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  unit?: string;
};

type CartItem = Product & {
  quantity: number;
};

type Props = {
  products?: Product[];
  onViewCart?: () => void;
};

const defaultProducts: Product[] = [
  {
    id: "milk",
    name: "Milk",
    price: 60,
    unit: "1 L",
  },
  {
    id: "bread",
    name: "Bread",
    price: 40,
    unit: "1 Pack",
  },
  {
    id: "eggs",
    name: "Eggs",
    price: 70,
    unit: "6 Pcs",
  },
  {
    id: "butter",
    name: "Butter",
    price: 55,
    unit: "100 g",
  },
];

export default function AapkiZarurat({
  products = defaultProducts,
  onViewCart,
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // ==========================================
  // LOAD CART
  // ==========================================

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(
        "nightnow-cart"
      );

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Cart loading failed:", error);
    }
  }, []);

  // ==========================================
  // SAVE CART
  // ==========================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "nightnow-cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Cart saving failed:", error);
    }
  }, [cart]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // ==========================================
  // INCREASE
  // ==========================================

  const increaseQuantity = (id: string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // DECREASE
  // ==========================================

  const decreaseQuantity = (id: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==========================================
  // REMOVE
  // ==========================================

  const removeFromCart = (id: string) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    );
  };

  // ==========================================
  // CART TOTAL
  // ==========================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  // ==========================================
  // GET PRODUCT QUANTITY
  // ==========================================

  const getQuantity = (id: string) => {
    return (
      cart.find((item) => item.id === id)
        ?.quantity || 0
    );
  };

  return (
    <>
      {/* ======================================
          AAPKI ZARURAT
      ======================================= */}

      <section className="mt-8">

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">
              Aapki Zarurat
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Frequently bought products
            </p>
          </div>

          {/* CART BUTTON */}

          <button
            onClick={() =>
              setCartOpen(true)
            }
            className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400 px-4 py-2.5 font-bold text-black shadow-lg transition hover:bg-yellow-300 active:scale-95"
          >
            🛒

            <span>
              Cart
            </span>

            {cartCount > 0 && (
              <span className="rounded-full bg-black px-2 py-0.5 text-xs font-black text-yellow-400">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* PRODUCT SUGGESTIONS */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

          {products.map((product) => {
            const quantity =
              getQuantity(product.id);

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-md"
              >

                {/* IMAGE */}

                <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-4xl">
                      🛍️
                    </span>
                  )}

                </div>

                {/* PRODUCT */}

                <div className="mt-3">

                  <h3 className="font-bold text-white">
                    {product.name}
                  </h3>

                  {product.unit && (
                    <p className="text-xs text-zinc-500">
                      {product.unit}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-2">

                    <span className="font-black text-yellow-400">
                      ₹{product.price}
                    </span>

                    {quantity === 0 ? (
                      <button
                        onClick={() =>
                          addToCart(product)
                        }
                        className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-black text-black transition hover:bg-yellow-300 active:scale-95"
                      >
                        + Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800 p-1">

                        <button
                          onClick={() =>
                            decreaseQuantity(
                              product.id
                            )
                          }
                          className="h-7 w-7 rounded-md bg-zinc-700 font-black text-white"
                        >
                          −
                        </button>

                        <span className="min-w-[20px] text-center text-sm font-bold">
                          {quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(
                              product.id
                            )
                          }
                          className="h-7 w-7 rounded-md bg-yellow-400 font-black text-black"
                        >
                          +
                        </button>

                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* ======================================
          STICKY CART BAR
      ======================================= */}

      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg">

          <button
            onClick={() =>
              setCartOpen(true)
            }
            className="flex w-full items-center justify-between rounded-2xl bg-yellow-400 px-5 py-4 text-black shadow-2xl transition active:scale-[0.98]"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-yellow-400">
                🛒
              </div>

              <div className="text-left">

                <p className="text-sm font-bold">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "Item"
                    : "Items"}
                </p>

                <p className="text-xs font-semibold opacity-70">
                  Tap to view cart
                </p>

              </div>

            </div>

            <div className="text-right">

              <p className="font-black">
                ₹{cartTotal}
              </p>

              <p className="text-xs font-bold">
                View Cart →
              </p>

            </div>

          </button>

        </div>
      )}

      {/* ======================================
          CART OVERLAY
      ======================================= */}

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() =>
            setCartOpen(false)
          }
        >

          {/* CART PANEL */}

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-zinc-700 bg-zinc-950 p-5 shadow-2xl sm:bottom-5 sm:left-1/2 sm:right-auto sm:w-[450px] sm:-translate-x-1/2 sm:rounded-3xl sm:border"
          >

            {/* HEADER */}

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-black text-white">
                  Your Cart
                </h2>

                <p className="text-sm text-zinc-400">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                onClick={() =>
                  setCartOpen(false)
                }
                className="h-10 w-10 rounded-full bg-zinc-800 text-xl text-white"
              >
                ×
              </button>

            </div>

            {/* EMPTY CART */}

            {cart.length === 0 ? (
              <div className="py-12 text-center">

                <div className="text-6xl">
                  🛒
                </div>

                <h3 className="mt-4 text-xl font-bold text-white">
                  Your cart is empty
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Add products to continue.
                </p>

              </div>
            ) : (
              <>
                {/* CART ITEMS */}

                <div className="mt-5 space-y-3">

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-zinc-900 p-3"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate font-bold text-white">
                            {item.name}
                          </p>

                          <p className="text-sm text-yellow-400">
                            ₹{item.price}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="text-xs font-bold text-red-400"
                        >
                          Remove
                        </button>

                      </div>

                      <div className="mt-3 flex items-center justify-between">

                        <div className="flex items-center gap-3 rounded-lg bg-zinc-800 p-1">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                            className="h-8 w-8 rounded-md bg-zinc-700 font-black text-white"
                          >
                            −
                          </button>

                          <span className="w-6 text-center font-bold text-white">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            className="h-8 w-8 rounded-md bg-yellow-400 font-black text-black"
                          >
                            +
                          </button>

                        </div>

                        <p className="font-black text-white">
                          ₹
                          {item.price *
                            item.quantity}
                        </p>

                      </div>

                    </div>
                  ))}

                </div>

                {/* SUGGESTIONS */}

                <div className="mt-6">

                  <h3 className="font-bold text-white">
                    You may also need
                  </h3>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">

                    {products
                      .filter(
                        (product) =>
                          !cart.some(
                            (item) =>
                              item.id ===
                              product.id
                          )
                      )
                      .slice(0, 4)
                      .map((product) => (
                        <button
                          key={product.id}
                          onClick={() =>
                            addToCart(
                              product
                            )
                          }
                          className="min-w-[130px] rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left"
                        >

                          <p className="truncate text-sm font-bold text-white">
                            {product.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-yellow-400">
                            ₹{product.price}
                          </p>

                          <span className="mt-2 inline-block rounded-lg bg-yellow-400 px-2 py-1 text-xs font-black text-black">
                            + Add
                          </span>

                        </button>
                      ))}

                  </div>

                </div>

                {/* TOTAL */}

                <div className="mt-6 border-t border-zinc-800 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-zinc-400">
                      Total
                    </span>

                    <span className="text-2xl font-black text-yellow-400">
                      ₹{cartTotal}
                    </span>

                  </div>

                </div>

                {/* VIEW CART */}

                <button
                  onClick={() => {
                    setCartOpen(false);

                    if (onViewCart) {
                      onViewCart();
                    }
                  }}
                  className="mt-5 w-full rounded-xl bg-yellow-400 py-4 font-black text-black transition hover:bg-yellow-300 active:scale-[0.98]"
                >
                  VIEW CART →
                </button>

              </>
            )}

          </div>

        </div>
      )}
    </>
  );
}