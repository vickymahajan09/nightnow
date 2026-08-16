"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Gift, Sparkles, ArrowRight, ShoppingCart, Minus, Plus, Tag } from "lucide-react";

import { useCart } from "../../context/CartContext";

import {
  getProducts,
  type Product,
} from "../../services/productService";

import {
  getBuy1Get2Offers,
  type Buy1Get2Offer,
} from "../../services/offerService";

type OfferProduct = Product & {
  offerTitle?: string;
  offerDescription?: string;
  offerId?: string;
};

export default function BuyOneGetTwoPage() {
  const [offers, setOffers] = useState<Buy1Get2Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, removeFromCart, getItemQuantity, cartCount, cartTotal } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [offerData, productData] = await Promise.all([
          getBuy1Get2Offers(),
          getProducts(),
        ]);

        setOffers(offerData.filter((offer) => offer.active !== false));
        setProducts(
          productData.filter(
            (product) =>
              product.active !== false && Number(product.stock || 0) > 0
          )
        );
      } catch (err) {
        console.error("Buy 1 Get 2 loading error:", err);
        setError("Offers load nahi ho paaye. Please try again.");
        setOffers([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const offerProducts = useMemo<OfferProduct[]>(() => {
    const map = new Map<string, OfferProduct>();

    offers.forEach((offer) => {
      products.forEach((product) => {
        const matchesProduct = (offer.productIds || []).includes(product.id);
        const matchesBrand = (offer.brandIds || []).some(
          (brandId) => String(product.brandId || "") === String(brandId)
        );

        if (!matchesProduct && !matchesBrand) return;

        if (!map.has(product.id)) {
          map.set(product.id, {
            ...product,
            offerTitle: offer.title,
            offerDescription: offer.description,
            offerId: offer.id,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [offers, products]);

  const handleAdd = (product: OfferProduct) => {
    addToCart({
      ...product,
      quantity: 1,
      offerType: "BUY_1_GET_2",
      offerLabel: product.offerTitle || "Buy 1 Get 2",
      offerId: product.offerId || null,
    } as any);
  };

  const discountPercent = (product: Product) => {
    const mrp = Number(product.mrp || 0);
    const price = Number(product.price || 0);
    if (!mrp || price >= mrp) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  return (
    <main className="min-h-screen bg-[#fffdf5] px-3 py-4 pb-28 text-zinc-900 sm:px-5">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-zinc-100 transition hover:text-zinc-900"
        >
          ← Back to Night Now
        </Link>

        {/* LIGHT OFFER HERO */}
        <section className="relative mt-4 overflow-hidden rounded-[28px] border border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-rose-50 p-5 shadow-sm sm:p-7">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-yellow-200/50 blur-2xl" />
          <div className="absolute -bottom-14 right-24 h-32 w-32 rounded-full bg-pink-200/40 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1.5 text-[10px] font-black tracking-wide text-yellow-800">
                <Sparkles size={13} /> NIGHT NOW SPECIAL OFFER
              </span>

              <h1 className="mt-3 text-3xl font-black leading-none sm:text-5xl">
                Buy 1 <span className="text-orange-500">Get 2</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-zinc-500 sm:text-sm">
                Special offer products ko light, simple aur attractive cards ke saath shop karein.
                Admin panel se configured offers yahin automatically show honge.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-green-700 shadow-sm ring-1 ring-green-100">
                  ✓ Special Deal
                </span>
                <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black text-orange-600 shadow-sm ring-1 ring-orange-100">
                  🎁 Extra Benefit
                </span>
              </div>
            </div>

            <div className="flex h-28 w-28 shrink-0 items-center justify-center self-end rounded-[28px] bg-white shadow-md ring-1 ring-yellow-100 md:self-auto">
              <Gift className="h-14 w-14 text-orange-400" strokeWidth={1.7} />
            </div>
          </div>
        </section>

        {/* OFFERS HEADER */}
        <section className="mt-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black sm:text-2xl">Buy 1 Get 2 Offers</h2>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-[9px] font-black text-yellow-800">
                  OFFER
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-zinc-400">
                Choose an eligible product and add the special offer to cart.
              </p>
            </div>

            {!loading && (
              <span className="shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black text-green-700">
                {offers.length} Active
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-3xl bg-white ring-1 ring-zinc-100" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-sm font-bold text-red-600">
              {error}
            </div>
          ) : offers.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-yellow-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50">
                <Gift className="text-yellow-500" size={30} />
              </div>
              <p className="mt-4 font-black">No active offers right now.</p>
              <p className="mt-1 text-xs text-zinc-400">
                Admin panel se Buy 1 Get 2 offer activate hone par yahan dikhega.
              </p>
            </div>
          ) : offerProducts.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">📦</div>
              <p className="mt-3 font-black">Offer products currently out of stock.</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {offerProducts.map((product) => {
                const quantity = getItemQuantity(product.id, product.variantId);
                const price = Number(product.price || 0);
                const mrp = Number(product.mrp || 0);
                const discount = discountPercent(product);

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[22px] border border-yellow-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">No Image</span>
                        )}

                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[9px] font-black text-orange-700">
                          <Gift size={11} /> BUY 1 GET 2
                        </span>

                        {discount > 0 && (
                          <span className="absolute right-2 top-2 rounded-full bg-green-100 px-2 py-1 text-[9px] font-black text-green-700">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-3">
                      <p className="line-clamp-2 min-h-9 text-xs font-black leading-4 text-zinc-900 sm:text-sm">
                        {product.name}
                      </p>

                      {product.offerTitle && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-yellow-50 px-2 py-1.5 text-[9px] font-black text-yellow-800">
                          <Tag size={11} className="mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{product.offerTitle}</span>
                        </div>
                      )}

                      {product.brandName && (
                        <p className="mt-2 truncate text-[9px] font-bold text-zinc-400">
                          {product.brandName}
                        </p>
                      )}

                      <div className="mt-2 flex items-end gap-1.5">
                        <span className="text-base font-black text-zinc-900">₹{price}</span>
                        {mrp > price && (
                          <span className="text-[9px] text-zinc-400 line-through">₹{mrp}</span>
                        )}
                      </div>

                      {product.offerDescription && (
                        <p className="mt-1 line-clamp-2 text-[9px] font-medium leading-3.5 text-zinc-400">
                          {product.offerDescription}
                        </p>
                      )}

                      {quantity > 0 ? (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-yellow-100 p-1">
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id, product.variantId)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm transition hover:bg-yellow-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>

                          <span className="text-sm font-black">{quantity}</span>

                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            disabled={Number(product.stock || 0) <= quantity}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-zinc-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-yellow-400 py-2.5 text-[10px] font-black text-zinc-900 shadow-sm transition hover:bg-yellow-500"
                        >
                          <Gift size={14} /> ADD OFFER
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-8 rounded-3xl border border-yellow-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100">
              <Gift size={18} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-black">How Buy 1 Get 2 works</h3>
              <p className="text-[10px] font-medium text-zinc-400">Simple 3-step offer flow</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1️⃣", "Select", "Offer product choose karein."],
              ["2️⃣", "Buy 1", "Eligible product ko cart me add karein."],
              ["3️⃣", "Get 2", "Configured offer ke according benefit apply hoga."],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl bg-gradient-to-br from-yellow-50 to-white p-4 ring-1 ring-yellow-100">
                <div className="text-xl">{icon}</div>
                <b className="mt-2 block text-xs">{title}</b>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STICKY CART BAR */}
        {cartCount > 0 && (
          <div className="fixed inset-x-0 bottom-3 z-50 px-3">
            <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-white/95 p-2.5 shadow-xl ring-1 ring-yellow-100 backdrop-blur">
              <div className="min-w-0 pl-2">
                <p className="truncate text-[10px] font-black text-zinc-400">CART</p>
                <p className="text-xs font-black text-zinc-900">
                  {cartCount} {cartCount === 1 ? "item" : "items"} • ₹{cartTotal}
                </p>
              </div>

              <Link
                href="/cart"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black text-zinc-900 shadow-sm hover:bg-yellow-500"
              >
                <ShoppingCart size={15} />
                View Cart
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}