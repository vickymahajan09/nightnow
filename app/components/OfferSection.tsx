"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  getOffers,
  type Offer,
} from "../services/offerService";

export default function OfferSection() {
  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const loadOffers = async () => {
      try {
        const data =
          await getOffers();

        if (!mounted) {
          return;
        }

        const activeOffers =
          Array.isArray(data)
            ? data.filter(
                (offer: Offer) =>
                  offer &&
                  offer.active !== false
              )
            : [];

        console.log(
          "NIGHTNOW ACTIVE OFFERS:",
          activeOffers
        );

        setOffers(
          activeOffers
        );
      } catch (error) {
        console.error(
          "Offer section error:",
          error
        );

        if (mounted) {
          setOffers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOffers();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full px-3 py-2">
        <div className="h-24 animate-pulse rounded-2xl bg-purple-100" />
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  const getOfferLabel = (
    offer: Offer
  ) => {
    if (
      offer.type ===
      "BUY_1_GET_1"
    ) {
      return "BUY 1 GET 1";
    }

    if (
      offer.type ===
      "BUY_1_GET_2"
    ) {
      return "BUY 1 GET 2";
    }

    if (
      offer.type ===
      "BUY_X_GET_Y"
    ) {
      return `BUY ${offer.buyQuantity} GET ${offer.freeQuantity}`;
    }

    return "SPECIAL OFFER";
  };

  return (
    <section className="w-full px-3 pt-2">

      {/* OFFER SLIDER */}

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

        {offers.map(
          (offer) => (
            <Link
              key={String(
                offer.id
              )}
              href={`/offers/${offer.id}`}
              className="block min-w-[88%] max-w-[420px] shrink-0"
            >

              <article className="relative overflow-hidden rounded-[20px] border border-purple-200 bg-gradient-to-br from-[#eadcff] via-[#f8edff] to-[#ffeaf5] p-4 shadow-[0_8px_25px_rgba(160,100,200,0.16)] transition-transform duration-200 active:scale-[0.98]">

                {/* GLOW */}

                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/60 blur-2xl" />

                <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-pink-200/50 blur-2xl" />

                {/* TOP */}

                <div className="relative flex items-center justify-between gap-2">

                  <span className="rounded-full bg-black px-2.5 py-1 text-[8px] font-black text-white">
                    {getOfferLabel(
                      offer
                    )}
                  </span>

                  <span className="animate-pulse rounded-full bg-yellow-400 px-2.5 py-1 text-[8px] font-black text-black">
                    LIVE
                  </span>

                </div>

                {/* TITLE */}

                <h3 className="relative mt-2 truncate text-[17px] font-black text-zinc-900">
                  {offer.title}
                </h3>

                {/* DESCRIPTION */}

                {offer.description && (
                  <p className="relative mt-0.5 truncate text-[9px] font-bold text-zinc-600">
                    {
                      offer.description
                    }
                  </p>
                )}

                {/* BOTTOM */}

                <div className="relative mt-3 flex items-center justify-between">

                  <span className="text-[9px] font-bold text-purple-700">
                    Tap to see offer
                    products
                  </span>

                  <span className="rounded-xl bg-yellow-400 px-3 py-2 text-[9px] font-black text-black shadow-[0_3px_0_#d6a900]">
                    View Offer →
                  </span>

                </div>

              </article>

            </Link>
          )
        )}

      </div>

      {/* OFFER COUNT */}

      {offers.length > 1 && (
        <div className="mt-1 flex justify-center gap-1">
          {offers.map(
            (offer) => (
              <span
                key={String(
                  offer.id
                )}
                className="h-1.5 w-1.5 rounded-full bg-purple-300"
              />
            )
          )}
        </div>
      )}

    </section>
  );
}