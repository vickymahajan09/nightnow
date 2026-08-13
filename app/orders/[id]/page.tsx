"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useCart } from "../../context/CartContext";


// =====================================================
// TYPES
// =====================================================

type ProductVariant = {
  id?: string;
  name?: string;

  size?: string;
  weight?: string;
  volume?: string;
  pack?: string;

  price?: number;
  mrp?: number;
  stock?: number;
};

type Product = {
  id: string;

  name?: string;

  description?: string;

  category?: string;

  price?: number;
  mrp?: number;

  stock?: number;

  image?: string;

  images?: string[];

  variants?: ProductVariant[];

  sizes?: ProductVariant[];
};


// =====================================================
// HELPERS
// =====================================================

function getVariantLabel(
  variant: ProductVariant
) {
  return (
    variant.name ||
    variant.size ||
    variant.weight ||
    variant.volume ||
    variant.pack ||
    "Option"
  );
}


// =====================================================
// PAGE
// =====================================================

export default function ProductPage() {

  const params = useParams();

  const productId =
    String(params?.id || "");


  const {
    cart,
    addToCart,
    removeFromCart,
    isInCart,
    getItemQuantity,
  } = useCart();


  const [product, setProduct] =
    useState<Product | null>(null);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [activeImage, setActiveImage] =
    useState(0);


  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);


  const [liked, setLiked] =
    useState(false);


  // ===================================================
  // LOAD PRODUCT
  // ===================================================

  useEffect(() => {

    if (!productId) return;


    const loadProduct =
      async () => {

        try {

          setLoading(true);

          const productRef =
            doc(
              db,
              "products",
              productId
            );


          const snapshot =
            await getDoc(
              productRef
            );


          if (!snapshot.exists()) {

            setError(
              "Product not found."
            );

            return;
          }


          const data =
            snapshot.data();


          const loadedProduct: Product = {
            id: snapshot.id,
            ...data,
          };


          setProduct(
            loadedProduct
          );


          // ------------------------------------------
          // DEFAULT VARIANT
          // ------------------------------------------

          const variants =
            Array.isArray(
              loadedProduct.variants
            )
              ? loadedProduct.variants
              : Array.isArray(
                  loadedProduct.sizes
                )
                ? loadedProduct.sizes
                : [];


          if (
            variants.length > 0
          ) {

            setSelectedVariant(
              variants[0]
            );
          }


          // ------------------------------------------
          // WISHLIST
          // ------------------------------------------

          try {

            const savedWishlist =
              JSON.parse(
                localStorage.getItem(
                  "nightnow_wishlist"
                ) || "[]"
              );


            setLiked(
              savedWishlist.includes(
                productId
              )
            );

          } catch {

            setLiked(false);

          }

        } catch (err) {

          console.error(
            "Product loading error:",
            err
          );

          setError(
            "Unable to load product."
          );

        } finally {

          setLoading(false);

        }

      };


    loadProduct();

  }, [productId]);


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">

        <div className="mx-auto max-w-xl text-center">

          <div className="text-5xl">
            ⏳
          </div>

          <p className="mt-4 font-bold">
            Loading product...
          </p>

        </div>

      </main>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    error ||
    !product
  ) {

    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">

        <div className="mx-auto max-w-md text-center">

          <div className="text-6xl">
            😕
          </div>

          <h1 className="mt-5 text-2xl font-black">
            {error ||
              "Product not found"}
          </h1>

          <Link href="/">
            <button className="mt-6 rounded-xl bg-yellow-400 px-7 py-3 font-black">
              ← Back to Shopping
            </button>
          </Link>

        </div>

      </main>
    );
  }


  // ===================================================
  // IMAGES
  // ===================================================

  const productImages =
    Array.isArray(
      product.images
    ) &&
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ["/no-image.png"];


  // ===================================================
  // VARIANTS
  // ===================================================

  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : Array.isArray(
          product.sizes
        )
        ? product.sizes
        : [];


  // ===================================================
  // CURRENT PRICE
  // ===================================================

  const currentPrice =
    Number(
      selectedVariant?.price ??
      product.price ??
      0
    );


  // ===================================================
  // CURRENT MRP
  // ===================================================

  const currentMrp =
    Number(
      selectedVariant?.mrp ??
      product.mrp ??
      0
    );


  // ===================================================
  // CURRENT STOCK
  // ===================================================

  const currentStock =
    Number(
      selectedVariant?.stock ??
      product.stock ??
      0
    );


  // ===================================================
  // VARIANT ID
  // ===================================================

  const currentVariantId =
    selectedVariant?.id ||
    getVariantLabel(
      selectedVariant || {}
    );


  // ===================================================
  // CART QUANTITY
  // ===================================================

  const quantity =
    getItemQuantity(
      product.id,
      currentVariantId
    );


  const inCart =
    isInCart(
      product.id,
      currentVariantId
    );


  // ===================================================
  // DISCOUNT
  // ===================================================

  const discount =
    currentMrp > currentPrice &&
    currentMrp > 0
      ? Math.round(
          ((currentMrp -
            currentPrice) /
            currentMrp) *
            100
        )
      : 0;


  // ===================================================
  // LIKE
  // ===================================================

  const toggleLike =
    () => {

      try {

        const wishlist =
          JSON.parse(
            localStorage.getItem(
              "nightnow_wishlist"
            ) || "[]"
          );


        const index =
          wishlist.indexOf(
            product.id
          );


        if (index === -1) {

          wishlist.push(
            product.id
          );

          setLiked(true);

        } else {

          wishlist.splice(
            index,
            1
          );

          setLiked(false);

        }


        localStorage.setItem(
          "nightnow_wishlist",
          JSON.stringify(
            wishlist
          )
        );

      } catch (err) {

        console.error(
          "Wishlist error:",
          err
        );

      }

    };


  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAdd =
    () => {

      if (
        currentStock > 0 &&
        quantity >= currentStock
      ) {
        return;
      }


      addToCart({

        ...product,

        id: product.id,

        price:
          currentPrice,

        mrp:
          currentMrp,

        stock:
          currentStock,

        quantity: 1,

        variantId:
          currentVariantId,

        variantName:
          selectedVariant
            ? getVariantLabel(
                selectedVariant
              )
            : undefined,

        size:
          selectedVariant?.size,

        weight:
          selectedVariant?.weight,

        volume:
          selectedVariant?.volume,

        pack:
          selectedVariant?.pack,

      });

    };


  // ===================================================
  // REMOVE PRODUCT
  // ===================================================

  const handleRemove =
    () => {

      removeFromCart(
        product.id,
        currentVariantId
      );

    };


  // ===================================================
  // VARIANT SELECT
  // ===================================================

  const selectVariant =
    (
      variant: ProductVariant
    ) => {

      setSelectedVariant(
        variant
      );

      setActiveImage(0);

    };


  // ===================================================
  // UI
  // ===================================================

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-black">

      <div className="mx-auto max-w-6xl">

        {/* =========================================
            TOP BAR
        ========================================== */}

        <div className="flex items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm"
          >
            ←
          </Link>


          <h1 className="text-base font-black">
            Product Details
          </h1>


          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm"
          >
            🛒
          </Link>

        </div>


        {/* =========================================
            PRODUCT IMAGE
        ========================================== */}

        <section className="px-4">

          <div className="relative overflow-hidden rounded-3xl bg-white">

            <div className="flex h-[380px] items-center justify-center bg-zinc-100">

              <img
                src={
                  productImages[
                    activeImage
                  ]
                }
                alt={
                  product.name ||
                  "Product"
                }
                className="h-full w-full object-contain"
              />

            </div>


            {/* LIKE */}

            <button
              type="button"
              onClick={
                toggleLike
              }
              className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-md ${
                liked
                  ? "text-red-500"
                  : "text-zinc-700"
              }`}
            >
              {liked
                ? "♥"
                : "♡"}
            </button>


            {/* DISCOUNT */}

            {discount > 0 && (
              <div className="absolute left-4 top-4 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-black text-white">
                {discount}% OFF
              </div>
            )}

          </div>


          {/* =======================================
              IMAGE THUMBNAILS
          ======================================== */}

          {productImages.length > 1 && (

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">

              {productImages
                .slice(0, 5)
                .map(
                  (
                    image,
                    index
                  ) => (

                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          index
                        )
                      }
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                        activeImage ===
                        index
                          ? "border-yellow-400"
                          : "border-transparent"
                      }`}
                    >

                      <img
                        src={image}
                        alt={`Product image ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />

                    </button>

                  )
                )}

            </div>

          )}

        </section>


        {/* =========================================
            PRODUCT INFO
        ========================================== */}

        <section className="mt-5 rounded-t-3xl bg-white px-5 py-6">

          {/* CATEGORY */}

          {product.category && (
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              {product.category}
            </p>
          )}


          {/* NAME */}

          <h2 className="mt-2 text-2xl font-black leading-tight">
            {product.name ||
              "Product"}
          </h2>


          {/* PRICE */}

          <div className="mt-4 flex items-center gap-3">

            <span className="text-3xl font-black text-green-600">
              ₹{currentPrice}
            </span>


            {currentMrp >
              currentPrice && (
              <span className="text-sm text-zinc-400 line-through">
                ₹{currentMrp}
              </span>
            )}

          </div>


          {/* =======================================
              VARIANTS
          ======================================== */}

          {variants.length > 0 && (

            <div className="mt-7">

              <div className="mb-3 flex items-center justify-between">

                <h3 className="text-base font-black">
                  Select Option
                </h3>

                {selectedVariant && (
                  <span className="text-xs font-bold text-zinc-500">
                    Selected:{" "}
                    {getVariantLabel(
                      selectedVariant
                    )}
                  </span>
                )}

              </div>


              <div className="flex flex-wrap gap-2">

                {variants.map(
                  (
                    variant,
                    index
                  ) => {

                    const label =
                      getVariantLabel(
                        variant
                      );


                    const isSelected =
                      selectedVariant ===
                        variant ||
                      selectedVariant?.id ===
                        variant.id;


                    return (

                      <button
                        key={
                          variant.id ||
                          `${label}-${index}`
                        }
                        type="button"
                        onClick={() =>
                          selectVariant(
                            variant
                          )
                        }
                        className={`min-w-[70px] rounded-xl border-2 px-4 py-3 text-sm font-black ${
                          isSelected
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-zinc-200 bg-white"
                        }`}
                      >

                        <div>
                          {label}
                        </div>

                        {variant.price !==
                          undefined && (
                          <div className="mt-1 text-xs text-zinc-500">
                            ₹
                            {Number(
                              variant.price
                            )}
                          </div>
                        )}

                      </button>

                    );

                  }
                )}

              </div>

            </div>

          )}


          {/* =======================================
              CURRENT VARIANT DETAILS
          ======================================== */}

          {selectedVariant && (

            <div className="mt-5 flex flex-wrap gap-2">

              {selectedVariant.size && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold">
                  Size:{" "}
                  {selectedVariant.size}
                </span>
              )}

              {selectedVariant.weight && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold">
                  Weight:{" "}
                  {selectedVariant.weight}
                </span>
              )}

              {selectedVariant.volume && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold">
                  {selectedVariant.volume}
                </span>
              )}

              {selectedVariant.pack && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold">
                  Pack:{" "}
                  {selectedVariant.pack}
                </span>
              )}

            </div>

          )}


          {/* =======================================
              STOCK
          ======================================== */}

          <div className="mt-5">

            {currentStock > 0 ? (

              <p className="text-sm font-bold text-green-600">
                ✓ In Stock
              </p>

            ) : (

              <p className="text-sm font-bold text-red-500">
                Out of Stock
              </p>

            )}

          </div>


          {/* =======================================
              DESCRIPTION
          ======================================== */}

          {product.description && (

            <div className="mt-7">

              <h3 className="text-lg font-black">
                About this product
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                {product.description}
              </p>

            </div>

          )}


          {/* =======================================
              ADD / QUANTITY
          ======================================== */}

          <div className="mt-7">

            {!inCart ? (

              <button
                type="button"
                disabled={
                  currentStock === 0
                }
                onClick={
                  handleAdd
                }
                className="w-full rounded-xl bg-yellow-400 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                {currentStock === 0
                  ? "Out of Stock"
                  : "ADD TO CART"}
              </button>

            ) : (

              <div className="flex items-center gap-3">

                <div className="flex h-14 flex-1 items-center justify-center overflow-hidden rounded-xl border border-green-600 bg-white">

                  <button
                    type="button"
                    onClick={
                      handleRemove
                    }
                    className="h-full w-14 bg-green-600 text-xl font-black text-white"
                  >
                    −
                  </button>


                  <span className="flex-1 text-center text-lg font-black">
                    {quantity}
                  </span>


                  <button
                    type="button"
                    disabled={
                      currentStock > 0 &&
                      quantity >=
                        currentStock
                    }
                    onClick={
                      handleAdd
                    }
                    className="h-full w-14 bg-green-600 text-xl font-black text-white disabled:opacity-40"
                  >
                    +
                  </button>

                </div>


                <Link
                  href="/cart"
                  className="flex h-14 flex-1 items-center justify-center rounded-xl bg-yellow-400 font-black"
                >
                  View Cart →
                </Link>

              </div>

            )}

          </div>


          {/* =======================================
              CART QUICK LINK
          ======================================== */}

          {inCart && (

            <Link
              href="/cart"
              className="mt-3 block text-center text-sm font-bold text-zinc-500"
            >
              🛒 View your cart
            </Link>

          )}

        </section>

      </div>

    </main>
  );
}