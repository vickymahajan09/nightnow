"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { getProducts } from "./services/productService";
import { useCart } from "./context/CartContext";

type Product = {
  id: string;
  name?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  image?: string;
  images?: string[];
  category?: string;
  brandName?: string;
  brandId?: string;
  topBrand?: boolean;
  active?: boolean;
  description?: string;
};

export default function HomePage() {
  const {
    addToCart,
    cart,
  } = useCart();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [showNeed, setShowNeed] =
    useState(false);

  const [needText, setNeedText] =
    useState("");

  const [theme, setTheme] =
    useState("dark");

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const data =
          await getProducts();

        const clean =
          Array.isArray(data)
            ? data.filter(
                (item: any) =>
                  item?.active !== false
              )
            : [];

        setProducts(
          clean as Product[]
        );
      } catch (error) {
        console.error(
          "Homepage product loading error:",
          error
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ==========================================
  // CART COUNT
  // ==========================================

  const cartCount = useMemo(() => {
    return cart.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        Number(
          item?.quantity || 1
        ),
      0
    );
  }, [cart]);

  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = [
    {
      name: "All",
      icon: "🛍️",
    },
    {
      name: "Medicines",
      icon: "💊",
    },
    {
      name: "Grocery",
      icon: "🛒",
    },
    {
      name: "Dairy",
      icon: "🥛",
    },
    {
      name: "Personal Care",
      icon: "🧴",
    },
  ];

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const brand =
            String(
              product.brandName ||
                ""
            ).toLowerCase();

          const category =
            String(
              product.category ||
                ""
            ).toLowerCase();

          const matchesSearch =
            !text ||
            name.includes(text) ||
            brand.includes(text) ||
            category.includes(text);

          if (
            selectedCategory ===
            "All"
          ) {
            return matchesSearch;
          }

          const selected =
            selectedCategory.toLowerCase();

          const categoryMatch =
            category.includes(
              selected
            );

          const nameMatch =
            name.includes(
              selected
            );

          return (
            matchesSearch &&
            (categoryMatch ||
              nameMatch)
          );
        }
      );
    }, [
      products,
      search,
      selectedCategory,
    ]);

  // ==========================================
  // TOP BRANDS
  // ==========================================

  const topBrands =
    useMemo(() => {
      const map =
        new Map<
          string,
          Product
        >();

      products
        .filter(
          (product) =>
            product.topBrand ===
              true &&
            product.active !==
              false
        )
        .forEach((product) => {
          const key =
            product.brandId ||
            product.brandName ||
            product.name ||
            product.id;

          if (!map.has(key)) {
            map.set(
              key,
              product
            );
          }
        });

      return Array.from(
        map.values()
      );
    }, [products]);

  // ==========================================
  // NEED SEARCH
  // ==========================================

  const needSuggestions =
    useMemo(() => {
      const text =
        needText
          .trim()
          .toLowerCase();

      if (!text) {
        return [];
      }

      return products
        .filter((product) => {
          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const brand =
            String(
              product.brandName ||
                ""
            ).toLowerCase();

          const description =
            String(
              product.description ||
                ""
            ).toLowerCase();

          return (
            name.includes(text) ||
            brand.includes(text) ||
            description.includes(
              text
            )
          );
        })
        .slice(0, 6);
    }, [
      products,
      needText,
    ]);

  // ==========================================
  // ADD CART
  // ==========================================

  const handleAddToCart = (
    product: Product
  ) => {
    if (
      Number(
        product.stock || 0
      ) <= 0
    ) {
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
    } as any);
  };

  // ==========================================
  // IMAGE
  // ==========================================

  const getProductImage = (
    product: Product
  ) => {
    if (
      product.image
    ) {
      return product.image;
    }

    if (
      Array.isArray(
        product.images
      ) &&
      product.images.length
    ) {
      return product.images[0];
    }

    return "";
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* =====================================
          HEADER
      ====================================== */}

      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3">

          {/* LOGO */}

          <Link
            href="/"
            className="shrink-0"
          >
            <div className="flex items-center gap-2">

              <div className="text-2xl">
                🌙
              </div>

              <div>
                <div className="text-xl font-black leading-none">
                  Night
                  <span className="text-yellow-400">
                    Now
                  </span>
                </div>

                <div className="mt-1 text-[8px] font-bold tracking-widest text-zinc-500">
                  FAST DELIVERY
                </div>
              </div>

            </div>
          </Link>

          {/* LOCATION */}

          <button
            type="button"
            className="hidden min-w-0 flex-1 text-left sm:block"
            onClick={() => {
              alert(
                "Location selector header me available hai."
              );
            }}
          >
            <p className="text-[9px] font-bold text-zinc-500">
              DELIVER TO
            </p>

            <p className="truncate text-xs font-black">
              📍 Select delivery location
            </p>
          </button>

          {/* SEARCH */}

          <div className="hidden min-w-0 flex-1 md:block">

            <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-900 px-3">

              <span className="text-zinc-500">
                🔍
              </span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search medicines, grocery, dairy..."
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-zinc-600"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-zinc-500"
                >
                  ×
                </button>
              )}

              {/* VOICE */}

              <button
                type="button"
                onClick={() => {
                  const Recognition =
                    (window as any)
                      .SpeechRecognition ||
                    (window as any)
                      .webkitSpeechRecognition;

                  if (
                    !Recognition
                  ) {
                    alert(
                      "Voice search browser me supported nahi hai."
                    );
                    return;
                  }

                  const recognition =
                    new Recognition();

                  recognition.lang =
                    "en-IN";

                  recognition.onresult =
                    (
                      event: any
                    ) => {
                      setSearch(
                        event.results?.[0]?.[0]
                          ?.transcript ||
                          ""
                      );
                    };

                  recognition.start();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-black"
              >
                🎙️
              </button>

            </div>

          </div>

          {/* ORDERS */}

          <Link
            href="/orders"
            className="hidden rounded-xl px-2 py-2 text-xs font-black text-zinc-300 hover:bg-zinc-900 sm:block"
          >
            📦 Orders
          </Link>

          {/* CART */}

          <Link
            href="/cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-lg text-black"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>

          {/* LOGIN */}

          <Link
            href="/login"
            className="hidden rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black sm:block"
          >
            Login
          </Link>

        </div>

        {/* MOBILE SEARCH */}

        <div className="px-3 pb-3 md:hidden">

          <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-900 px-3">

            <span>
              🔍
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search medicines, grocery, dairy..."
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold outline-none placeholder:text-zinc-600"
            />

            <button
              type="button"
              onClick={() => {
                const Recognition =
                  (window as any)
                    .SpeechRecognition ||
                  (window as any)
                    .webkitSpeechRecognition;

                if (
                  !Recognition
                ) {
                  alert(
                    "Voice search browser me supported nahi hai."
                  );
                  return;
                }

                const recognition =
                  new Recognition();

                recognition.lang =
                  "en-IN";

                recognition.onresult =
                  (
                    event: any
                  ) => {
                    setSearch(
                      event.results?.[0]?.[0]
                        ?.transcript ||
                        ""
                    );
                  };

                recognition.start();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-black"
            >
              🎙️
            </button>

          </div>

        </div>

      </header>

      {/* =====================================
          HERO
      ====================================== */}

      <section className="mx-auto max-w-7xl px-3 pt-5">

        <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950">

          <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-10">

            <div>

              <span className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-400">
                ⚡ 15 Minute Delivery
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                सब कुछ जो आपको चाहिए,
                <br />
                <span className="text-yellow-400">
                  15 मिनट में,
                </span>
                <br />
                आपके दरवाजे पर।
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 md:text-base">
                दवाइयाँ, किराना, डेयरी और
                रोजमर्रा की जरूरतें —
                Night Now आपके साथ हर वक्त।
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(
                        "products"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      })
                  }
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black"
                >
                  🛍️ Start Shopping
                </button>

                <Link
                  href="/orders"
                  className="rounded-2xl bg-zinc-800 px-5 py-3 text-sm font-black"
                >
                  📦 My Orders
                </Link>

              </div>

              <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4">
                <p className="text-sm font-bold text-zinc-200">
                  “रात हो या दिन,
                  आपकी जरूरत”
                </p>

                <p className="mt-1 text-sm font-black text-yellow-400">
                  हमारी ज़िम्मेदारी।
                </p>
              </div>

            </div>

            {/* DELIVERY PANEL */}

            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-6 text-center">

              <div className="text-2xl font-black">
                Night
                <span className="text-yellow-400">
                  Now
                </span>
              </div>

              <div className="mt-2">

                <span className="text-7xl font-black text-yellow-400">
                  15
                </span>

                <span className="ml-2 text-xl font-black">
                  Minute
                  <br />
                  Delivery
                </span>

              </div>

              <div className="mt-5 text-7xl">
                🛵
              </div>

              <div className="mt-3 rounded-2xl bg-black p-3">
                <p className="text-xs font-bold text-zinc-500">
                  FAST • RELIABLE • NIGHT DELIVERY
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================
          QUICK SEARCH / NEED
      ====================================== */}

      <section className="mx-auto max-w-7xl px-3 pt-5">

        <button
          type="button"
          onClick={() =>
            setShowNeed(true)
          }
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition hover:border-yellow-400"
        >

          <div>
            <p className="text-[9px] font-bold text-zinc-500">
              AAPKI ZARURAT?
            </p>

            <p className="mt-1 text-sm font-black">
              Jo chahiye bas bataiye...
            </p>
          </div>

          <span className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-black text-black">
            Find
          </span>

        </button>

      </section>

      {/* =====================================
          PROMO
      ====================================== */}

      <section className="mx-auto max-w-7xl px-3 pt-5">

        <div className="flex items-center justify-between gap-4 rounded-3xl bg-yellow-400 p-5 text-black">

          <div>

            <p className="text-xs font-black">
              NIGHT NOW OFFER
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Free Delivery
            </h2>

            <p className="mt-1 text-xs font-bold">
              On orders above ₹299
            </p>

          </div>

          <div className="hidden rounded-2xl bg-white px-5 py-3 text-center sm:block">
            <div className="text-xl">
              ⚡
            </div>

            <p className="text-xs font-black">
              15 Min
            </p>

            <p className="text-[9px] text-zinc-500">
              Lightning Fast
            </p>
          </div>

        </div>

      </section>

      {/* =====================================
          CATEGORIES
      ====================================== */}

      <section className="mx-auto max-w-7xl px-3 pt-8">

        <div className="flex items-end justify-between">

          <div>
            <h2 className="text-xl font-black">
              Shop by Category
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Choose what you need
            </p>
          </div>

        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

          {categories.map(
            (category) => (
              <button
                key={
                  category.name
                }
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
                className={[
                  "min-w-[105px] rounded-2xl border p-4 text-center transition",
                  selectedCategory ===
                    category.name
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-zinc-800 bg-zinc-900 text-white",
                ].join(" ")}
              >

                <div className="text-2xl">
                  {category.icon}
                </div>

                <p className="mt-2 text-xs font-black">
                  {
                    category.name
                  }
                </p>

              </button>
            )
          )}

        </div>

      </section>

      {/* =====================================
          TOP BRANDS
      ====================================== */}

      {topBrands.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 pt-8">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-xl font-black">
                ⭐ Top Brands
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Popular brands on Night Now
              </p>
            </div>

          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

            {topBrands.map(
              (product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="min-w-[130px] rounded-2xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-yellow-400"
                >

                  <div className="flex h-20 items-center justify-center rounded-xl bg-white">

                    {getProductImage(
                      product
                    ) ? (
                      <img
                        src={getProductImage(
                          product
                        )}
                        alt={
                          product.brandName ||
                          product.name ||
                          "Brand"
                        }
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-2xl">
                        🏷️
                      </span>
                    )}

                  </div>

                  <p className="mt-3 truncate text-center text-xs font-black">
                    {product.brandName ||
                      product.name ||
                      "Brand"}
                  </p>

                </Link>
              )
            )}

          </div>

        </section>
      )}

      {/* =====================================
          BUY 1 GET 2
      ====================================== */}

      <section className="mx-auto max-w-7xl px-3 pt-8">

        <Link
          href="/offers/buy-1-get-2"
          className="flex items-center justify-between rounded-3xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400 to-yellow-300 p-5 text-black"
        >

          <div>

            <p className="text-[10px] font-black">
              SPECIAL OFFER
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Buy 1 Get 2 🎁
            </h2>

            <p className="mt-1 text-xs font-bold">
              Special selected products
            </p>

          </div>

          <span className="rounded-xl bg-black px-4 py-3 text-xs font-black text-white">
            View Offers →
          </span>

        </Link>

      </section>

      {/* =====================================
          PRODUCTS
      ====================================== */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-3 pb-12 pt-8"
      >

        <div className="flex items-end justify-between">

          <div>
            <h2 className="text-xl font-black">
              Popular Products
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {loading
                ? "Loading..."
                : `${filteredProducts.length} Products`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory(
                "All"
              );
            }}
            className="text-xs font-black text-yellow-400"
          >
            View All →
          </button>

        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({
              length: 8,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl bg-zinc-900"
                />
              )
            )}

          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="mt-5 rounded-3xl bg-zinc-900 p-10 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h3 className="mt-4 font-black">
              Product nahi mila
            </h3>

            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory(
                  "All"
                );
              }}
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black text-black"
            >
              Clear Search
            </button>

          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {filteredProducts.map(
              (product) => {
                const image =
                  getProductImage(
                    product
                  );

                const stock =
                  Number(
                    product.stock ||
                      0
                  );

                const price =
                  Number(
                    product.price ||
                      0
                  );

                const mrp =
                  Number(
                    product.mrp ||
                      0
                  );

                const discount =
                  mrp > price &&
                  mrp > 0
                    ? Math.round(
                        ((mrp -
                          price) /
                          mrp) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                  >

                    {/* IMAGE */}

                    <Link
                      href={`/product/${product.id}`}
                    >
                      <div className="relative flex h-40 items-center justify-center bg-white">

                        {image ? (
                          <img
                            src={image}
                            alt={
                              product.name ||
                              "Product"
                            }
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <span className="text-zinc-400">
                            No Image
                          </span>
                        )}

                        {discount >
                          0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-1 text-[9px] font-black text-white">
                            {discount}%
                            OFF
                          </span>
                        )}

                      </div>
                    </Link>

                    {/* CONTENT */}

                    <div className="p-3">

                      <Link
                        href={`/product/${product.id}`}
                      >
                        <h3 className="line-clamp-2 min-h-[36px] text-sm font-black">
                          {product.name ||
                            "Product"}
                        </h3>
                      </Link>

                      {product.brandName && (
                        <p className="mt-1 truncate text-[10px] font-bold text-yellow-400">
                          {
                            product.brandName
                          }
                        </p>
                      )}

                      <div className="mt-2 flex items-end gap-2">

                        <p className="font-black text-green-400">
                          ₹{price}
                        </p>

                        {mrp >
                          price && (
                          <p className="text-[10px] text-zinc-600 line-through">
                            ₹{mrp}
                          </p>
                        )}

                      </div>

                      {stock <=
                      0 ? (
                        <div className="mt-3 rounded-xl bg-zinc-800 py-2.5 text-center text-[10px] font-black text-zinc-500">
                          Out of Stock
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(
                              product
                            )
                          }
                          className="mt-3 w-full rounded-xl bg-yellow-400 py-2.5 text-[10px] font-black text-black"
                        >
                          🛒 Add to Cart
                        </button>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-zinc-800 bg-zinc-950">

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">

          <div>

            <div className="text-2xl font-black">
              Night
              <span className="text-yellow-400">
                Now
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Fast and reliable delivery
              at your doorstep.
            </p>

            <div className="mt-4 flex gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
                💬
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
                📷
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
                👍
              </span>
            </div>

          </div>

          <div>

            <h3 className="font-black text-yellow-400">
              Quick Links
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-500">

              <Link href="/">
                Home
              </Link>

              <Link href="/orders">
                Orders
              </Link>

              <Link href="/cart">
                Cart
              </Link>

              <Link href="/profile">
                Profile
              </Link>

              <Link href="/wishlist">
                Wishlist
              </Link>

              <Link href="/offers/buy-1-get-2">
                Offers
              </Link>

            </div>

          </div>

          <div>

            <h3 className="font-black text-yellow-400">
              Support
            </h3>

            <p className="mt-4 text-sm text-zinc-500">
              Need help with your order?
            </p>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Night Now Support"
                )
              }
              className="mt-4 rounded-xl border border-green-500 px-4 py-3 text-sm font-black text-green-400"
            >
              💬 WhatsApp Support
            </button>

          </div>

        </div>

        <div className="border-t border-zinc-800 px-4 py-5">

          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2 text-center">

            <div>
              <div>
                🔒
              </div>
              <p className="mt-1 text-[9px] font-bold text-zinc-500">
                Secure Payment
              </p>
            </div>

            <div>
              <div>
                ⚡
              </div>
              <p className="mt-1 text-[9px] font-bold text-zinc-500">
                On-time Delivery
              </p>
            </div>

            <div>
              <div>
                ❤️
              </div>
              <p className="mt-1 text-[9px] font-bold text-zinc-500">
                Customer First
              </p>
            </div>

          </div>

          <p className="mt-5 text-center text-[10px] text-zinc-700">
            © 2026 Night Now. All rights reserved.
          </p>

        </div>

      </footer>

      {/* =====================================
          AAPKI ZARURAT MODAL
      ====================================== */}

      {showNeed && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 px-3 pt-16 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-800 p-4">

              <div>
                <h2 className="font-black">
                  Aapki Zarurat?
                </h2>

                <p className="mt-1 text-[10px] text-zinc-500">
                  Jo chahiye type karein
                </p>
              </div>

              <button
                onClick={() =>
                  setShowNeed(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xl"
              >
                ×
              </button>

            </div>

            <div className="p-4">

              {/* ONLY CUSTOMER NEED SEARCH */}

              <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-900 px-3">

                <span>
                  🔍
                </span>

                <input
                  autoFocus
                  value={needText}
                  onChange={(e) =>
                    setNeedText(
                      e.target.value
                    )
                  }
                  placeholder="Mujhe milk, paracetamol..."
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />

                {needText && (
                  <button
                    onClick={() =>
                      setNeedText("")
                    }
                    className="text-zinc-500"
                  >
                    ×
                  </button>
                )}

              </div>

              {/* SUGGESTIONS */}

              {needText &&
                needSuggestions.length >
                  0 && (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">

                    {needSuggestions.map(
                      (
                        product
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3"
                        >

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white">

                            {getProductImage(
                              product
                            ) ? (
                              <img
                                src={getProductImage(
                                  product
                                )}
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <span>
                                📦
                              </span>
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-xs font-black">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 text-xs font-bold text-green-400">
                              ₹
                              {
                                product.price
                              }
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              handleAddToCart(
                                product
                              )
                            }
                            disabled={
                              Number(
                                product.stock ||
                                  0
                              ) <=
                              0
                            }
                            className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black text-black disabled:bg-zinc-800 disabled:text-zinc-600"
                          >
                            Add
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              {needText &&
                needSuggestions.length ===
                  0 && (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    Relevant product nahi mila.
                  </div>
                )}

              {!needText && (
                <div className="py-8 text-center">

                  <div className="text-4xl">
                    🔎
                  </div>

                  <p className="mt-3 text-sm font-bold text-zinc-400">
                    Apni zarurat type karein
                  </p>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}