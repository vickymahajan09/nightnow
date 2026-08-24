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

export default function QuickCommerceProductCard({ product }: { product: Product }) {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const [liked, setLiked] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const image = product.image || product.images?.[0] || "";
  const name = product.name || product.title || product.productName || "Product";
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const stock = Math.max(0, Number(product.stock || 0));
  const quantity = getItemQuantity(product.id, product.variantId || undefined);
  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const variant = product.variantName || product.size || product.weight || product.volume || product.pack || "";

  const add = () => {
    if (stock <= 0 || quantity >= stock) return;
    addToCart({ ...product, quantity: 1 } as any);
  };

  const decrease = () => {
    if (quantity > 0) removeFromCart(product.id, product.variantId || undefined);
  };

  const increase = () => {
    if (stock <= 0 || quantity >= stock) return;
    addToCart({ ...product, quantity: 1 } as any);
  };

  const toggleWishlist = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (wishlistBusy) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Wishlist use karne ke liye login karein.");
      return;
    }

    try {
      setWishlistBusy(true);
      const ref = doc(db, "users", user.uid, "wishlist", product.id);
      if (liked) {
        await deleteDoc(ref);
        setLiked(false);
      } else {
        await setDoc(ref, {
          productId: product.id,
          productName: name,
          image,
          price,
          mrp,
          variantId: product.variantId || "",
          variantName: product.variantName || "",
          addedAt: new Date(),
          updatedAt: new Date(),
        }, { merge: true });
        setLiked(true);
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      alert("Wishlist update failed.");
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 md:rounded-[20px] md:hover:-translate-y-1 md:hover:shadow-lg">
      <div className="relative">
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f8f8f8] p-3 md:h-[210px] md:aspect-auto md:p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-yellow-50/70" />
            {image ? (
              <img
                src={image}
                alt={name}
                loading="lazy"
                className="relative z-10 h-full w-full object-contain transition-transform duration-300 md:group-hover:scale-105"
              />
            ) : (
              <span className="relative z-10 text-4xl">📦</span>
            )}
          </div>
        </Link>

        {discount > 0 && (
          <span className="absolute left-0 top-3 z-20 rounded-r-full bg-green-600 px-2.5 py-1 text-[9px] font-black text-white md:text-[10px]">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishlistBusy}
          className={`absolute right-2.5 top-2.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md md:h-9 md:w-9 ${liked ? "text-red-500" : "text-zinc-700"}`}
          aria-label="Wishlist"
        >
          {liked ? "♥" : "♡"}
        </button>

        {product.offerType && product.offerType !== "NONE" && (
          <span className="absolute bottom-2 left-2 z-20 rounded-md bg-emerald-600 px-2 py-1 text-[8px] font-black text-white">
            🎁 {product.offerLabel || "Special Offer"}
          </span>
        )}

        {quantity === 0 && stock > 0 && (
          <button
            type="button"
            onClick={add}
            className="absolute bottom-2 right-2 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-green-600 bg-white text-xl font-black text-green-700 shadow-md active:scale-95"
            aria-label={`Add ${name}`}
          >
            +
          </button>
        )}
      </div>

      <div className="p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[34px] text-[11px] font-black leading-4 text-zinc-900 md:min-h-[40px] md:text-sm md:leading-5">
            {name}
          </h3>
        </Link>

        {(variant || product.brandName || product.category) && (
          <p className="mt-1 truncate text-[9px] font-bold text-zinc-400 md:text-[10px]">
            {variant || product.brandName || product.category}
          </p>
        )}

        <div className="mt-2 flex items-end gap-2">
          <span className="text-base font-black text-zinc-900 md:text-lg">₹{price}</span>
          {mrp > price && <span className="pb-0.5 text-[9px] text-zinc-400 line-through">₹{mrp}</span>}
        </div>

        {mrp > price && (
          <p className="mt-0.5 text-[8px] font-black text-green-600 md:text-[9px]">
            Save ₹{mrp - price}
          </p>
        )}

        {stock > 0 && stock <= 5 && (
          <p className="mt-1 text-[8px] font-black text-orange-500 md:text-[9px]">Only {stock} left</p>
        )}

        <div className="mt-3">
          {stock <= 0 ? (
            <div className="rounded-lg bg-zinc-100 py-2.5 text-center text-[9px] font-black text-zinc-400">Out of Stock</div>
          ) : quantity > 0 ? (
            <div className="flex h-9 overflow-hidden rounded-lg border border-green-600 bg-green-600">
              <button type="button" onClick={decrease} className="flex w-10 items-center justify-center bg-white text-base font-black text-green-700">−</button>
              <span className="flex flex-1 items-center justify-center bg-green-600 text-xs font-black text-white">{quantity}</span>
              <button type="button" onClick={increase} disabled={quantity >= stock} className="flex w-10 items-center justify-center bg-white text-base font-black text-green-700 disabled:opacity-40">+</button>
            </div>
          ) : (
            <button type="button" onClick={add} className="w-full rounded-lg border border-green-600 bg-white py-2.5 text-[10px] font-black text-green-700 active:bg-green-50">ADD</button>
          )}
        </div>
      </div>
    </article>
  );
}