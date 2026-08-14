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

const categories = [
  { name: "All", icon: "🛍️" },
  { name: "Medicines", icon: "💊" },
  { name: "Grocery", icon: "🛒" },
  { name: "Dairy", icon: "🥛" },
  { name: "Personal Care", icon: "🧴" },
];

export default function HomePage() {
  const { addToCart, cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [showNeed, setShowNeed] = useState(false);
  const [needText, setNeedText] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const data = await getProducts();

        const clean = Array.isArray(data)
          ? data.filter((item: any) => item?.active !== false)
          : [];

        setProducts(clean as Product[]);
      } catch (error) {
        console.error("Homepage product loading error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total: number, item: any) =>
        total + Number(item?.quantity || 1),
      0
    );
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const brand = String(product.brandName || "").toLowerCase();
      const category = String(product.category || "").toLowerCase();

      const matchesSearch =
        !text ||
        name.includes(text) ||
        brand.includes(text) ||
        category.includes(text);

      if (selectedCategory === "All") {
        return matchesSearch;
      }

      const selected = selectedCategory.toLowerCase();

      return (
        matchesSearch &&
        (category.includes(selected) ||
          name.includes(selected))
      );
    });
  }, [products, search, selectedCategory]);

  const topBrands = useMemo(() => {
    const map = new Map<string, Product>();

    products
      .filter(
        (product) =>
          product.topBrand === true &&
          product.active !== false
      )
      .forEach((product) => {
        const key =
          product.brandId ||
          product.brandName ||
          product.id;

        if (!map.has(key)) {
          map.set(key, product);
        }
      });

    return Array.from(map.values());
  }, [products]);

  const needSuggestions = useMemo(() => {
    const text = needText.trim().toLowerCase();

    if (!text) return [];

    return products
      .filter((product) => {
        const name = String(product.name || "").toLowerCase();
        const brand = String(product.brandName || "").toLowerCase();
        const description = String(
          product.description || ""
        ).toLowerCase();

        return (
          name.includes(text) ||
          brand.includes(text) ||
          description.includes(text)
        );
      })
      .slice(0, 6);
  }, [products, needText]);

  const getProductImage = (product: Product) => {
    if (product.image) return product.image;

    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

    return "";
  };

  const startVoiceSearch = () => {
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "Voice search is not supported in this browser."
      );
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      setSearch(
        event.results?.[0]?.[0]?.transcript || ""
      );
    };

    recognition.start();
  };

  const handleAddToCart = (product: Product) => {
    if (Number(product.stock || 0) <= 0) return;

    addToCart({
      ...product,
      quantity: 1,
    } as any);
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">

          {/* LOGO */}

          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-2">

              <div className="text-2xl">
                🌙
              </div>

              <div>
                <div className="text-xl font-black leading-none">
                  Night<span className="text-yellow-500">Now</span>
                </div>

                <div className="mt-1 text-[8px] font-bold tracking-[0.18em] text-zinc-400">
                  15 MIN DELIVERY
                </div>
              </div>

            </div>
          </Link>

          {/* LOCATION */}

          <button
            type="button"
            className="hidden min-w-0 text-left md:block"
            onClick={() =>
              alert("Location selector open karein.")
            }
          >
            <p className="text-[8px] font-medium text-zinc-400">
              DELIVER TO
            </p>

            <p className="truncate text-xs font-black">
              📍 Your Location ▼
            </p>
          </button>

          {/* HEADER SEARCH */}

          <div className="hidden min-w-0 flex-1 max-w-2xl md:flex">

            <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">

              <span className="text-zinc-400">
                🔍
              </span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search products..."
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mr-2 text-zinc-400"
                >
                  ×
                </button>
              )}

              {/* VOICE SEARCH */}

              <button
                type="button"
                onClick={startVoiceSearch}
                title="Voice Search"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm"
              >
                🎙️
              </button>

            </div>

          </div>

          {/* ORDERS */}

          <Link
            href="/orders"
            className="hidden rounded-xl bg-zinc-100 px-4 py-2 text-xs font-black sm:block"
          >
            📦 Orders
          </Link>

          {/* CART */}

          <Link
            href="/cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-white"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-black">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* LOGIN */}

          <Link
            href="/login"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
          >
            Login
          </Link>

        </div>

        {/* MOBILE SEARCH */}

        <div className="px-4 pb-3 md:hidden">

          <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">

            <span className="text-zinc-400">
              🔍
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products..."
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-xs outline-none"
            />

            <button
              type="button"
              onClick={startVoiceSearch}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400"
            >
              🎙️
            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="bg-gradient-to-b from-white via-white to-yellow-50/40">

        <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">

          <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">

            <div className="grid items-center gap-8 p-7 md:grid-cols-2 md:p-12">

              {/* LEFT */}

              <div>

                <p className="text-sm font-black tracking-[0.25em] text-yellow-600">
                  NIGHT NOW
                </p>

                <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                  आपकी जरूरत,
                  <br />
                  <span className="text-yellow-500">
                    हमारी जिम्मेदारी।
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500 md:text-base">
                  Groceries, snacks, beverages,
                  personal care और daily
                  essentials एक ही जगह।
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("products")
                        ?.scrollIntoView({
                          behavior: "smooth",
                        })
                    }
                    className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black shadow-sm transition hover:bg-yellow-500"
                  >
                    Shop Now →
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNeed(true)}
                    className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold"
                  >
                    आपकी जरूरत 🧠
                  </button>

                </div>

              </div>

              {/* RIGHT */}

              <div className="hidden md:block">

                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-yellow-100 via-white to-blue-50 p-8">

                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-200/50 blur-2xl" />

                  <p className="relative text-center text-xs font-black tracking-[0.2em] text-yellow-700">
                    FAST DELIVERY
                  </p>

                  <div className="relative mt-2 text-center">

                    <span className="text-8xl font-black text-yellow-500">
                      15
                    </span>

                    <span className="ml-2 text-xl font-black">
                      MIN
                    </span>

                  </div>

                  <div className="relative mt-4 text-center text-7xl">
                    🛵
                  </div>

                  <div className="relative mt-5 rounded-2xl bg-white/80 p-3 text-center shadow-sm">
                    <p className="text-xs font-bold text-zinc-500">
                      FAST • RELIABLE • NIGHT DELIVERY
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          SMART NEED
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4">

        <button
          type="button"
          onClick={() => setShowNeed(true)}
          className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-500 px-5 py-4 text-left shadow-sm transition hover:shadow-md"
        >

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl">
              🤖
            </div>

            <div>
              <p className="text-[9px] font-black text-zinc-700">
                NIGHT NOW SMART
              </p>

              <p className="text-sm font-black">
                आपकी जरूरत?
              </p>
            </div>

          </div>

          <span className="text-2xl font-black">
            +
          </span>

        </button>

      </section>

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 pt-10">

        <div>
          <h2 className="text-xl font-black">
            Shop by Category
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Choose what you need
          </p>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">

          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() =>
                setSelectedCategory(category.name)
              }
              className={[
                "min-w-[105px] rounded-2xl border p-4 text-center transition",
                selectedCategory === category.name
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-zinc-200 bg-white hover:border-yellow-300",
              ].join(" ")}
            >

              <div className="text-2xl">
                {category.icon}
              </div>

              <p className="mt-2 text-xs font-black">
                {category.name}
              </p>

            </button>
          ))}

        </div>

      </section>

      {/* =================================================
          TOP BRANDS
      ================================================= */}

      {topBrands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10">

          <div>
            <h2 className="text-xl font-black">
              ⭐ Top Brands
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              Popular brands on Night Now
            </p>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">

            {topBrands.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="min-w-[135px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-yellow-400"
              >

                <div className="flex h-20 items-center justify-center rounded-xl bg-zinc-50">

                  {getProductImage(product) ? (
                    <img
                      src={getProductImage(product)}
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
            ))}

          </div>

        </section>
      )}

      {/* =================================================
          BUY 1 GET 2
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 pt-10">

        <Link
          href="/offers/buy-1-get-2"
          className="flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-300 p-5 text-black shadow-sm"
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

      {/* =================================================
          POPULAR PRODUCTS
      ================================================= */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 pb-14 pt-10"
      >

        <div className="flex items-end justify-between">

          <div>
            <h2 className="text-xl font-black">
              Popular Products
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              {loading
                ? "Loading..."
                : `${filteredProducts.length} Products`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="text-xs font-black text-yellow-600"
          >
            View All →
          </button>

        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({ length: 8 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl bg-zinc-100"
                />
              )
            )}

          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-zinc-50 p-10 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h3 className="mt-4 font-black">
              Product nahi mila
            </h3>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
            >
              Clear Search
            </button>

          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {filteredProducts.map((product) => {
              const image = getProductImage(product);

              const stock = Number(product.stock || 0);
              const price = Number(product.price || 0);
              const mrp = Number(product.mrp || 0);

              const discount =
                mrp > price && mrp > 0
                  ? Math.round(
                      ((mrp - price) / mrp) * 100
                    )
                  : 0;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  <Link href={`/product/${product.id}`}>

                    <div className="relative flex h-40 items-center justify-center bg-zinc-50">

                      {image ? (
                        <img
                          src={image}
                          alt={product.name || "Product"}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">
                          No Image
                        </span>
                      )}

                      {discount > 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-1 text-[9px] font-black text-white">
                          {discount}% OFF
                        </span>
                      )}

                    </div>

                  </Link>

                  <div className="p-3">

                    <Link href={`/product/${product.id}`}>

                      <h3 className="line-clamp-2 min-h-[34px] text-sm font-black">
                        {product.name || "Product"}
                      </h3>

                    </Link>

                    {product.brandName && (
                      <p className="mt-1 truncate text-[10px] font-bold text-yellow-600">
                        {product.brandName}
                      </p>
                    )}

                    <div className="mt-2 flex items-end gap-2">

                      <p className="font-black text-green-600">
                        ₹{price}
                      </p>

                      {mrp > price && (
                        <p className="text-[10px] text-zinc-400 line-through">
                          ₹{mrp}
                        </p>
                      )}

                    </div>

                    {stock <= 0 ? (
                      <div className="mt-3 rounded-xl bg-zinc-100 py-2.5 text-center text-[10px] font-black text-zinc-400">
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(product)
                        }
                        className="mt-3 w-full rounded-xl bg-yellow-400 py-2.5 text-[10px] font-black text-black transition hover:bg-yellow-500"
                      >
                        🛒 Add to Cart
                      </button>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-zinc-200 bg-zinc-50">

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">

          <div>

            <div className="text-2xl font-black">
              Night<span className="text-yellow-500">Now</span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Fast and reliable delivery
              at your doorstep.
            </p>

          </div>

          <div>

            <h3 className="font-black">
              Quick Links
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-500">

              <Link href="/">Home</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/cart">Cart</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/offers/buy-1-get-2">
                Offers
              </Link>

            </div>

          </div>

          <div>

            <h3 className="font-black">
              Support
            </h3>

            <p className="mt-3 text-sm text-zinc-500">
              Need help with your order?
            </p>

            <Link
              href="/support"
              className="mt-4 inline-block rounded-xl border border-green-500 px-4 py-3 text-sm font-black text-green-600"
            >
              💬 Customer Support
            </Link>

          </div>

        </div>

        <div className="border-t border-zinc-200 px-4 py-5">

          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2 text-center">

            <div>
              🔒
              <p className="mt-1 text-[9px] font-bold text-zinc-400">
                Secure Payment
              </p>
            </div>

            <div>
              ⚡
              <p className="mt-1 text-[9px] font-bold text-zinc-400">
                Fast Delivery
              </p>
            </div>

            <div>
              ❤️
              <p className="mt-1 text-[9px] font-bold text-zinc-400">
                Customer First
              </p>
            </div>

          </div>

          <p className="mt-5 text-center text-[10px] text-zinc-400">
            © 2026 Night Now. All rights reserved.
          </p>

        </div>

      </footer>

      {/* =================================================
          AAPKI ZARURAT MODAL
      ================================================= */}

      {showNeed && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-3 pt-16 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-200 p-4">

              <div>
                <h2 className="font-black">
                  Aapki Zarurat?
                </h2>

                <p className="mt-1 text-[10px] text-zinc-400">
                  Jo chahiye type karein
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowNeed(false);
                  setNeedText("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl"
              >
                ×
              </button>

            </div>

            <div className="p-4">

              <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">

                <span className="text-zinc-400">
                  🔍
                </span>

                <input
                  autoFocus
                  value={needText}
                  onChange={(e) =>
                    setNeedText(e.target.value)
                  }
                  placeholder="Mujhe milk, paracetamol..."
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />

                {needText && (
                  <button
                    type="button"
                    onClick={() => setNeedText("")}
                    className="text-zinc-400"
                  >
                    ×
                  </button>
                )}

              </div>

              {needText &&
                needSuggestions.length > 0 && (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">

                    {needSuggestions.map((product) => (

                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3"
                      >

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white">

                          {getProductImage(product) ? (
                            <img
                              src={getProductImage(product)}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            "📦"
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-xs font-black">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs font-bold text-green-600">
                            ₹{product.price}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(product)
                          }
                          disabled={
                            Number(product.stock || 0) <= 0
                          }
                          className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black disabled:bg-zinc-200 disabled:text-zinc-400"
                        >
                          Add
                        </button>

                      </div>

                    ))}

                  </div>
                )}

              {needText &&
                needSuggestions.length === 0 && (
                  <div className="py-8 text-center text-sm text-zinc-400">
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