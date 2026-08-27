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
    cartCount,
  } = useCart();

  const delivery =
    cartTotal >= 299 ? 0 : 30;

  const grandTotal =
    cartTotal + delivery;

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md text-center">

          <div className="text-7xl">
            🛒
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-zinc-500">
            Add products to continue shopping.
          </p>

          <Link href="/">
            <button className="mt-8 rounded-xl bg-yellow-400 px-8 py-4 font-black">
              Start Shopping →
            </button>
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-20 text-black">

      <div className="mx-auto max-w-6xl">

        {/* CONTINUE SHOPPING */}

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Continue Shopping
        </Link>

        {/* HEADER */}

        <div className="mt-5">

          <h1 className="text-3xl font-black">
            My Cart
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {cartCount} item
            {cartCount !== 1
              ? "s"
              : ""}
          </p>

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ==========================================
              PRODUCTS
          ========================================== */}

          <div className="space-y-3">

            {cart.map(
              (item: any) => {

                const quantity =
                  Number(
                    item.quantity || 1
                  );

                const price =
                  Number(
                    item.price || 0
                  );

                const stock =
                  Number(
                    item.stock || 0
                  );

                const offerId =
                  item.offerId ||
                  undefined;

                const itemKey =
                  `${item.id}-${
                    item.variantId ||
                    "default"
                  }-${
                    offerId ||
                    "normal"
                  }`;

                return (
                  <div
                    key={itemKey}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >

                    {/* =================================
                        OFFER HEADER
                    ================================= */}

                    {item.offerType &&
                      item.offerType !==
                        "NONE" && (
                        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">

                          <div className="flex items-center gap-2">

                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400 text-sm">
                              🎁
                            </div>

                            <div>

                              <p className="text-[9px] font-black uppercase tracking-wide text-orange-600">
                                Offer Applied
                              </p>

                              <p className="text-xs font-black text-zinc-900">
                                {item.offerLabel ||
                                  item.offerDescription ||
                                  (
                                    item.offerType ===
                                    "BUY_1_GET_1"
                                      ? "BUY 1 GET 1"
                                      : item.offerType ===
                                        "BUY_1_GET_2"
                                      ? "BUY 1 GET 2"
                                      : "Special Offer"
                                  )}
                              </p>

                            </div>

                          </div>

                        </div>
                      )}

                    {/* =================================
                        PRODUCT
                    ================================= */}

                    <div className="flex gap-4">

                      <Link
                        href={`/product/${item.id}`}
                        className="shrink-0"
                      >

                        <img
                          src={
                            item.image ||
                            item.images?.[0] ||
                            "/no-image.png"
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          className="h-24 w-24 rounded-xl bg-zinc-100 object-contain"
                        />

                      </Link>

                      <div className="min-w-0 flex-1">

                        <Link
                          href={`/product/${item.id}`}
                        >

                          <h2 className="line-clamp-2 text-sm font-black">
                            {item.name ||
                              "Product"}
                          </h2>

                        </Link>

                        {(item.variantName ||
                          item.size ||
                          item.weight ||
                          item.volume ||
                          item.pack) && (

                          <p className="mt-1 text-xs font-bold text-zinc-500">
                            {item.variantName ||
                              item.size ||
                              item.weight ||
                              item.volume ||
                              item.pack}
                          </p>

                        )}

                        <p className="mt-2 text-lg font-black">
                          ₹{price}
                        </p>

                        {/* FREE QUANTITY */}

                        {Number(
                          item.freeQuantity ||
                            0
                        ) > 0 && (

                          <div className="mt-2 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-700">

                            🎁{" "}
                            {item.freeQuantity} FREE

                          </div>

                        )}

                        {/* TOTAL QUANTITY */}

                        {Number(
                          item.totalQuantity ||
                            0
                        ) >
                          quantity && (

                          <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">

                            Total{" "}
                            {item.totalQuantity}{" "}
                            items

                          </div>

                        )}

                      </div>

                    </div>

                    {/* =================================
                        OFFER SAVING
                    ================================= */}

                    {Number(
                      item.offerSaving ||
                        0
                    ) > 0 && (

                      <div className="mt-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2">

                        <span className="text-xs font-bold text-green-700">
                          🎉 Offer Saving
                        </span>

                        <span className="text-xs font-black text-green-700">
                          ₹
                          {Math.round(
                            Number(
                              item.offerSaving ||
                                0
                            )
                          )}
                        </span>

                      </div>

                    )}

                    {/* =================================
                        QUANTITY + PAID TOTAL
                    ================================= */}

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">

                      <div className="flex h-9 overflow-hidden rounded-lg bg-yellow-400">

                        {/* MINUS */}

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.variantId,
                              item.offerId
                            )
                          }
                          className="w-9 bg-black text-lg font-black text-white"
                        >
                          −
                        </button>

                        {/* QUANTITY */}

                        <span className="flex w-10 items-center justify-center text-sm font-black">
                          {quantity}
                        </span>

                        {/* PLUS */}

                        <button
                          type="button"
                          disabled={
                            stock > 0 &&
                            quantity >=
                              stock
                          }
                          onClick={() =>
                            addToCart({
                              ...item,
                              quantity: 1,
                            })
                          }
                          className="w-9 bg-black text-lg font-black text-white disabled:opacity-40"
                        >
                          +
                        </button>

                      </div>

                      {/* PAID AMOUNT */}

                      <div className="text-right">

                        <p className="text-[10px] font-bold text-zinc-400">
                          Paid
                        </p>

                        <p className="font-black">
                          ₹
                          {price *
                            quantity}
                        </p>

                      </div>

                    </div>

                    {/* RECEIVE QUANTITY */}

                    {Number(
                      item.totalQuantity ||
                        0
                    ) > quantity && (

                      <div className="mt-3 flex justify-between rounded-xl bg-zinc-50 px-3 py-2">

                        <span className="text-[10px] font-bold text-zinc-500">
                          You receive
                        </span>

                        <span className="text-xs font-black text-zinc-900">
                          {item.totalQuantity}{" "}
                          items
                        </span>

                      </div>

                    )}

                    {/* =================================
                        REMOVE
                    ================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        deleteFromCart(
                          item.id,
                          item.variantId,
                          item.offerId
                        )
                      }
                      className="mt-3 text-xs font-bold text-red-500"
                    >
                      Remove
                    </button>

                  </div>
                );
              }
            )}

          </div>

          {/* ==========================================
              BILL
          ========================================== */}

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

              {cartTotal < 299 && (

                <div className="rounded-xl bg-yellow-50 p-3 text-xs font-bold text-yellow-700">

                  Add ₹
                  {299 -
                    cartTotal}{" "}
                  more for FREE delivery.

                </div>

              )}

              <div className="border-t border-zinc-200 pt-4">

                <div className="flex justify-between text-xl font-black">

                  <span>
                    Total
                  </span>

                  <span className="text-green-600">
                    ₹{grandTotal}
                  </span>

                </div>

              </div>

            </div>

            <Link
              href="/checkout"
              className="mt-6 block"
            >

              <button className="w-full rounded-xl bg-yellow-400 py-4 font-black hover:bg-yellow-300">
                Proceed to Checkout →
              </button>

            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}