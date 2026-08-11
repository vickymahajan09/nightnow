"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartPopup() {
  const {
    cart,
    cartCount,
    cartTotal,
  } = useCart();

  if (
    !cart ||
    cart.length === 0
  ) {
    return null;
  }

  const delivery =
    cartTotal >= 299
      ? 0
      : 30;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-[9999] px-3 sm:px-4">

      <div className="mx-auto max-w-xl">

        <Link href="/cart">

          <div className="flex items-center gap-3 rounded-2xl bg-yellow-400 p-3 text-black shadow-[0_8px_35px_rgba(0,0,0,0.35)] transition hover:bg-yellow-300">

            {/* ICON */}

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-2xl">
              🛒
            </div>

            {/* DETAILS */}

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold">
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}{" "}
                in cart
              </p>

              <div className="flex items-center gap-2">

                <p className="text-lg font-black">
                  ₹{cartTotal}
                </p>

                {delivery === 0 && (
                  <span className="text-xs font-black text-green-700">
                    FREE DELIVERY
                  </span>
                )}

              </div>

            </div>

            {/* BUTTON */}

            <div className="shrink-0 rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
              View Cart →
            </div>

          </div>

        </Link>

      </div>

    </div>
  );
}