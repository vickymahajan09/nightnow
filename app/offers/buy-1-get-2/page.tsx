"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getOffers,
  type Offer,
} from "../../services/offerService";

import {
  getProducts,
  type Product,
} from "../../services/productService";

export default function BuyOneGetTwoOffersPage() {
  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          offerData,
          productData,
        ] = await Promise.all([
          getOffers(),
          getProducts(),
        ]);

        const activeOffers =
          offerData.filter(
            (offer) =>
              offer.active !== false
          );

        const activeProducts =
          productData.filter(
            (product: Product) =>
              product.active !== false &&
              Number(
                product.stock || 0
              ) > 0
          );

        setOffers(
          activeOffers
        );

        setProducts(
          activeProducts
        );
      } catch (err) {
        console.error(
          "Offers loading error:",
          err
        );

        setOffers([]);
        setProducts([]);

        setError(
          "Offers load nahi ho paaye."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // =====================================================
  // ONLY BUY 1 GET 2
  // =====================================================

  const buy1Get2Offers =
    useMemo(() => {
      return offers.filter(
        (offer) =>
          offer.type ===
          "BUY_1_GET_2"
      );
    }, [offers]);

  // =====================================================
  // OFFER PRODUCT COUNT
  // =====================================================

  const getOfferProductCount = (
    offer: Offer
  ) => {
    return products.filter(
      (product) => {
        const productMatch =
          (offer.productIds || []).some(
            (productId) =>
              String(productId) ===
              String(product.id)
          );

        const brandMatch =
          (offer.brandIds || []).some(
            (brandId) =>
              String(
                product.brandId || ""
              ) === String(brandId)
          );

        return (
          productMatch ||
          brandMatch
        );
      }
    ).length;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-3 py-8 text-white">
        <div className="mx-auto max-w-6xl">

          <Link
            href="/"
            className="text-sm font-black text-zinc-500"
          >
            ← Back to NightNow
          </Link>

          <div className="py-20 text-center">

            <div className="text-5xl">
              🎁
            </div>

            <p className="mt-4 text-sm font-black">
              Loading offers...
            </p>

          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-6 pb-24 text-white">

      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <Link
          href="/"
          className="text-sm font-black text-zinc-500"
        >
          ← Back to NightNow
        </Link>

        {/* HEADER */}

        <section className="mt-5 overflow-hidden rounded-[30px] bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-300 p-6 text-black md:p-10">

          <span className="rounded-full bg-black px-3 py-1 text-[9px] font-black text-white">
            NIGHT NOW SPECIAL OFFER
          </span>

          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Buy 1
            <br />
            Get 2 🎁
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-bold leading-6">
            Active Buy 1 Get 2 offers
            jo Admin panel se configure
            kiye gaye hain.
          </p>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-950/50 p-5 text-center text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!error &&
          buy1Get2Offers.length ===
            0 && (
            <div className="mt-6 rounded-3xl bg-zinc-900 p-10 text-center">

              <div className="text-5xl">
                🎁
              </div>

              <p className="mt-4 font-black">
                No Buy 1 Get 2 offers
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Admin panel se active
                Buy 1 Get 2 offer create
                karein.
              </p>

            </div>
          )}

        {/* OFFERS */}

        {buy1Get2Offers.length >
          0 && (
          <section className="mt-8">

            <div className="flex items-end justify-between">

              <div>
                <h2 className="text-2xl font-black">
                  Buy 1 Get 2 Offers
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {buy1Get2Offers.length} active offer
                  {buy1Get2Offers.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {buy1Get2Offers.map(
                (offer) => {

                  const productCount =
                    getOfferProductCount(
                      offer
                    );

                  return (
                    <Link
                      key={
                        offer.id
                      }
                      href={`/offers/${offer.id}`}
                      className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition hover:-translate-y-1 hover:border-yellow-400"
                    >

                      <div className="bg-yellow-400 p-5 text-black">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <p className="text-[9px] font-black">
                              SPECIAL OFFER
                            </p>

                            <h3 className="mt-1 text-2xl font-black">
                              {offer.title}
                            </h3>
                          </div>

                          <span className="rounded-full bg-black px-3 py-1 text-[9px] font-black text-white">
                            BUY 1 GET 2
                          </span>

                        </div>

                        {offer.description && (
                          <p className="mt-3 text-xs font-semibold text-zinc-800">
                            {
                              offer.description
                            }
                          </p>
                        )}

                      </div>

                      <div className="p-5">

                        <div className="flex items-center justify-between">

                          <div>
                            <p className="text-xs font-black text-zinc-400">
                              OFFER PRODUCTS
                            </p>

                            <p className="mt-1 text-sm font-black">
                              {productCount} product
                              {productCount ===
                              1
                                ? ""
                                : "s"} available
                            </p>
                          </div>

                          <span className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black text-black">
                            View →
                          </span>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}