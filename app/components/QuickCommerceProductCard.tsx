"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { auth, db } from "../lib/firebase";
import { doc, deleteDoc, setDoc } from "firebase/firestore";

type Product = {
  id: string;
  name?: string;
  title?: string;
  productName?: string;
  image?: string;
  images?: string[];
  price?: number;
  mrp?: number;
  stock?: number;
  brandName?: string;
  category?: string;
  variantId?: string;
  variantName?: string;
  size?: string;
  weight?: string;
  volume?: string;
  pack?: string;
  offerLabel?: string;
  offerType?: string;
  [key: string]: any;
};

export default function QuickCommerceProductCard({
  product,
}: {
  product: Product;
}) {
  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
  } = useCart();

  const [liked, setLiked] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const image =
    product.image ||
    product.images?.[0] ||
    "";

  const name =
    product.name ||
    product.title ||
    product.productName ||
    "Product";

  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const stock = Math.max(
    0,
    Number(product.stock || 0)
  );

  const variantId =
    product.variantId || undefined;

  const quantity =
    getItemQuantity(
      product.id,
      variantId
    );

  const discount =
    mrp > price && mrp > 0
      ? Math.round(
          ((mrp - price) / mrp) * 100
        )
      : 0;

  const variant =
    product.variantName ||
    product.size ||
    product.weight ||
    product.volume ||
    product.pack ||
    "";

  const add = () => {
    if (
      stock <= 0 ||
      quantity >= stock
    ) {
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
      variantId:
        product.variantId ||
        "default",
    } as any);
  };

  const decrease = () => {
    if (quantity > 0) {
      removeFromCart(
        product.id,
        product.variantId ||
          "default"
      );
    }
  };

  const increase = () => {
    if (
      stock <= 0 ||
      quantity >= stock
    ) {
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
      variantId:
        product.variantId ||
        "default",
    } as any);
  };

  const toggleWishlist = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (wishlistBusy) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      alert(
        "Please log in to use the wishlist."
      );
      return;
    }

    try {
      setWishlistBusy(true);

      const ref = doc(
        db,
        "users",
        user.uid,
        "wishlist",
        product.id
      );

      if (liked) {
        await deleteDoc(ref);
        setLiked(false);
      } else {
        await setDoc(
          ref,
          {
            productId: product.id,
            productName: name,
            image,
            price,
            mrp,
            variantId:
              product.variantId || "",
            variantName:
              product.variantName || "",
            addedAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );

        setLiked(true);
      }
    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );
      alert(
        "Wishlist update failed."
      );
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 md:hover:-translate-y-0.5 md:hover:shadow-md">
      {/* IMAGE */}
      <div className="relative">
        <Link
          href={`/product/${product.id}`}
          className="block"
        >
          {/* Always square — mobile + desktop */}
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-zinc-50 p-2.5 sm:p-3">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-yellow-50/60" />

            {image ? (
              <img
                src={image}
                alt={name}
                loading="lazy"
                className="relative z-10 h-full w-full object-contain transition-transform duration-300 md:group-hover:scale-105"
              />
            ) : (
              <span className="relative z-10 text-3xl sm:text-4xl">
                📦
              </span>
            )}
          </div>
        </Link>

        {/* DISCOUNT */}
        {discount > 0 && (
          <span className="absolute left-0 top-2 z-20 rounded-r-full bg-green-600 px-1.5 py-0.5 text-[8px] font-black text-white sm:top-3 sm:px-2 sm:text-[9px]">
            {discount}% OFF
          </span>
        )}

        {/* WISHLIST */}
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishlistBusy}
          className={`absolute right-1.5 top-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-sm sm:right-2 sm:top-2 sm:h-8 sm:w-8 sm:text-base ${
            liked
              ? "text-red-500"
              : "text-zinc-700"
          }`}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          {liked ? "♥" : "♡"}
        </button>

        {/* OFFER */}
        {product.offerType &&
          product.offerType !== "NONE" && (
            <span className="absolute bottom-1.5 left-1.5 z-20 max-w-[70%] truncate rounded-md bg-emerald-600 px-1.5 py-0.5 text-[7px] font-black text-white sm:bottom-2 sm:left-2 sm:text-[8px]">
              🎁{" "}
              {product.offerLabel ||
                "Special Offer"}
            </span>
          )}

        {/* QUICK ADD */}
        {quantity === 0 &&
          stock > 0 && (
            <button
              type="button"
              onClick={add}
              className="absolute bottom-1.5 right-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-green-600 bg-white text-lg font-black text-green-700 shadow-sm active:scale-95 sm:bottom-2 sm:right-2 sm:h-9 sm:w-9 sm:text-xl"
              aria-label={`Add ${name}`}
            >
              +
            </button>
          )}
      </div>

      {/* INFO */}
      <div className="flex flex-1 flex-col p-2 sm:p-2.5">
        <Link
          href={`/product/${product.id}`}
        >
          <h3 className="line-clamp-2 min-h-[30px] text-[11px] font-black leading-[15px] text-zinc-900 sm:min-h-[34px] sm:text-xs sm:leading-4">
            {name}
          </h3>
        </Link>

        {(variant ||
          product.brandName ||
          product.category) && (
          <p className="mt-0.5 truncate text-[8px] font-bold text-zinc-400 sm:text-[9px]">
            {variant ||
              product.brandName ||
              product.category}
          </p>
        )}

        {/* PRICE */}
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-black text-zinc-900 sm:text-base">
            ₹{price}
          </span>

          {mrp > price && (
            <span className="truncate text-[8px] text-zinc-400 line-through sm:text-[9px]">
              ₹{mrp}
            </span>
          )}
        </div>

        {mrp > price && (
          <p className="mt-0.5 text-[7px] font-black text-green-600 sm:text-[8px]">
            Save ₹{mrp - price}
          </p>
        )}

        {stock > 0 &&
          stock <= 5 && (
            <p className="mt-0.5 text-[7px] font-black text-orange-500 sm:text-[8px]">
              Only {stock} left
            </p>
          )}

        {/* CART CONTROL */}
        <div className="mt-auto pt-2">
          {stock <= 0 ? (
            <div className="flex h-8 items-center justify-center rounded-lg bg-zinc-100 text-[8px] font-black text-zinc-400 sm:h-9 sm:text-[9px]">
              Out of Stock
            </div>
          ) : quantity > 0 ? (
            <div className="flex h-8 overflow-hidden rounded-lg border border-green-600 bg-green-600 sm:h-9">
              <button
                type="button"
                onClick={decrease}
                className="flex w-8 items-center justify-center bg-white text-sm font-black text-green-700 sm:w-9 sm:text-base"
              >
                −
              </button>

              <span className="flex flex-1 items-center justify-center bg-green-600 text-[10px] font-black text-white sm:text-xs">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increase}
                disabled={
                  quantity >= stock
                }
                className="flex w-8 items-center justify-center bg-white text-sm font-black text-green-700 disabled:opacity-40 sm:w-9 sm:text-base"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={add}
              className="flex h-8 w-full items-center justify-center rounded-lg border border-green-600 bg-white text-[9px] font-black text-green-700 active:bg-green-50 sm:h-9 sm:text-[10px]"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </article>
  );
}