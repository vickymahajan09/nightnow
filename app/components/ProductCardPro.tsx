"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "../context/CartContext";

type Product = {
  id: string;
  name?: string;
  brandName?: string;
  brand?: string;
  category?: string;
  image?: string;
  images?: string[];
  price?: number;
  mrp?: number;
  stock?: number;
  size?: string;
  weight?: string;
  pack?: string;
  description?: string;
  variants?: any[];
  [key: string]: any;
};

function money(value: unknown) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export default function ProductCardPro({ product }: { product: Product }) {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.id, product.variantId);
  const image = product.image || product.images?.[0] || "/no-image.png";
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const discount = useMemo(() => (mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0), [mrp, price]);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        {discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-green-600 px-2 py-1 text-[10px] font-black text-white">
            {discount}% OFF
          </span>
        )}
        <Link href={`/product/${product.id}`} className="block overflow-hidden rounded-xl bg-zinc-50">
          <img src={image} alt={product.name || "Product"} className="mx-auto h-44 w-full object-contain p-4 transition duration-300 group-hover:scale-105" loading="lazy" />
        </Link>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          {product.brandName || product.brand || product.category || "Night Now"}
        </p>
        <Link href={`/product/${product.id}`} className="mt-1 line-clamp-2 text-sm font-black text-zinc-900">
          {product.name || "Product"}
        </Link>
        {(product.size || product.weight || product.pack) && (
          <p className="mt-1 text-xs font-medium text-zinc-500">{product.size || product.weight || product.pack}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2">
            <span className="text-base font-black">₹{money(price)}</span>
            {mrp > price && <span className="text-xs font-medium text-zinc-400 line-through">₹{money(mrp)}</span>}
          </div>

          {quantity > 0 ? (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-yellow-400 px-2 py-1.5">
              <button onClick={() => removeFromCart(product.id, product.variantId)} className="h-8 w-8 rounded-lg text-lg font-black hover:bg-yellow-300" aria-label="Decrease quantity">−</button>
              <span className="text-sm font-black">{quantity}</span>
              <button onClick={() => addToCart({ ...product, quantity: 1 } as any)} className="h-8 w-8 rounded-lg text-lg font-black hover:bg-yellow-300" aria-label="Increase quantity">+</button>
            </div>
          ) : (
            <button
              disabled={Number(product.stock || 0) <= 0}
              onClick={() => addToCart({ ...product, quantity: 1 } as any)}
              className="mt-3 w-full rounded-xl border border-yellow-400 bg-yellow-50 py-2.5 text-sm font-black text-zinc-950 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              {Number(product.stock || 0) <= 0 ? "Out of stock" : "ADD"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
