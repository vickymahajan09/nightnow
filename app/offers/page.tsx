"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getOffers,
  type Offer,
} from "../services/offerService";

import { getProducts } from "../services/productService";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);

        const [offerData, productData] =
          await Promise.all([
            getOffers(),
            getProducts(),
          ]);

        if (cancelled) return;

        setOffers(
          Array.isArray(offerData)
            ? offerData.filter(
                (offer: Offer) =>
                  offer.active !== false
              )
            : []
        );

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );
      } catch (error) {
        console.error(
          "Offers loading error:",
          error
        );

        if (!cancelled) {
          setOffers([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const getOfferLabel = (
    offer: Offer
  ) => {
    if (
      offer.type === "BUY_1_GET_1"
    ) {
      return "BUY 1 GET 1";
    }

    if (
      offer.type === "BUY_1_GET_2"
    ) {
      return "BUY 1 GET 2";
    }

    if (
      offer.type === "BUY_X_GET_Y"
    ) {
      return `BUY ${
        offer.buyQuantity || 1
      } GET ${
        offer.freeQuantity || 1
      }`;
    }

    return "SPECIAL OFFER";
  };

  const getOfferProducts = (
    offer: Offer
  ) => {
    const productIds = new Set(
      Array.isArray(offer.productIds)
        ? offer.productIds.map(String)
        : []
    );

    const brandIds = new Set(
      Array.isArray(offer.brandIds)
        ? offer.brandIds.map(String)
        : []
    );

    return products.filter(
      (product: any) => {
        const productId = String(
          product?.id || ""
        );

        const brandId = String(
          product?.brandId ||
            product?.brand ||
            product?.brandID ||
            ""
        );

        return (
          productIds.has(productId) ||
          (brandId &&
            brandIds.has(brandId))
        );
      }
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] text-zinc-900">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <span className="text-3xl">
              🌙
            </span>

            <div>
              <div className="text-xl font-black leading-none">
                Night
                <span className="text-yellow-500">
                  Now
                </span>
              </div>

              <div className="mt-1 text-[8px] font-bold tracking-[0.18em] text-zinc-400">
                15 MIN DELIVERY
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white"
          >
            ← Home
          </Link>

        </div>

      </header>


      {/* PAGE */}

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-7">

        <div className="mb-7">

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
            NightNow Deals
          </p>

          <h1 className="mt-1 text-3xl font-black">
            All Offers
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Grab the latest offers and save more.
          </p>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-3xl bg-white"
                />
              )
            )}

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          offers.length === 0 && (

            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">

              <div className="text-5xl">
                🎁
              </div>

              <h2 className="mt-4 text-xl font-black">
                No offers available
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                New offers will appear here soon.
              </p>

            </div>

          )}


        {/* OFFER CARDS */}

        {!loading &&
          offers.length > 0 && (

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {offers.map(
                (offer) => {

                  const offerProducts =
                    getOfferProducts(
                      offer
                    );

                  const previewProducts =
                    offerProducts.slice(
                      0,
                      4
                    );

                  const remaining =
                    Math.max(
                      0,
                      offerProducts.length -
                        previewProducts.length
                    );

                  const offerLabel =
                    getOfferLabel(
                      offer
                    );

                  return (

                    <Link
                      key={String(
                        offer.id
                      )}
                      href={`/offers/${encodeURIComponent(
                        String(
                          offer.id
                        )
                      )}`}
                      className="group overflow-hidden rounded-3xl border border-yellow-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* OFFER HEADER */}

                      <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 p-3">

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm">
                            🎁
                          </div>

                          <span className="rounded-full bg-black px-2.5 py-1 text-[8px] font-black text-white">
                            {offerLabel}
                          </span>

                        </div>

                      </div>


                      {/* CONTENT */}

                      <div className="p-3">

                        <h2 className="line-clamp-2 text-sm font-black">
                          {offer.title}
                        </h2>

                        {offer.description && (

                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">
                            {
                              offer.description
                            }
                          </p>

                        )}


                        {/* PRODUCT IMAGE GROUP */}

                        {previewProducts.length >
                        0 ? (

                          <div className="mt-3 flex items-center">

                            {previewProducts.map(
                              (
                                product: any,
                                index: number
                              ) => {

                                const image =
                                  product?.image ||
                                  product?.images?.[0] ||
                                  "";

                                const name =
                                  product?.name ||
                                  product?.title ||
                                  "Product";

                                return (

                                  <div
                                    key={String(
                                      product?.id ||
                                        index
                                    )}
                                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-zinc-50 shadow-sm ${
                                      index > 0
                                        ? "-ml-2"
                                        : ""
                                    }`}
                                    title={name}
                                  >

                                    {image ? (

                                      <img
                                        src={image}
                                        alt={name}
                                        className="h-full w-full object-contain p-0.5"
                                        loading="lazy"
                                      />

                                    ) : (

                                      <span className="text-base">
                                        📦
                                      </span>

                                    )}

                                  </div>

                                );
                              }
                            )}


                            {remaining > 0 && (

                              <div className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-white bg-zinc-900 text-[10px] font-black text-white shadow-sm">
                                +{remaining}
                              </div>

                            )}

                          </div>

                        ) : (

                          <div className="mt-3 flex h-10 items-center rounded-lg bg-zinc-50 px-3 text-[10px] font-bold text-zinc-400">
                            Products inside offer
                          </div>

                        )}


                        {/* INFO */}

                        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">

                          <div>

                            <p className="text-[8px] font-black uppercase tracking-wider text-zinc-400">
                              Offer Group
                            </p>

                            <p className="mt-0.5 text-[11px] font-black">
                              {offerProducts.length >
                              0
                                ? `${offerProducts.length} ${
                                    offerProducts.length ===
                                    1
                                      ? "item"
                                      : "items"
                                  }`
                                : "View products"}
                            </p>

                          </div>

                          <span className="rounded-lg bg-black px-3 py-2 text-[9px] font-black text-white transition group-hover:translate-x-1">
                            View Offer →
                          </span>

                        </div>

                      </div>

                    </Link>

                  );
                }
              )}

            </div>

          )}

      </section>

    </main>
  );
}