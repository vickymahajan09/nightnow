"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { getProducts, type Product } from "./services/productService";
import { getCategories, type Category } from "./services/categoryService";
import { getOffers, type Offer } from "./services/offerService";
import { useCart } from "./context/CartContext";
import { useWishlist } from "./context/WishlistContext";
import LocationSelector from "./components/LocationSelector";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ShoppingCart, User, MapPin, Search, X } from "lucide-react";

// =====================================================
// STATIC PROMO BANNER SLIDES
// (Bold, colourful, quick-commerce style. Swap these
// for real offer images any time from /admin later.)
// =====================================================

const PROMO_SLIDES = [
  {
    id: "slide-1",
    title: "Delivery in\n15 minutes flat",
    sub: "Fast • Reliable • Night Delivery",
    from: "from-yellow-400",
    via: "via-yellow-300",
    to: "to-orange-300",
    text: "text-black",
  },
  {
    id: "slide-2",
    title: "First order\nFREE delivery",
    sub: "Special offer for new customers",
    from: "from-emerald-400",
    via: "via-green-400",
    to: "to-teal-300",
    text: "text-black",
  },
  {
    id: "slide-3",
    title: "New deals\nevery day",
    sub: "Savings on grocery, snacks & daily essentials",
    from: "from-fuchsia-500",
    via: "via-purple-500",
    to: "to-indigo-500",
    text: "text-white",
  },
  {
    id: "slide-4",
    title: "Day or night\nwe've got you",
    sub: "24x7 fresh groceries, right to your door",
    from: "from-sky-400",
    via: "via-blue-400",
    to: "to-indigo-400",
    text: "text-white",
  },
];

const OFFER_GRADIENTS = [
  { from: "from-yellow-400", via: "via-yellow-300", to: "to-orange-300", text: "text-black" },
  { from: "from-emerald-400", via: "via-green-400", to: "to-teal-300", text: "text-black" },
  { from: "from-fuchsia-500", via: "via-purple-500", to: "to-indigo-500", text: "text-white" },
  { from: "from-sky-400", via: "via-blue-400", to: "to-indigo-400", text: "text-white" },
];

const SEARCH_TERMS = ["snacks", "milk", "diapers", "chocolate", "atta", "cold drinks", "biscuits"];

const QUICK_FILTERS = [
  { id: "all", label: "All", icon: "🛍️" },
  { id: "under99", label: "Under ₹99", icon: "💸" },
  { id: "deals", label: "Top Deals", icon: "🔥" },
  { id: "instock", label: "In Stock", icon: "✅" },
];

function getOfferLabel(offer: Offer) {
  if (offer.type === "BUY_1_GET_1") return "Buy 1 Get 1 Free";
  if (offer.type === "BUY_1_GET_2") return "Buy 1 Get 2 Free";
  const anyOffer = offer as any;
  if (anyOffer.type === "BUY_X_GET_Y") {
    return `Buy ${anyOffer.buyQuantity || 1} Get ${anyOffer.freeQuantity || 1} Free`;
  }
  return "Special Offer • Shop Now";
}

function getProductImages(product: Product): string[] {
  if (Array.isArray((product as any).images) && (product as any).images.length > 0) {
    return (product as any).images.filter(Boolean) as string[];
  }
  if (typeof (product as any).image === "string" && (product as any).image) {
    return [(product as any).image as string];
  }
  return [];
}

function ProductTile({ product, fullWidth = false }: { product: Product; fullWidth?: boolean }) {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isWished, toggle: toggleWishlistState } = useWishlist();

  const images = getProductImages(product);
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const stock = Number(product.stock || 0);
  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const wished = isWished(product.id);

  const variantId = (product as any).variantId || undefined;
  const quantity = getItemQuantity(product.id, variantId);

  const notifyAdded = () => {
    window.dispatchEvent(
      new CustomEvent("nightnow:cart-added", {
        detail: { product: { ...product } },
      })
    );
  };

  const handleAdd = () => {
    if (stock <= 0) return;
    addToCart({ ...product, quantity: 1, ...(variantId ? { variantId } : {}) } as any);
    notifyAdded();
  };

  const handleIncrease = () => {
    if (stock <= 0 || quantity >= stock) return;
    addToCart({ ...product, quantity: 1, ...(variantId ? { variantId } : {}) } as any);
  };

  const handleDecrease = () => {
    if (quantity <= 0) return;
    removeFromCart(product.id, variantId);
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) {
      alert("Please log in to use the wishlist.");
      return;
    }

    try {
      await toggleWishlistState(product.id, product);
    } catch (error) {
      console.error("Wishlist error:", error);
      alert("Wishlist update failed.");
    }
  };

  // -------- IMAGE SWIPE (touch) --------
  const goToImage = (index: number) => {
    if (images.length === 0) return;
    const next = ((index % images.length) + images.length) % images.length;
    setActiveImage(next);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;

    const endX = e.changedTouches[0].clientX;
    const difference = touchStartX.current - endX;

    if (Math.abs(difference) > 30) {
      didSwipeRef.current = true;
      goToImage(activeImage + (difference > 0 ? 1 : -1));
    }

    touchStartX.current = null;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      didSwipeRef.current = false;
    }
  };

  return (
    <div
      className={`${
        fullWidth ? "w-full" : "w-[140px] shrink-0"
      } flex aspect-square flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(0,0,0,0.24)]`}
    >
      <Link href={`/product/${product.id}`} className="flex h-full flex-col" onClick={handleLinkClick}>
        <div
          className="relative min-h-0 flex-[3] bg-zinc-50"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-indigo-950 px-1.5 py-0.5 text-[7px] font-black text-yellow-300">
            🌙 15 MIN
          </span>

          {/* WISHLIST HEART */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-sm shadow ${
              wished ? "text-red-500" : "text-zinc-400"
            }`}
          >
            {wished ? "♥" : "♡"}
          </button>

          {/* DISCOUNT BADGE — stacked below the wishlist heart */}
          {discount > 0 && (
            <span className="absolute right-1.5 top-8 z-10 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-1.5 py-0.5 text-[7px] font-black text-white">
              {discount}% OFF
            </span>
          )}

          <div className="absolute inset-0 flex items-center justify-center p-2">
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={product.name || "Product"}
                className="max-h-full max-w-full select-none object-contain"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>

          {/* IMAGE DOTS — only when the product has 2+ images */}
          {images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 gap-0.5">
              {images.map((_img: string, index: number) => (
                <span
                  key={index}
                  className={`h-1 w-1 rounded-full ${
                    index === activeImage ? "bg-zinc-900" : "bg-zinc-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* FLOATING ADD BUTTON — overlaps the image corner */}
          <div className="absolute -bottom-2 right-1.5">
            {quantity > 0 ? (
              <div className="flex h-9 items-center gap-1.5 rounded-xl bg-yellow-400 px-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDecrease();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-base font-black text-white"
                >
                  −
                </button>
                <span className="min-w-[14px] text-center text-xs font-black text-black">{quantity}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIncrease();
                  }}
                  disabled={stock <= 0 || quantity >= stock}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-base font-black text-white disabled:opacity-30"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAdd();
                }}
                disabled={stock <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black shadow-lg disabled:bg-zinc-300"
              >
                {stock <= 0 ? "✕" : "+"}
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 px-1.5 pb-1.5 pt-1">
          <p className="line-clamp-1 text-[9px] font-bold leading-tight text-zinc-900">
            {product.name || "Product"}
          </p>

          <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span className="text-[11px] font-black text-zinc-900">₹{price}</span>
            {mrp > price && <span className="truncate text-[7px] text-zinc-400 line-through">₹{mrp}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { cartCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<{ title: string; sub: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");

  const [showLocation, setShowLocation] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [location, setLocation] = useState<{ name: string; address?: string } | null>(null);

  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [offerSlideIndex, setOfferSlideIndex] = useState(0);
  const offerSlideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------
  // LOAD DATA (real backend — unchanged)
  // ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [productList, categoryList, offerList, heroSnap] = await Promise.all([
          getProducts(),
          getCategories(),
          getOffers().catch(() => []),
          getDoc(doc(db, "settings", "heroBanner")).catch(() => null),
        ]);
        if (cancelled) return;

        const activeProducts = productList.filter((p) => p.active !== false);
        setProducts(activeProducts);
        setOffers((offerList || []).filter((o) => o.active !== false));

        if (heroSnap && heroSnap.exists()) {
          const data = heroSnap.data();
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            setHeroSlides(data.slides);
          }
        }

        const activeCategories = categoryList.filter((c) => c.active !== false);

        // Root cause found & fixed: the admin product form was
        // saving the category's Firestore ID into the display
        // "category" text field (instead of its name). That bug
        // is now fixed for new saves, but OLD products still have
        // the corrupted value until re-saved from admin. So: trust
        // the real "categories" collection first (it's fine), and
        // only fall back to deriving from product.category when no
        // formal categories exist yet.
        let resolvedCategories: Category[] = activeCategories;

        if (resolvedCategories.length === 0) {
          const seen = new Set<string>();
          const derived: Category[] = [];

          activeProducts.forEach((product) => {
            const name = (product.category || "").trim();
            if (!name || seen.has(name.toLowerCase())) return;
            seen.add(name.toLowerCase());
            derived.push({ id: `cat-${name.toLowerCase().replace(/\s+/g, "-")}`, name } as Category);
          });

          resolvedCategories = derived;
        }

        setCategories(resolvedCategories);
      } catch (error) {
        console.error("Homepage data load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    try {
      const saved = localStorage.getItem("nightnow_selected_location");
      if (saved) setLocation(JSON.parse(saved));
    } catch {
      // ignore corrupted local storage
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------
  // AUTH STATE (for the header profile/login icon)
  // ---------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------
  // ROTATING SEARCH PLACEHOLDER
  // ---------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_TERMS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------
  // HERO BANNER SLIDES — always the generic brand slides
  // (independent of admin offers).
  // ---------------------------------------------------
  const bannerSlides = useMemo(() => {
    const source = heroSlides.length > 0 ? heroSlides : PROMO_SLIDES;
    return source.map((slide, index) => ({
      id: `hero-${index}`,
      title: slide.title,
      sub: slide.sub,
      href: "",
      from: PROMO_SLIDES[index % PROMO_SLIDES.length].from,
      via: PROMO_SLIDES[index % PROMO_SLIDES.length].via,
      to: PROMO_SLIDES[index % PROMO_SLIDES.length].to,
      text: PROMO_SLIDES[index % PROMO_SLIDES.length].text,
    }));
  }, [heroSlides]);

  // ---------------------------------------------------
  // OFFERS CAROUSEL — real admin offers, shown as a
  // separate section further down the page. Empty when
  // no active offers exist (the section itself is hidden).
  // ---------------------------------------------------
  const offerSlides = useMemo(() => {
    return offers.slice(0, 6).map((offer, index) => ({
      id: `offer-${offer.id}`,
      title: offer.title || "Special Offer",
      sub: getOfferLabel(offer),
      href: `/offers/${encodeURIComponent(String(offer.id))}`,
      ...OFFER_GRADIENTS[index % OFFER_GRADIENTS.length],
    }));
  }, [offers]);

  // ---------------------------------------------------
  // AUTO-ROTATING HERO BANNER
  // ---------------------------------------------------
  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);

    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [bannerSlides.length]);

  // ---------------------------------------------------
  // AUTO-ROTATING OFFERS CAROUSEL
  // ---------------------------------------------------
  useEffect(() => {
    if (offerSlides.length === 0) return;

    offerSlideTimer.current = setInterval(() => {
      setOfferSlideIndex((prev) => (prev + 1) % offerSlides.length);
    }, 4000);

    return () => {
      if (offerSlideTimer.current) clearInterval(offerSlideTimer.current);
    };
  }, [offerSlides.length]);

  // ---------------------------------------------------
  // FILTERING
  // ---------------------------------------------------
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }

    if (selectedCategory) {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (quickFilter === "under99") {
      list = list.filter((p) => Number(p.price || 0) <= 99);
    } else if (quickFilter === "deals") {
      list = list.filter((p) => {
        const price = Number(p.price || 0);
        const mrp = Number(p.mrp || 0);
        return mrp > price && mrp > 0 && (mrp - price) / mrp >= 0.15;
      });
    } else if (quickFilter === "instock") {
      list = list.filter((p) => Number(p.stock || 0) > 0);
    }

    return list;
  }, [products, search, selectedCategory, quickFilter]);


  // ---------------------------------------------------
  // CATEGORY-WISE GROUPED SECTIONS (heading + products)
  // ---------------------------------------------------
  const categorySections = useMemo(() => {
    return categories.map((category) => {
      const items = products.filter(
        (p) =>
          (p.category || "").toLowerCase() === category.name.toLowerCase() &&
          Number(p.stock || 0) >= 0
      );
      return { category, items: items.slice(0, 10) };
    });
  }, [categories, products]);

  const isBrowsing = !search.trim() && !selectedCategory;

  const goToCategory = (name: string) => {
    setSelectedCategory(name);
    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <main className="min-h-screen bg-[#FFF8ED] pb-24 text-zinc-900">
      <div className="relative z-10">

      {/* =================================================
          HEADER
      ================================================= */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#FFF8ED]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-2.5 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-1.5">
              <img src="/logo.png" alt="NightNow" className="h-9 w-auto object-contain" />
            </Link>

            <button type="button" onClick={() => setShowLocation(true)} className="min-w-0 flex-1 text-left md:max-w-xs">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-400">Deliver to</span>
              <span className="flex items-center gap-1 truncate text-[11px] font-black text-zinc-900">
                <MapPin size={12} className="shrink-0" />
                {location?.name || "Select Location"} ▼
              </span>
            </button>

            <Link href="/cart" className="relative shrink-0 text-green-600" aria-label="Cart">
              <ShoppingCart size={22} strokeWidth={2.5} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600"
              aria-label={isLoggedIn ? "Profile" : "Login"}
            >
              <User size={18} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="mt-2 flex items-center rounded-2xl border border-zinc-200 bg-white px-3">
            <Search size={16} className="shrink-0 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search for "${SEARCH_TERMS[placeholderIndex]}"...`}
              className="h-10 w-full bg-transparent px-2 text-[12px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-zinc-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =================================================
          TOP HERO — auto-rotating (15 min delivery,
          free delivery, deals, always-on branding)
      ================================================= */}
      <section className="px-3 pt-3 md:px-4">
        <div className="mx-auto max-w-7xl">
          {(() => {
            const activeSlide = bannerSlides[slideIndex % bannerSlides.length];
            const BannerInner = (
              <div
                className={`overflow-hidden rounded-3xl bg-gradient-to-r ${activeSlide.from} ${activeSlide.via} ${activeSlide.to} px-5 py-6 transition-all duration-500 md:px-8 md:py-10`}
              >
                <p className={`whitespace-pre-line text-xl font-black leading-tight md:text-3xl ${activeSlide.text}`}>
                  {activeSlide.title}
                </p>
                <p className={`mt-2 text-[11px] font-bold opacity-80 md:text-sm ${activeSlide.text}`}>
                  {activeSlide.sub}
                </p>

                <div className="mt-3 flex gap-1.5">
                  {bannerSlides.map((slide, index) => (
                    <span
                      key={slide.id}
                      className={`h-1.5 rounded-full transition-all ${
                        index === slideIndex % bannerSlides.length ? "w-6 bg-black/70" : "w-1.5 bg-black/25"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );

            return activeSlide.href ? <Link href={activeSlide.href}>{BannerInner}</Link> : BannerInner;
          })()}
        </div>
      </section>

      {/* =================================================
          ALL CATEGORIES GRID — highlighter heading +
          4-column grid of square category tiles.
          Every active category shown, even with 0 products.
      ================================================= */}
      {isBrowsing && categories.length > 0 && (
        <section className="px-3 pt-6 md:px-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-zinc-900">All Categories</h2>
              <Link href="/categories" className="text-[10px] font-black text-orange-600">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-x-2 gap-y-4">
              {categories.map((category) => (
                <button
                  key={`grid-${category.id}`}
                  type="button"
                  onClick={() => goToCategory(category.name)}
                  className="flex flex-col items-center text-center active:scale-95"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl">{category.icon || "🛍️"}</span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[10px] font-bold leading-tight text-zinc-800">
                    {category.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          CATEGORY-WISE SECTIONS — heading + products
          (grouped by category). Every
          category gets its own section, even with 0 products
          yet (shows a "coming soon" placeholder row instead).
      ================================================= */}
      {isBrowsing &&
        categorySections.map(({ category, items }) => (
          <section key={`cat-section-${category.id}`} className="px-3 pt-6 md:px-4">
            <div className="mx-auto max-w-7xl">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-black text-zinc-900">{category.name}</h2>
                <button
                  type="button"
                  onClick={() => goToCategory(category.name)}
                  className="text-[10px] font-black text-orange-600"
                >
                  See All →
                </button>
              </div>
              {items.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {items.map((product) => (
                    <ProductTile key={`${category.id}-${product.id}`} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-center">
                  <p className="text-lg">🌙✨</p>
                  <p className="mt-1 text-xs font-black text-zinc-700">Fresh stock landing soon!</p>
                </div>
              )}
            </div>
          </section>
        ))}

      {/* =================================================
          OFFERS — real admin offers, auto-rotating,
          shown centrally on the page (only when any exist)
      ================================================= */}
      {offerSlides.length > 0 && (
        <section className="px-3 pt-6 md:px-4">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-2 text-sm font-black text-zinc-900">🎁 Today's Offers</h2>
            {(() => {
              const activeOffer = offerSlides[offerSlideIndex % offerSlides.length];
              return (
                <Link href={activeOffer.href}>
                  <div
                    className={`overflow-hidden rounded-3xl bg-gradient-to-r ${activeOffer.from} ${activeOffer.via} ${activeOffer.to} px-5 py-6 transition-all duration-500 md:px-8 md:py-10`}
                  >
                    <p className={`whitespace-pre-line text-xl font-black leading-tight md:text-3xl ${activeOffer.text}`}>
                      {activeOffer.title}
                    </p>
                    <p className={`mt-2 text-[11px] font-bold opacity-80 md:text-sm ${activeOffer.text}`}>
                      {activeOffer.sub}
                    </p>

                    <div className="mt-3 flex gap-1.5">
                      {offerSlides.map((slide, index) => (
                        <span
                          key={slide.id}
                          className={`h-1.5 rounded-full transition-all ${
                            index === offerSlideIndex % offerSlides.length ? "w-6 bg-black/70" : "w-1.5 bg-black/25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })()}
          </div>
        </section>
      )}

      {/* =================================================
          ALL PRODUCTS — always last on the page
      ================================================= */}
      <section id="products" className="px-3 pb-4 pt-8 md:px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-zinc-900">
              {selectedCategory ? selectedCategory : search ? `Results for "${search}"` : "All Products"}
            </h2>
            {selectedCategory && (
              <button type="button" onClick={() => setSelectedCategory("")} className="text-[10px] font-black text-orange-600">
                Clear
              </button>
            )}
          </div>

          {/* QUICK FILTER CHIPS — right above the grid they filter */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_FILTERS.map((filter) => {
              const active = quickFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setQuickFilter(filter.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-black transition ${
                    active
                      ? "border-orange-400 bg-orange-400 text-black"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-200" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <p className="text-2xl">🔍</p>
              <p className="mt-2 text-sm font-black text-zinc-900">No products found</p>
              <p className="mt-1 text-xs text-zinc-400">Try searching for something else</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductTile key={product.id} product={product} fullWidth />
              ))}
            </div>
          )}
        </div>
      </section>

      <LocationSelector
        open={showLocation}
        location={location as any}
        onClose={() => setShowLocation(false)}
        onSelect={(loc: any) => {
          setLocation(loc);
          try {
            localStorage.setItem("nightnow_selected_location", JSON.stringify(loc));
          } catch {
            // best-effort only
          }
        }}
      />

      </div>
    </main>
  );
}
