"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import {
  getOfferById,
  type Offer,
} from "../../services/offerService";

import {
  getProducts,
} from "../../services/productService";

import { useCart } from "../../context/CartContext";

export default function OfferDetailPage() {
  const params = useParams();

  const offerId = String(
    params?.offerId || ""
  );

  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
    cartCount,
    cartTotal,
  } = useCart();

  const [offer, setOffer] =
    useState<Offer | null>(null);

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCartBar, setShowCartBar] =
    useState(false);


  // =====================================================
  // LOAD OFFER + PRODUCTS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const loadOffer = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          selectedOffer,
          productData,
        ] = await Promise.all([
          getOfferById(offerId),
          getProducts(),
        ]);

        if (cancelled) {
          return;
        }

        if (!selectedOffer) {
          setError(
            "Offer not found."
          );
          return;
        }

        if (
          selectedOffer.active === false
        ) {
          setError(
            "This offer is no longer active."
          );
          return;
        }

        setOffer(
          selectedOffer
        );

        const selectedProductIds =
          new Set(
            Array.isArray(
              selectedOffer.productIds
            )
              ? selectedOffer.productIds.map(
                  String
                )
              : []
          );

        const selectedBrandIds =
          new Set(
            Array.isArray(
              selectedOffer.brandIds
            )
              ? selectedOffer.brandIds.map(
                  String
                )
              : []
          );

        const relatedProducts =
          Array.isArray(productData)
            ? productData.filter(
                (product: any) => {

                  if (
                    product?.active === false
                  ) {
                    return false;
                  }

                  const productId =
                    String(
                      product?.id || ""
                    );

                  const brandId =
                    String(
                      product?.brandId ||
                        product?.brand ||
                        product?.brandID ||
                        ""
                    );

                  return (
                    selectedProductIds.has(
                      productId
                    ) ||
                    (
                      brandId &&
                      selectedBrandIds.has(
                        brandId
                      )
                    )
                  );
                }
              )
            : [];

        setProducts(
          relatedProducts
        );

      } catch (err) {
        console.error(
          "Offer detail loading error:",
          err
        );

        if (!cancelled) {
          setError(
            "Offer load nahi ho pa raha."
          );
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (offerId) {
      void loadOffer();
    }

    return () => {
      cancelled = true;
    };
  }, [offerId]);


  // =====================================================
  // OFFER LABEL
  // =====================================================

  const offerLabel =
    useMemo(() => {

      if (!offer) {
        return "SPECIAL OFFER";
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
        return `BUY ${
          offer.buyQuantity || 1
        } GET ${
          offer.freeQuantity || 1
        }`;
      }

      return "SPECIAL OFFER";

    }, [offer]);


  // =====================================================
  // ADD
  // =====================================================

  const handleAdd = (
    product: any
  ) => {

    const stock =
      Number(
        product?.stock || 0
      );

    if (stock <= 0) {
      return;
    }

    addToCart({
      ...product,

      quantity: 1,

      variantId:
        product.variantId ||
        "default",

      offerId:
        String(
          offer?.id ||
            offerId
        ),

      offerType:
        offer?.type ||
        "NONE",

      offerLabel,

      offerBuyQuantity:
        Number(
          offer?.buyQuantity || 1
        ),

      offerFreeQuantity:
        Number(
          offer?.freeQuantity || 0
        ),

      offerDescription:
        offer?.description ||
        "",
    } as any);

    setShowCartBar(true);
  };


  // =====================================================
  // REMOVE
  // =====================================================

  const handleRemove = (
    product: any
  ) => {

    removeFromCart(
      String(product.id),
      product.variantId ||
        "default"
    );

    setShowCartBar(
      true
    );
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <main className="min-h-screen bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] px-4 py-10">

        <div className="mx-auto max-w-5xl">

          <div className="h-7 w-32 animate-pulse rounded-lg bg-zinc-200" />

          <div className="mt-5 h-32 animate-pulse rounded-2xl bg-zinc-200" />

          <div className="mt-6 h-6 w-60 animate-pulse rounded-lg bg-zinc-200" />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-60 animate-pulse rounded-2xl bg-zinc-200"
                />
              )
            )}

          </div>

        </div>

      </main>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (
    error ||
    !offer
  ) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] px-4">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">

          <div className="text-5xl">
            🎁
          </div>

          <h1 className="mt-5 text-xl font-black">
            {error ||
              "Offer not found"}
          </h1>

          <Link
            href="/offers"
            className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-xs font-black text-white"
          >
            ← Back to Offers
          </Link>

        </div>

      </main>
    );
  }


  // =====================================================
  // MAIN
  // =====================================================

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] text-zinc-900">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

          <Link
            href="/offers"
            className="flex items-center gap-2"
          >

            <span className="text-2xl">
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


          {/* BACK */}

          <Link
            href="/offers"
            className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white"
          >
            ← Back
          </Link>

        </div>

      </header>


      {/* PAGE */}

      <section className="mx-auto max-w-5xl px-4 pb-32 pt-5">


        {/* SMALL OFFER HERO */}

        <div className="overflow-hidden rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 px-4 py-4 shadow-md">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">

              <span className="inline-flex rounded-full bg-black px-2.5 py-1 text-[9px] font-black text-white">
                {offerLabel}
              </span>

              <h1 className="mt-2 line-clamp-2 text-xl font-black md:text-2xl">
                {offer.title}
              </h1>

              {offer.description && (

                <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-black/70">
                  {offer.description}
                </p>

              )}

            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
              🎁
            </div>

          </div>

        </div>


        {/* PRODUCT GROUP */}

        <div className="mt-7">

          <div className="mb-4">

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500">
              Offer Collection
            </p>

            <h2 className="mt-1 text-xl font-black">
              Products in this offer
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Select any product to add it to your cart.
            </p>

          </div>


          {products.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">

              <div className="text-4xl">
                🛍️
              </div>

              <p className="mt-3 text-sm font-black">
                No products found
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

              {products.map(
                (product: any) => {

                  const variantId =
                    product.variantId ||
                    "default";

                  const quantity =
                    getItemQuantity(
                      String(
                        product.id
                      ),
                      variantId
                    );

                  const image =
                    product.image ||
                    product.images?.[0] ||
                    "";

                  const name =
                    product.name ||
                    product.title ||
                    product.productName ||
                    "Product";

                  const price =
                    Number(
                      product.price || 0
                    );

                  const mrp =
                    Number(
                      product.mrp || 0
                    );

                  const stock =
                    Math.max(
                      0,
                      Number(
                        product.stock || 0
                      )
                    );


                  return (

                    <article
                      key={String(
                        product.id
                      )}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >

                      {/* IMAGE */}

                      <Link
                        href={`/product/${product.id}`}
                      >

                        <div className="flex h-36 items-center justify-center bg-zinc-50 p-3">

                          {image ? (

                            <img
                              src={image}
                              alt={name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />

                          ) : (

                            <span className="text-4xl">
                              📦
                            </span>

                          )}

                        </div>

                      </Link>


                      {/* CONTENT */}

                      <div className="p-3">

                        <Link
                          href={`/product/${product.id}`}
                        >

                          <h3 className="line-clamp-2 min-h-[36px] text-xs font-black leading-4">
                            {name}
                          </h3>

                        </Link>


                        <div className="mt-2 flex items-center gap-2">

                          <span className="text-base font-black">
                            ₹{price}
                          </span>

                          {mrp > price && (

                            <span className="text-[10px] text-zinc-400 line-through">
                              ₹{mrp}
                            </span>

                          )}

                        </div>


                        {/* QUANTITY */}

                        {quantity > 0 ? (

                          <div className="mt-3 flex h-9 items-center justify-between overflow-hidden rounded-lg border border-green-500 bg-green-50">

                            <button
                              type="button"
                              onClick={() =>
                                handleRemove(
                                  product
                                )
                              }
                              className="flex h-full w-10 items-center justify-center bg-green-600 text-lg font-black text-white active:scale-95"
                            >
                              −
                            </button>

                            <span className="text-sm font-black text-green-700">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              disabled={
                                stock > 0 &&
                                quantity >=
                                  stock
                              }
                              onClick={() =>
                                handleAdd(
                                  product
                                )
                              }
                              className="flex h-full w-10 items-center justify-center bg-green-600 text-lg font-black text-white active:scale-95 disabled:bg-zinc-300"
                            >
                              +
                            </button>

                          </div>

                        ) : (

                          <button
                            type="button"
                            disabled={
                              stock <= 0
                            }
                            onClick={() =>
                              handleAdd(
                                product
                              )
                            }
                            className="mt-3 w-full rounded-lg bg-yellow-400 py-2.5 text-[10px] font-black text-black active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400"
                          >
                            {stock <= 0
                              ? "OUT OF STOCK"
                              : "ADD"}
                          </button>

                        )}

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </div>

      </section>


      {/* VIEW CART */}

      {showCartBar &&
        cartCount > 0 && (

          <div className="fixed inset-x-0 bottom-0 z-[10000] px-3 pb-3 md:pb-5">

            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl bg-black px-4 py-3 text-white shadow-2xl">

              <div>

                <p className="text-xs font-bold text-zinc-300">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}{" "}
                  in cart
                </p>

                <p className="mt-0.5 text-base font-black">
                  ₹{cartTotal}
                </p>

              </div>


              <Link
                href="/cart"
                className="rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black text-black active:scale-95"
              >
                🛒 View Cart
              </Link>

            </div>

          </div>

        )}

    </main>
  );
}