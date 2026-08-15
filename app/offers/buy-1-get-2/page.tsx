"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "../../context/CartContext";
import { getProducts, type Product } from "../../services/productService";
import { getBuy1Get2Offers, type Buy1Get2Offer } from "../../services/offerService";

export default function BuyOneGetTwoPage() {
  const [offers, setOffers] = useState<Buy1Get2Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [offerData, productData] = await Promise.all([
          getBuy1Get2Offers(),
          getProducts(),
        ]);

        const activeOffers = offerData.filter(
          (offer) => offer.active !== false
        );

        const activeProducts = productData.filter(
          (product) =>
            product.active !== false && Number(product.stock || 0) > 0
        );

        setOffers(activeOffers);
        setProducts(activeProducts);
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

  const offerProducts = useMemo(() => {
    const map = new Map<string, Product & { offerTitle?: string; offerId?: string }>();

    offers.forEach((offer) => {
      products.forEach((product) => {
        const matchesProduct = (offer.productIds || []).includes(product.id);
        const matchesBrand = (offer.brandIds || []).some(
          (brandId) => String(product.brandId || "") === String(brandId)
        );

        if (matchesProduct || matchesBrand) {
          const existing = map.get(product.id);
          if (!existing) {
            map.set(product.id, {
              ...product,
              offerTitle: offer.title,
              offerId: offer.id,
            });
          }
        }
      });
    });

    return Array.from(map.values());
  }, [offers, products]);

  const addOffer = (product: Product & { offerTitle?: string; offerId?: string }) => {
    addToCart({
      ...product,
      quantity: 1,
      offerType: "BUY_1_GET_2",
      offerLabel: product.offerTitle || "Buy 1 Get 2",
      offerId: product.offerId || null,
    } as any);

    alert(`${product.name} added with Buy 1 Get 2 offer.`);
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 pb-24 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-zinc-500">
          ← Back to Night Now
        </Link>

        <section className="mt-5 overflow-hidden rounded-[32px] bg-yellow-400 p-6 text-black md:p-10">
          <div className="max-w-2xl">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
              NIGHT NOW SPECIAL OFFER
            </span>

            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              Buy 1
              <br />
              Get 2
            </h1>

            <p className="mt-4 max-w-xl text-sm font-bold leading-6 md:text-base">
              Admin ne jo products ya brands configure kiye hain,
              sirf wahi Buy 1 Get 2 offer me dikhenge.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-black text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Buy 1 Get 2 Offers</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Currently active configured offers
              </p>
            </div>

            <span className="text-xs font-black text-yellow-400">
              {offers.length} Active Offer{offers.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-zinc-500">
              Loading offers...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl bg-red-950/40 p-8 text-center text-red-300">
              {error}
            </div>
          ) : offers.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-zinc-900 p-10 text-center">
              <div className="text-5xl">🎁</div>
              <p className="mt-4 font-black">No active offers available right now.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Admin panel se Buy 1 Get 2 offer activate hone par yahan dikhega.
              </p>
            </div>
          ) : offerProducts.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-zinc-900 p-10 text-center">
              <div className="text-5xl">📦</div>
              <p className="mt-4 font-black">Offer products currently out of stock.</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {offerProducts.map((product) => {
                const price = Number(product.price || 0);

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className="relative flex h-40 items-center justify-center bg-white">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <span className="text-zinc-400">No Image</span>
                        )}

                        <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[9px] font-black text-black">
                          BUY 1 GET 2
                        </span>
                      </div>
                    </Link>

                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-black">
                        {product.name}
                      </p>

                      {product.offerTitle && (
                        <p className="mt-1 line-clamp-1 text-[10px] font-bold text-yellow-400">
                          {product.offerTitle}
                        </p>
                      )}

                      {product.brandName && (
                        <p className="mt-1 text-[10px] font-bold text-zinc-500">
                          {product.brandName}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-black text-green-400">₹{price}</p>
                        <span className="text-[9px] text-zinc-500">Buy 1</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addOffer(product)}
                        className="mt-3 w-full rounded-xl bg-yellow-400 py-3 text-xs font-black text-black"
                      >
                        🎁 Add Offer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="font-black">How Buy 1 Get 2 works</h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-800 p-4">
              <b>1️⃣ Select</b>
              <p className="mt-1 text-xs text-zinc-500">Offer product choose karein.</p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4">
              <b>2️⃣ Buy 1</b>
              <p className="mt-1 text-xs text-zinc-500">Product ko cart me add karein.</p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4">
              <b>3️⃣ Get 2</b>
              <p className="mt-1 text-xs text-zinc-500">
                Eligible offer ke according bonus quantity apply hogi.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}