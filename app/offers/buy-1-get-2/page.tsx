"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProducts } from "../../services/productService";
import { useCart } from "../../context/CartContext";

export default function BuyOneGetTwoPage() {
  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const { addToCart } =
    useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const data =
          await getProducts();

        setProducts(
          data.filter(
            (item: any) =>
              item.active !==
                false &&
              Number(
                item.stock || 0
              ) > 0
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const addOffer = (
    product: any
  ) => {
    addToCart({
      ...product,

      // OFFER META
      offerType:
        "BUY_1_GET_2",

      offerLabel:
        "Buy 1 Get 2",

      quantity: 1,
    } as any);

    alert(
      `${product.name} added with Buy 1 Get 2 offer.`
    );
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 pb-24 text-white">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Back to Night Now
        </Link>

        {/* HERO */}

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
              Selected products par special
              Buy 1 Get 2 offer.
              Offer availability product
              ke according vary kar sakti hai.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-black text-white"
            >
              Continue Shopping
            </Link>

          </div>
        </section>

        {/* PRODUCTS */}

        <section className="mt-8">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-2xl font-black">
                Buy 1 Get 2 Offers
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Available offer products
              </p>
            </div>

            <Link
              href="/"
              className="text-xs font-black text-yellow-400"
            >
              View All →
            </Link>

          </div>

          {loading ? (
            <div className="py-16 text-center text-zinc-500">
              Loading offers...
            </div>
          ) : products.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-zinc-900 p-10 text-center">
              <div className="text-5xl">
                🎁
              </div>

              <p className="mt-4 font-black">
                No offers available right now.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

              {products.map(
                (product) => (
                  <div
                    key={
                      product.id
                    }
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                  >

                    <div className="relative flex h-40 items-center justify-center bg-white">

                      {product.image ? (
                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-zinc-400">
                          No Image
                        </span>
                      )}

                      <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[9px] font-black text-black">
                        BUY 1 GET 2
                      </span>
                    </div>

                    <div className="p-3">

                      <p className="line-clamp-2 text-sm font-black">
                        {
                          product.name
                        }
                      </p>

                      {product.brandName && (
                        <p className="mt-1 text-[10px] font-bold text-yellow-400">
                          {
                            product.brandName
                          }
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">

                        <p className="font-black text-green-400">
                          ₹
                          {
                            product.price
                          }
                        </p>

                        <span className="text-[9px] text-zinc-500">
                          Buy 1
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          addOffer(
                            product
                          )
                        }
                        className="mt-3 w-full rounded-xl bg-yellow-400 py-3 text-xs font-black text-black"
                      >
                        🎁 Add Offer
                      </button>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* INFO */}

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          <h3 className="font-black">
            How Buy 1 Get 2 works
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">

            <div className="rounded-xl bg-zinc-800 p-4">
              <b>1️⃣ Select</b>
              <p className="mt-1 text-xs text-zinc-500">
                Offer product choose karein.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4">
              <b>2️⃣ Buy 1</b>
              <p className="mt-1 text-xs text-zinc-500">
                Product ko cart me add karein.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4">
              <b>3️⃣ Get 2</b>
              <p className="mt-1 text-xs text-zinc-500">
                Eligible offer ke according
                bonus quantity apply hogi.
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}