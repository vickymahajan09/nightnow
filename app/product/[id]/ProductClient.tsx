"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../../lib/firebase";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import ReviewSection from "../../components/ReviewSection";
import { getReturnPolicyMeta } from "../../lib/returnPolicy";

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

  brandName?: string;
  subcategory?: string;
  sku?: string;
  hsn?: string;
  gst?: number;
  weight?: string;
  unit?: string;
  packSize?: string;

  manufacturer?: string;
  countryOfOrigin?: string;
  shelfLife?: string;
  packagingType?: string;
  storage?: string;
  returnPolicy?: string;

  mfgDate?: string;
  expDate?: string;

  keyFeatures?: string;
  ingredients?: string;
  usageInstructions?: string;
  specifications?: string;
  tags?: string[];

  [key: string]: any;
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

export default function ProductClient() {
  const params = useParams();

  const productId =
    String(params?.id || "");

  const {
    addToCart,
    removeFromCart,
    isInCart,
    getItemQuantity,
  } = useCart();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

const [user, setUser] =
  useState<any>(null);

  const [error, setError] =
    useState("");

  const [activeImage, setActiveImage] =
    useState(0);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);

  const {
    isWished,
    toggle: toggleWishlistState,
  } = useWishlist();

  const liked = isWished(productId);

  // ===================================================
  // AUTH
  // Keep Firebase auth state in sync on the product page.
  // ===================================================
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // SWIPE
  // ===================================================

  const touchStartX =
    useRef<number | null>(null);

  // ===================================================
  // LOAD PRODUCT
  // ===================================================

  useEffect(() => {
    if (!productId) return;

    const loadProduct =
      async () => {
        try {
          setLoading(true);
          setError("");

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

          // ==========================================
          // DEFAULT VARIANT
          // ==========================================

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
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-16 text-black">

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
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-16 text-black">

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
  // IMAGES - MAX 5
  // ===================================================

  const productImages =
    Array.isArray(
      product.images
    ) &&
    product.images.length > 0
      ? product.images.slice(0, 5)
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
  // RETURN POLICY
  // ===================================================

  const returnPolicyMeta =
    product
      ? getReturnPolicyMeta(
          product.returnPolicy
        )
      : null;

  // ===================================================
  // NEXT IMAGE
  // ===================================================

  const nextImage = () => {
    setActiveImage(
      (current) =>
        current ===
        productImages.length - 1
          ? 0
          : current + 1
    );
  };

  // ===================================================
  // PREVIOUS IMAGE
  // ===================================================

  const previousImage = () => {
    setActiveImage(
      (current) =>
        current === 0
          ? productImages.length - 1
          : current - 1
    );
  };

  // ===================================================
  // LIKE
  // ===================================================

  const toggleLike = async () => {
  if (!user || !product) {
    alert(
      "Please log in to use the wishlist."
    );

    return;
  }

  try {
    await toggleWishlistState(
      product.id,
      product
    );
  } catch (error) {
    console.error(
      "Wishlist error:",
      error
    );

    alert(
      "Wishlist update failed."
    );
  }
};
  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAdd = () => {
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

  const handleRemove = () => {
    removeFromCart(
      product.id,
      currentVariantId
    );
  };

  // ===================================================
  // SELECT VARIANT
  // ===================================================

  const selectVariant = (
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
    <main className="min-h-screen bg-[#f7f8fa] pb-28 text-black">

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
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm"
          >
            🛒
          </Link>

        </div>

        {/* =========================================
            PRODUCT IMAGE + SWIPE
        ========================================== */}

        <section className="px-4">

          <div
            className="relative overflow-hidden rounded-3xl bg-white shadow-sm"
            onTouchStart={(e) => {
              touchStartX.current =
                e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {

              if (
                touchStartX.current ===
                  null ||
                productImages.length <=
                  1
              ) {
                return;
              }

              const endX =
                e.changedTouches[0]
                  .clientX;

              const difference =
                touchStartX.current -
                endX;

              if (
                difference > 50
              ) {
                nextImage();
              }

              if (
                difference < -50
              ) {
                previousImage();
              }

              touchStartX.current =
                null;
            }}
          >

            <div className="relative flex h-[380px] items-center justify-center bg-white">

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
                draggable={false}
                className="h-full w-full select-none object-contain"
              />

              {/* PREVIOUS */}

              {productImages.length >
                1 && (
                <button
                  type="button"
                  onClick={
                    previousImage
                  }
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl font-black text-zinc-700 shadow-md"
                >
                  ‹
                </button>
              )}

              {/* NEXT */}

              {productImages.length >
                1 && (
                <button
                  type="button"
                  onClick={
                    nextImage
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl font-black text-zinc-700 shadow-md"
                >
                  ›
                </button>
              )}

              {/* IMAGE COUNT */}

              {productImages.length >
                1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black text-white">
                  {activeImage + 1} /{" "}
                  {productImages.length}
                </div>
              )}

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

          {productImages.length >
            1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">

              {productImages.map(
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

          {/* SAVING */}

          {discount > 0 && (
            <p className="mt-1 text-xs font-black text-green-600">
              You save ₹
              {currentMrp -
                currentPrice}
            </p>
          )}

          {/* =======================================
              RETURN / REPLACEMENT POLICY BADGE
          ======================================== */}

          {returnPolicyMeta && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700">
              <span className="text-sm">
                {returnPolicyMeta.icon}
              </span>
              {returnPolicyMeta.label}
            </div>
          )}

          {/* =======================================
              MFG / EXP DATE
          ======================================== */}

          {(product.mfgDate ||
            product.expDate) && (
            <div className="mt-3 flex flex-wrap gap-2">

              {product.mfgDate && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700">
                  📅 Mfg Date:{" "}
                  {product.mfgDate}
                </span>
              )}

              {product.expDate && (
                <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700">
                  ⏳ Exp Date:{" "}
                  {product.expDate}
                </span>
              )}

            </div>
          )}

          {/* =======================================
              VARIANTS
          ======================================== */}

          {variants.length >
            0 && (
            <div className="mt-7">

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

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

                    const variantPrice =
                      Number(
                        variant.price ||
                          0
                      );

                    const variantMrp =
                      Number(
                        variant.mrp ||
                          0
                      );

                    const variantDiscount =
                      variantMrp >
                        variantPrice &&
                      variantMrp > 0
                        ? Math.round(
                            ((variantMrp -
                              variantPrice) /
                              variantMrp) *
                              100
                          )
                        : 0;

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
                        className={`min-w-[80px] rounded-xl border-2 px-4 py-3 text-sm font-black transition ${
                          isSelected
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-zinc-200 bg-white hover:border-yellow-300"
                        }`}
                      >

                        <div>
                          {label}
                        </div>

                        {variant.price !==
                          undefined && (
                          <div className="mt-1 text-xs text-zinc-500">
                            ₹
                            {variantPrice}
                          </div>
                        )}

                        {variantDiscount >
                          0 && (
                          <div className="mt-1 text-[9px] font-black text-green-600">
                            {variantDiscount}%
                            OFF
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
                  Volume:{" "}
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
              KEY FEATURES
          ======================================== */}

          {product.keyFeatures && (
            <div className="mt-7">

              <h3 className="text-lg font-black">
                Key Features
              </h3>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600">
                {product.keyFeatures
                  .split(/\r?\n|,/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, index) => (
                    <li key={`feature-${index}`}>
                      {line}
                    </li>
                  ))}
              </ul>

            </div>
          )}

          {/* =======================================
              PRODUCT INFORMATION
              (everything filled in the admin add-product
              form, shown here so nothing gets lost)
          ======================================== */}

          {(
            product.brandName ||
            product.subcategory ||
            product.sku ||
            product.hsn ||
            product.gst ||
            product.weight ||
            product.unit ||
            product.packSize ||
            product.manufacturer ||
            product.countryOfOrigin ||
            product.shelfLife ||
            product.packagingType ||
            product.storage ||
            product.mfgDate ||
            product.expDate
          ) && (
            <div className="mt-7">

              <h3 className="text-lg font-black">
                Product Information
              </h3>

              <div className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-100">

                {[
                  { label: "Brand", value: product.brandName },
                  { label: "Subcategory", value: product.subcategory },
                  { label: "SKU", value: product.sku },
                  { label: "HSN Code", value: product.hsn },
                  { label: "GST", value: product.gst ? `${product.gst}%` : "" },
                  {
                    label: "Weight / Pack",
                    value: [product.weight, product.unit, product.packSize]
                      .filter(Boolean)
                      .join(" • "),
                  },
                  { label: "Manufacturer", value: product.manufacturer },
                  { label: "Country of Origin", value: product.countryOfOrigin },
                  { label: "Shelf Life", value: product.shelfLife },
                  { label: "Packaging Type", value: product.packagingType },
                  { label: "Storage Instructions", value: product.storage },
                  { label: "Manufacturing Date", value: product.mfgDate },
                  { label: "Expiry Date", value: product.expDate },
                ]
                  .filter((row) => row.value)
                  .map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between gap-4 bg-white px-4 py-2.5 text-sm"
                    >
                      <span className="text-zinc-500">
                        {row.label}
                      </span>
                      <span className="text-right font-bold text-zinc-800">
                        {row.value}
                      </span>
                    </div>
                  ))}

              </div>

            </div>
          )}

          {/* =======================================
              INGREDIENTS
          ======================================== */}

          {product.ingredients && (
            <div className="mt-7">
              <h3 className="text-lg font-black">
                Ingredients
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                {product.ingredients}
              </p>
            </div>
          )}

          {/* =======================================
              USAGE INSTRUCTIONS
          ======================================== */}

          {product.usageInstructions && (
            <div className="mt-7">
              <h3 className="text-lg font-black">
                How to Use
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                {product.usageInstructions}
              </p>
            </div>
          )}

          {/* =======================================
              SPECIFICATIONS
          ======================================== */}

          {product.specifications && (
            <div className="mt-7">
              <h3 className="text-lg font-black">
                Specifications
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">
                {product.specifications}
              </p>
            </div>
          )}

          {/* =======================================
              TAGS
          ======================================== */}

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-7">
              <h3 className="text-lg font-black">
                Tags
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={`tag-${index}`}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* =======================================
              ADD / QUANTITY / VIEW CART
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

                {/* QUANTITY */}

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

                {/* ONLY ONE VIEW CART */}

                <Link
                  href="/cart"
                  className="flex h-14 flex-1 items-center justify-center rounded-xl bg-yellow-400 font-black text-black"
                >
                  🛒 View Cart →
                </Link>

              </div>

            )}

          </div>

        </section>

        <div className="px-4">
          <ReviewSection productId={product.id} />
        </div>

      </div>

    </main>
  );
}