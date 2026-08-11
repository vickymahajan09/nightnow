"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    cartTotal,
  } = useCart();

  const delivery =
    cartTotal >= 299 ? 0 : 30;

  const grandTotal =
    cartTotal + delivery;

  if (!cart || cart.length === 0) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 text-black">
        <div className="mx-auto max-w-md text-center">
          <div className="text-7xl">🛒</div>

          <h1 className="mt-6 text-3xl font-black">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-zinc-500">
            Add products to continue shopping.
          </p>

          <Link href="/">
            <button className="mt-8 rounded-xl bg-yellow-400 px-8 py-4 font-black hover:bg-yellow-300">
              Start Shopping →
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-28 text-black">
      <div className="mx-auto max-w-6xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Continue Shopping
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-black">
            My Cart
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {cart.length} product
            {cart.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">

          <div className="space-y-3">

            {cart.map((item: any) => {
              const quantity =
                Number(item.quantity || 1);

              const price =
                Number(item.price || 0);

              const stock =
                Number(item.stock || 0);

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <Link
                    href={`/product/${item.id}`}
                    className="shrink-0"
                  >
                    <img
                      src={
                        item.image ||
                        "/no-image.png"
                      }
                      alt={item.name}
                      className="h-24 w-24 rounded-xl bg-zinc-100 object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">

                    <Link
                      href={`/product/${item.id}`}
                    >
                      <h2 className="line-clamp-2 text-sm font-black">
                        {item.name}
                      </h2>
                    </Link>

                    <p className="mt-1 text-lg font-black">
                      ₹{price}
                    </p>

                    <p className="text-xs text-zinc-400">
                      {item.pack ||
                        item.quantityLabel ||
                        "1 pack"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">

                      <div className="flex h-9 items-center overflow-hidden rounded-lg bg-yellow-400">

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                          className="h-full w-9 bg-black font-black text-white"
                        >
                          −
                        </button>

                        <span className="w-10 text-center text-sm font-black">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            quantity >= stock
                          }
                          onClick={() =>
                            addToCart({
                              ...item,
                              quantity: 1,
                            })
                          }
                          className="h-full w-9 bg-black font-black text-white disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteFromCart(item.id)
                        }
                        className="text-xs font-bold text-red-500"
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>

          <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

            <h2 className="text-xl font-black">
              Bill Details
            </h2>

            <div className="mt-5 space-y-4 text-sm">

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Subtotal
                </span>
                <span className="font-bold">
                  ₹{cartTotal}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Delivery
                </span>

                <span
                  className={
                    delivery === 0
                      ? "font-bold text-green-600"
                      : "font-bold"
                  }
                >
                  {delivery === 0
                    ? "FREE"
                    : `₹${delivery}`}
                </span>
              </div>

              {cartTotal > 0 &&
                cartTotal < 299 && (
                  <div className="rounded-xl bg-yellow-50 p-3 text-xs font-semibold text-yellow-700">
                    Add ₹{299 - cartTotal} more
                    for FREE delivery.
                  </div>
                )}

              <div className="border-t border-zinc-200 pt-4">

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-green-600">
                    ₹{grandTotal}
                  </span>
                </div>

              </div>

            </div>

            <Link href="/checkout">
              <button className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black hover:bg-yellow-300">
                Proceed to Checkout →
              </button>
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}