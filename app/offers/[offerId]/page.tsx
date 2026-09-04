"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  getOffers,
  type Offer,
} from "../../services/offerService";

import {
  getProducts,
  type Product,
} from "../../services/productService";

import { useCart } from "../../context/CartContext";

export default function OfferDetailsPage() {
  const params = useParams<{ offerId: string }>();

  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
  } = useCart();

  const [offer, setOffer] =
    useState<Offer | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     LOAD OFFER
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadOffer = async () => {
      try {
        setLoading(true);
        setError("");

        const offerId = params?.offerId || "";

        console.log(
          "🔥 OFFER PAGE ID:",
          offerId
        );

        const [
          offers,
          allProducts,
        ] = await Promise.all([
          getOffers(),
          getProducts(),
        ]);

        if (cancelled) {
          return;
        }

        console.log(
          "🔥 ALL OFFERS:",
          offers
        );

        const selectedOffer =
          offers.find(
            (item: Offer) =>
              String(item.id) ===
              String(offerId)
          );

        console.log(
          "🔥 SELECTED OFFER:",
          selectedOffer
        );

        if (!selectedOffer) {
          setOffer(null);
          setProducts([]);
          setError(
            "Offer not found."
          );
          return;
        }

        setOffer(
          selectedOffer
        );

        /* ==========================================
           ACTIVE PRODUCTS
        ========================================== */

        const activeProducts =
          Array.isArray(allProducts)
            ? allProducts.filter(
                (product: any) =>
                  product?.active !== false
              )
            : [];

        /* ==========================================
           OFFER PRODUCT IDS
        ========================================== */

        const selectedProductIds =
          Array.isArray(
            selectedOffer.productIds
          )
            ? selectedOffer.productIds.map(
                (id) =>
                  String(id)
              )
            : [];

        /* ==========================================
           OFFER BRAND IDS
        ========================================== */

        const selectedBrandIds =
          Array.isArray(
            selectedOffer.brandIds
          )
            ? selectedOffer.brandIds.map(
                (id) =>
                  String(id)
                    .trim()
                    .toLowerCase()
              )
            : [];

        /* ==========================================
           MATCH PRODUCTS
        ========================================== */

        const matchedProducts =
          activeProducts.filter(
            (product: any) => {

              const productId =
                String(
                  product?.id ?? ""
                );

              const brandId =
                String(
                  product?.brandId ??
                    product?.brandID ??
                    product?.brand?.id ??
                    ""
                )
                  .trim()
                  .toLowerCase();

              const brandName =
                String(
                  product?.brandName ??
                    product?.brand?.name ??
                    ""
                )
                  .trim()
                  .toLowerCase();

              /* PRODUCT MATCH */

              if (
                selectedProductIds.includes(
                  productId
                )
              ) {
                return true;
              }

              /* BRAND ID MATCH */

              if (
                selectedBrandIds.includes(
                  brandId
                )
              ) {
                return true;
              }

              /* BRAND NAME MATCH */

              if (
                selectedBrandIds.includes(
                  brandName
                )
              ) {
                return true;
              }

              return false;
            }
          );

        console.log(
          "🔥 OFFER PRODUCTS:",
          matchedProducts
        );

        setProducts(
          matchedProducts as Product[]
        );

      } catch (err) {
        console.error(
          "🔥 OFFER PAGE ERROR:",
          err
        );

        if (!cancelled) {
          setOffer(null);
          setProducts([]);
          setError(
            "Failed to load the offer."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOffer();

    return () => {
      cancelled = true;
    };
  }, [params]);

  /* =====================================================
     OFFER LABEL
  ===================================================== */

  const offerLabel =
    useMemo(() => {
      if (!offer) {
        return "";
      }

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
    }, [offer]);

  /* =====================================================
     IMAGE
  ===================================================== */

  const getImage = (
    product: Product
  ) => {
    const item =
      product as any;

    if (
      typeof item.image ===
        "string" &&
      item.image.trim()
    ) {
      return item.image;
    }

    if (
      Array.isArray(
        item.images
      ) &&
      item.images.length > 0
    ) {
      return item.images[0];
    }

    return "";
  };

  /* =====================================================
     QUANTITY
  ===================================================== */

  const getQty = (
    product: Product
  ) => {
    const item =
      product as any;

    return getItemQuantity(
      product.id,
      item.variantId
    );
  };

  /* =====================================================
     INCREASE
  ===================================================== */

  const increase = (
    product: Product
  ) => {
    const item =
      product as any;

    const stock =
      Number(
        item.stock ?? 0
      );

    const qty =
      getQty(product);

    if (
      stock > 0 &&
      qty >= stock
    ) {
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
    } as any);
  };

  /* =====================================================
     DECREASE
  ===================================================== */

  const decrease = (
    product: Product
  ) => {
    const item =
      product as any;

    const qty =
      getQty(product);

    if (qty <= 0) {
      return;
    }

    removeFromCart(
      product.id,
      item.variantId
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#fdf4ff] via-white to-[#f3e8ff] px-3 py-5">

        <div className="mx-auto max-w-3xl">

          <div className="h-9 w-32 animate-pulse rounded-xl bg-purple-100" />

          <div className="mt-4 h-36 animate-pulse rounded-3xl bg-purple-100" />

          <div className="mt-5 grid grid-cols-2 gap-3">

            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl bg-purple-100"
                />
              )
            )}

          </div>

        </div>

      </main>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#fdf4ff] via-white to-[#f3e8ff] px-5">

        <div className="text-center">

          <div className="text-5xl">
            🎁
          </div>

          <h1 className="mt-4 text-xl font-black">
            {error ||
              "Offer not found"}
          </h1>

          <p className="mt-2 text-xs text-zinc-500">
            Offer available nahi
            hai.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black"
          >
            ← Home
          </Link>

        </div>

      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fdf4ff] via-[#fff8fc] to-[#f3e8ff] pb-24">

      {/* HEADER */}

      <div className="sticky top-0 z-50 border-b border-purple-100 bg-[#fffaff]/95 px-3 py-3 backdrop-blur">

        <div className="mx-auto flex max-w-3xl items-center gap-3">

          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-lg font-black text-purple-800"
          >
            ←
          </Link>

          <div className="min-w-0 flex-1">

            <p className="text-[9px] font-black text-purple-600">
              {offerLabel}
            </p>

            <h1 className="truncate text-base font-black text-zinc-900">
              {offer.title}
            </h1>

          </div>

          <span className="animate-pulse rounded-full bg-black px-2.5 py-1 text-[8px] font-black text-white">
            LIVE
          </span>

        </div>

      </div>

      {/* HERO */}

      <section className="mx-auto max-w-3xl px-3 pt-3">

        <div className="relative overflow-hidden rounded-[22px] border border-purple-200 bg-gradient-to-br from-[#eadcff] via-[#f7e9ff] to-[#ffeaf5] p-4 shadow-lg">

          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/60 blur-2xl" />

          <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-pink-200/50 blur-2xl" />

          <p className="relative text-[9px] font-black text-purple-700">
            SPECIAL OFFER
          </p>

          <h2 className="relative mt-1 text-2xl font-black text-zinc-900">
            {offer.title}
          </h2>

          {offer.description && (
            <p className="relative mt-1 text-xs font-bold text-zinc-600">
              {offer.description}
            </p>
          )}

          <div className="relative mt-3 inline-block rounded-full bg-yellow-400 px-3 py-1.5 text-[9px] font-black text-black">
            {offerLabel}
          </div>

        </div>

      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-3xl px-3 pt-5">

        <div className="flex items-end justify-between">

          <div>

            <h2 className="text-lg font-black">
              Offer Products
            </h2>

            <p className="mt-0.5 text-[10px] text-zinc-500">
              {products.length} products
            </p>

          </div>

        </div>

        {products.length === 0 ? (

          <div className="mt-4 rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">

            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 text-sm font-black">
              Is offer ke products
              nahi mile.
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Admin me selected
              products check karein.
            </p>

          </div>

        ) : (

          <div className="mt-4 grid grid-cols-2 gap-3">

            {products.map(
              (product) => {

                const item =
                  product as any;

                const image =
                  getImage(product);

                const price =
                  Number(
                    item.price ?? 0
                  );

                const mrp =
                  Number(
                    item.mrp ?? 0
                  );

                const stock =
                  Number(
                    item.stock ?? 0
                  );

                const qty =
                  getQty(product);

                return (
                  <article
                    key={String(
                      product.id
                    )}
                    className="group overflow-hidden rounded-[22px] border border-purple-100 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.08)]"
                  >

                    {/* IMAGE */}

                    <div className="relative m-2 flex h-36 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-inner">

                      {image ? (

                        <img
                          src={image}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          className="h-[82%] w-[82%] object-contain drop-shadow-[0_10px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105"
                        />

                      ) : (

                        <span className="text-4xl">
                          📦
                        </span>

                      )}

                    </div>

                    {/* DETAILS */}

                    <div className="px-3 pb-3">

                      <h3 className="truncate text-xs font-black">
                        {product.name}
                      </h3>

                      {item.brandName && (
                        <p className="mt-0.5 truncate text-[8px] text-zinc-400">
                          {item.brandName}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2">

                        <span className="text-sm font-black text-green-600">
                          ₹{price}
                        </span>

                        {mrp >
                          price &&
                          mrp > 0 && (
                            <span className="text-[9px] text-zinc-400 line-through">
                              ₹{mrp}
                            </span>
                          )}

                      </div>

                      {/* ADD */}

                      {qty <= 0 ? (

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={
                              stock <= 0
                            }
                            onClick={() =>
                              increase(
                                product
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black shadow-lg disabled:bg-zinc-300"
                          >
                            {stock > 0
                              ? "+"
                              : "✕"}
                          </button>
                        </div>

                      ) : (

                        /* MINUS / QTY / PLUS */

                        <div className="mt-2 flex h-10 overflow-hidden rounded-xl bg-black">

                          <button
                            type="button"
                            onClick={() =>
                              decrease(
                                product
                              )
                            }
                            className="w-10 text-lg font-black text-white transition active:scale-90"
                          >
                            −
                          </button>

                          <div className="flex flex-1 items-center justify-center bg-yellow-400 text-sm font-black text-black">
                            {qty}
                          </div>

                          <button
                            type="button"
                            disabled={
                              stock > 0 &&
                              qty >=
                                stock
                            }
                            onClick={() =>
                              increase(
                                product
                              )
                            }
                            className="w-10 text-lg font-black text-white transition active:scale-90 disabled:opacity-40"
                          >
                            +
                          </button>

                        </div>

                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>

      {/* VIEW CART */}

      <Link
        href="/cart"
        className="fixed bottom-[82px] left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-black text-white shadow-2xl"
      >
        🛒 View Cart
      </Link>

    </main>
  );
}