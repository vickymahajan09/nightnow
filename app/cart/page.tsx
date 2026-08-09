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

  const delivery = cartTotal >= 299 || cartTotal === 0 ? 0 : 30;
  const grandTotal = cartTotal + delivery;

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="text-7xl">🛒</div>

          <h1 className="mt-6 text-3xl font-black">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-zinc-400">
            Add some products to continue shopping.
          </p>

          <Link href="/">
            <button className="mt-8 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black hover:bg-yellow-500">
              Start Shopping
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">
              My Cart
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Review your items before checkout
            </p>
          </div>

          <span className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            {cart.length} Items
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* CART ITEMS */}

          <div className="space-y-4">

            {cart.map((item: any) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >

                <Link href={`/product/${item.id}`}>
                  <img
                    src={item.image || "/no-image.png"}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">

                  <Link href={`/product/${item.id}`}>
                    <h2 className="line-clamp-2 font-bold hover:text-yellow-400">
                      {item.name}
                    </h2>
                  </Link>

                  <p className="mt-2 text-lg font-bold text-yellow-400">
                    ₹{item.price}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    ₹{item.price} × {item.quantity}
                  </p>

                  <div className="mt-3 flex items-center gap-3">

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="h-9 w-9 rounded-lg bg-zinc-800 font-bold hover:bg-red-500"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        addToCart({
                          ...item,
                          quantity: 1,
                        })
                      }
                      className="h-9 w-9 rounded-lg bg-zinc-800 font-bold hover:bg-green-600"
                    >
                      +
                    </button>

                  </div>

                </div>

                <button
                  onClick={() => deleteFromCart(item.id)}
                  className="self-start rounded-lg px-2 py-1 text-xl text-red-500 hover:bg-red-500/10"
                >
                  🗑️
                </button>

              </div>
            ))}

          </div>

          {/* ORDER SUMMARY */}

          <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

            <h2 className="text-xl font-bold">
              Order Summary
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Items
                </span>

                <span>
                  {cart.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Subtotal
                </span>

                <span>
                  ₹{cartTotal}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Delivery
                </span>

                <span className={delivery === 0 ? "text-green-400" : ""}>
                  {delivery === 0 ? "FREE" : `₹${delivery}`}
                </span>
              </div>

              {cartTotal > 0 && cartTotal < 299 && (
                <div className="rounded-lg bg-yellow-400/10 p-3 text-sm text-yellow-400">
                  Add ₹{299 - cartTotal} more for FREE delivery.
                </div>
              )}

              <div className="border-t border-zinc-700 pt-4">

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>

                  <span className="text-yellow-400">
                    ₹{grandTotal}
                  </span>
                </div>

              </div>

            </div>

            <Link href="/checkout">
              <button className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black text-black hover:bg-yellow-500">
                Proceed to Checkout
              </button>
            </Link>

            <Link href="/">
              <button className="mt-3 w-full rounded-xl bg-zinc-800 py-3 font-bold hover:bg-zinc-700">
                Continue Shopping
              </button>
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}