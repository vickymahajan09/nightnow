"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartAddedPopup() {
  const {
    cartPopupVisible,
    cartPopupItem,
    cartCount,
    cartTotal,
    hideCartPopup,
  } = useCart();

  if (
    !cartPopupVisible ||
    !cartPopupItem ||
    cartCount <= 0
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-x-0
        bottom-[76px]
        z-[10001]
        px-3
        pb-2
        md:bottom-4
        md:right-5
        md:left-auto
        md:w-[390px]
        md:px-0
        md:pb-0
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[58px]
          max-w-md
          items-center
          gap-2.5
          rounded-2xl
          border
          border-zinc-200
          bg-white
          px-2.5
          shadow-[0_6px_28px_rgba(0,0,0,0.20)]
        "
      >

        {/* CART ICON */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-yellow-400
            text-lg
          "
        >
          🛒
        </div>

        {/* CART INFO */}

        <div className="min-w-0 flex-1">

          <p
            className="
              text-[11px]
              font-black
              leading-tight
              text-zinc-900
            "
          >
            {cartCount}{" "}
            {cartCount === 1
              ? "item"
              : "items"}{" "}
            in cart
          </p>

          <p
            className="
              mt-0.5
              text-[10px]
              font-bold
              text-zinc-500
            "
          >
            ₹{Math.round(cartTotal)}
          </p>

        </div>

        {/* VIEW CART */}

        <Link
          href="/cart"
          onClick={hideCartPopup}
          className="
            flex
            h-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-yellow-400
            px-4
            text-[11px]
            font-black
            text-black
            transition
            active:scale-95
          "
        >
          View Cart →
        </Link>

        {/* CLOSE */}

        <button
          type="button"
          onClick={hideCartPopup}
          aria-label="Close"
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-full
            text-sm
            font-black
            text-zinc-400
            hover:bg-zinc-100
          "
        >
          ×
        </button>

      </div>
    </div>
  );
}