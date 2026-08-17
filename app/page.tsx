"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getProducts,
  type Product,
} from "./services/productService";

import {
  getNeeds,
  type Need,
} from "./services/needService";

import {
  getBrands,
  type Brand,
} from "./services/brandService";

import { useCart } from "./context/CartContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import LocationSelector, {
  type SavedLocation,
} from "./components/LocationSelector";

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
  const [needs, setNeeds] = useState<Need[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [priceSort, setPriceSort] = useState<"default" | "high" | "low">("default");
  const [showFilter, setShowFilter] = useState(false);
  const [tempCategory, setTempCategory] = useState("All");
  const [tempPriceSort, setTempPriceSort] = useState<"default" | "high" | "low">("default");

  const [showNeed, setShowNeed] = useState(false);
  const [needText, setNeedText] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ==========================================
  // LOAD PRODUCTS + NEEDS
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [productData, needData, brandData] =
          await Promise.all([
            getProducts(),
            getNeeds(),
            getBrands(),
          ]);

        const cleanProducts = Array.isArray(
          productData
        )
          ? productData.filter(
              (item: any) =>
                item?.active !== false
            )
          : [];

        const cleanNeeds = Array.isArray(
          needData
        )
          ? needData.filter(
              (item: Need) =>
                item?.active !== false
            )
          : [];

        setProducts(
          cleanProducts as Product[]
        );

        setNeeds(cleanNeeds);
        setBrands(
          Array.isArray(brandData)
            ? brandData.filter((item) => item?.active !== false)
            : []
        );
      } catch (error) {
        console.error(
          "Homepage data loading error:",
          error
        );

        setProducts([]);
        setNeeds([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nightnow_location");
      if (saved) setSelectedLocation(JSON.parse(saved));
    } catch (error) {
      console.error("Location load error:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLocationSelect = (location: SavedLocation) => {
    setSelectedLocation(location);
    setShowLocation(false);
    try {
      localStorage.setItem("nightnow_location", JSON.stringify(location));
    } catch (error) {
      console.error("Location save error:", error);
    }
  };

  // ==========================================
  // NORMALIZE SEARCH
  // ==========================================

  const normalizeSearchText = (
    value: any
  ) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();
  };

  // ==========================================
  // PRODUCT SEARCH TEXT
  // ==========================================

  const productSearchText = (
    product: Product
  ) => {
    const values = [
      product.name,
      product.title,
      product.productName,
      product.brandName,
      product.brandId,
      product.category,
      product.description,
      product.genericName,
      product.sku,
      product.code,
      product.tags,
      product.keywords,
    ];

    return normalizeSearchText(
      values.flat().join(" ")
    );
  };

  // ==========================================
  // NEED SEARCH TEXT
  // ==========================================

  const needSearchText = (
    need: Need
  ) => {
    return normalizeSearchText(
      [
        need.title,
        need.description,
        ...(need.keywords || []),
      ].join(" ")
    );
  };

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
  // MATCHED NEEDS FOR MAIN SEARCH
  // ==========================================

  const matchedNeeds = useMemo(() => {
    const text =
      normalizeSearchText(search);

    if (!text) return [];

    const words = text
      .split(" ")
      .filter(Boolean);

    return needs
      .filter((need) => {
        const searchable =
          needSearchText(need);

        return (
          searchable.includes(text) ||
          words.every((word) =>
            searchable.includes(word)
          )
        );
      })
      .slice(0, 5);
  }, [needs, search]);

  // ==========================================
  // BRAND MATCHING
  // ==========================================

  const productMatchesBrand = (product: Product, brandId: string) => {
    const selectedBrand = brands.find(
      (brand) => String(brand.id) === String(brandId)
    );
    const selectedName = normalizeSearchText(selectedBrand?.name || brandId);
    const productBrandId = String(product.brandId || "");
    const productBrandName = normalizeSearchText(
      product.brandName || product.brand || ""
    );

    return (
      productBrandId === String(brandId) ||
      (!!selectedName && productBrandName === selectedName) ||
      (!!selectedName && productBrandName.includes(selectedName))
    );
  };

  // ==========================================
  // PRODUCTS CONNECTED TO MATCHED NEEDS
  // ==========================================

  const productsFromMatchedNeeds =
    useMemo(() => {
      if (
        matchedNeeds.length === 0
      ) {
        return [];
      }

      const productMap =
        new Map<string, Product>();

      matchedNeeds.forEach(
        (need) => {
          // ----------------------------------
          // SPECIFIC PRODUCTS
          // ----------------------------------

          (
            need.productIds || []
          ).forEach((productId) => {
            const product =
              products.find(
                (item) =>
                  item.id === productId
              );

            if (product) {
              productMap.set(
                product.id,
                product
              );
            }
          });

          // ----------------------------------
          // BRAND PRODUCTS
          // ----------------------------------

          (
            need.brandIds || []
          ).forEach((brandId) => {
            products
              .filter((product) => {
                return (
                  productMatchesBrand(product, brandId)
                );
              })
              .forEach((product) => {
                productMap.set(
                  product.id,
                  product
                );
              });
          });
        }
      );

      return Array.from(
        productMap.values()
      );
    }, [
      matchedNeeds,
      products,
      brands,
    ]);

  // ==========================================
  // MAIN PRODUCT SEARCH
  // ==========================================

  const filteredProducts = useMemo(() => {
    const text =
      normalizeSearchText(search);

    // ----------------------------------------
    // If a Need matched, show its products
    // ----------------------------------------

    if (
      text &&
      matchedNeeds.length > 0 &&
      productsFromMatchedNeeds.length > 0
    ) {
      let result =
        productsFromMatchedNeeds;

      if (
        selectedCategory !== "All"
      ) {
        const selected =
          normalizeSearchText(
            selectedCategory
          );

        result = result.filter(
          (product) => {
            const category =
              normalizeSearchText(
                product.category
              );

            return (
              category.includes(
                selected
              ) ||
              productSearchText(
                product
              ).includes(selected)
            );
          }
        );
      }

      return result;
    }

    // ----------------------------------------
    // Normal product search
    // ----------------------------------------

    return products.filter(
      (product) => {
        const searchable =
          productSearchText(
            product
          );

        const words = text
          .split(" ")
          .filter(Boolean);

        const matchesSearch =
          !text ||
          searchable.includes(text) ||
          words.every((word) =>
            searchable.includes(word)
          );

        if (
          selectedCategory ===
          "All"
        ) {
          return matchesSearch;
        }

        const selected =
          normalizeSearchText(
            selectedCategory
          );

        const category =
          normalizeSearchText(
            product.category
          );

        return (
          matchesSearch &&
          (
            category.includes(
              selected
            ) ||
            searchable.includes(
              selected
            )
          )
        );
      }
    );
  }, [
    products,
    search,
    selectedCategory,
    matchedNeeds,
    productsFromMatchedNeeds,
  ]);

  // ==========================================
  // PRICE SORT / FILTER
  // ==========================================

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];

    if (priceSort === "high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (priceSort === "low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    return result;
  }, [filteredProducts, priceSort]);

  // ==========================================
  // SMART NEED MODAL SEARCH
  // ==========================================

  const modalMatchedNeeds =
    useMemo(() => {
      const text =
        normalizeSearchText(
          needText
        );

      if (!text) return [];

      const words = text
        .split(" ")
        .filter(Boolean);

      return needs
        .filter((need) => {
          const searchable =
            needSearchText(
              need
            );

          return (
            searchable.includes(
              text
            ) ||
            words.every((word) =>
              searchable.includes(
                word
              )
            )
          );
        })
        .slice(0, 5);
    }, [needs, needText]);

  // ==========================================
  // MODAL NEED PRODUCTS
  // ==========================================

  const modalNeedProducts =
    useMemo(() => {
      const map =
        new Map<string, Product>();

      modalMatchedNeeds.forEach(
        (need) => {
          // ----------------------------------
          // SPECIFIC PRODUCT IDS
          // ----------------------------------

          (
            need.productIds || []
          ).forEach((productId) => {
            const product =
              products.find(
                (item) =>
                  item.id ===
                  productId
              );

            if (product) {
              map.set(
                product.id,
                product
              );
            }
          });

          // ----------------------------------
          // BRAND IDS
          // ----------------------------------

          (
            need.brandIds || []
          ).forEach((brandId) => {
            products
              .filter((product) => {
                return (
                  String(
                    product.brandId ||
                      ""
                  ) ===
                    String(brandId) ||
                  String(
                    product.brandName ||
                      ""
                  ).toLowerCase() ===
                    String(
                      brandId
                    ).toLowerCase()
                );
              })
              .forEach((product) => {
                map.set(
                  product.id,
                  product
                );
              });
          });
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      modalMatchedNeeds,
      products,
    ]);

  // ==========================================
  // FALLBACK PRODUCT SEARCH IN MODAL
  // ==========================================

  const modalProductSuggestions =
    useMemo(() => {
      const text =
        normalizeSearchText(
          needText
        );

      if (!text) return [];

      const words = text
        .split(" ")
        .filter(Boolean);

      return products
        .filter((product) => {
          const searchable =
            productSearchText(
              product
            );

          return (
            searchable.includes(
              text
            ) ||
            words.every((word) =>
              searchable.includes(
                word
              )
            )
          );
        })
        .sort((a, b) => {
          const searchText =
            normalizeSearchText(
              needText
            );

          const aName =
            normalizeSearchText(
              a.name
            );

          const bName =
            normalizeSearchText(
              b.name
            );

          if (
            aName === searchText &&
            bName !== searchText
          ) {
            return -1;
          }

          if (
            bName === searchText &&
            aName !== searchText
          ) {
            return 1;
          }

          if (
            aName.startsWith(
              searchText
            ) &&
            !bName.startsWith(
              searchText
            )
          ) {
            return -1;
          }

          if (
            bName.startsWith(
              searchText
            ) &&
            !aName.startsWith(
              searchText
            )
          ) {
            return 1;
          }

          return 0;
        })
        .slice(0, 8);
    }, [
      products,
      needText,
    ]);

  // ==========================================
  // FINAL MODAL PRODUCTS
  // ==========================================

  const needSuggestions =
    modalNeedProducts.length >
    0
      ? modalNeedProducts
      : modalProductSuggestions;

  // ==========================================
  // PRODUCT IMAGE
  // ==========================================

  const getProductImage = (
    product: Product
  ) => {
    if (product.image) {
      return product.image;
    }

    if (
      Array.isArray(
        product.images
      ) &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

    return "";
  };

  // ==========================================
  // VOICE SEARCH
  // ==========================================

  const startVoiceSearch = () => {
    const Recognition =
      (window as any)
        .SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "Voice search is not supported in this browser."
      );
      return;
    }

    const recognition =
      new Recognition();

    recognition.lang =
      "en-IN";

    recognition.onresult = (
      event: any
    ) => {
      setSearch(
        event.results?.[0]?.[0]
          ?.transcript || ""
      );
    };

    recognition.onerror = (
      event: any
    ) => {
      console.error(
        "Voice search error:",
        event
      );
    };

    recognition.start();
  };

  // ==========================================
  // ADD TO CART
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

  return (
    <main className="min-h-screen bg-white text-zinc-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap">

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
                  <span className="text-yellow-500">
                    Now
                  </span>
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
            className="hidden min-w-0 max-w-[220px] text-left md:block"
            onClick={() => setShowLocation(true)}
          >
            <p className="text-[8px] font-medium text-zinc-400">
              DELIVER TO
            </p>
            <p className="truncate text-xs font-black">
              📍 {selectedLocation?.name || "Select Location"} ▼
            </p>
            {selectedLocation?.address && (
              <p className="mt-0.5 truncate text-[9px] font-medium text-zinc-400">
                {selectedLocation.address}
              </p>
            )}
          </button>

         {/* DESKTOP SEARCH */}

<div className="relative hidden min-w-0 max-w-2xl flex-1 md:flex">

  <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">

    <span className="text-zinc-400">
      🔍
    </span>

    <input
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      placeholder="Search products, brands, needs..."
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

    <button
      type="button"
      onClick={startVoiceSearch}
      title="Voice Search"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm"
    >
      🎙️
    </button>

  </div>

  {/* SEARCH RESULTS DIRECTLY BELOW SEARCH BAR */}

  {search.trim() &&
    !loading &&
    filteredProducts.length > 0 && (
      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        <div className="max-h-[420px] overflow-y-auto">

          {filteredProducts
            .slice(0, 8)
            .map((product) => {
              const image =
                getProductImage(product);

              const price =
                Number(product.price || 0);

              const mrp =
                Number(product.mrp || 0);

              const discount =
                mrp > price && mrp > 0
                  ? Math.round(
                      ((mrp - price) / mrp) * 100
                    )
                  : 0;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => setSearch("")}
                  className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 transition hover:bg-yellow-50"
                >

                  {/* IMAGE */}

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">

                    {image ? (
                      <img
                        src={image}
                        alt={product.name || "Product"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">
                        📦
                      </span>
                    )}

                  </div>

                  {/* PRODUCT INFO */}

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-black text-zinc-900">
                      {product.name}
                    </p>

                    {(product.brandName ||
                      product.category) && (
                      <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                        {product.brandName ||
                          product.category}
                      </p>
                    )}

                    <div className="mt-1 flex items-center gap-2">

                      <span className="text-sm font-black text-zinc-900">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <>
                          <span className="text-[10px] text-zinc-400 line-through">
                            ₹{mrp}
                          </span>

                          <span className="rounded-md bg-yellow-100 px-1.5 py-0.5 text-[9px] font-black text-yellow-700">
                            {discount}% OFF
                          </span>
                        </>
                      )}

                    </div>

                  </div>

                  <span className="text-zinc-300">
                    →
                  </span>

                </Link>
              );
            })}

        </div>

        {filteredProducts.length > 8 && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTimeout(() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }, 50);
            }}
            className="w-full bg-zinc-50 px-4 py-3 text-center text-xs font-black text-yellow-600 hover:bg-yellow-50"
          >
            View all {filteredProducts.length} products →
          </button>
        )}

      </div>
    )}

  {search.trim() &&
    !loading &&
    filteredProducts.length === 0 && (
      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-2xl">

        <div className="text-2xl">
          🔍
        </div>

        <p className="mt-2 text-xs font-black text-zinc-700">
          Product nahi mila
        </p>

        <p className="mt-1 text-[10px] text-zinc-400">
          Try another product name
        </p>

      </div>
    )}

</div>

          {/* PROFILE / LOGIN */}

          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className="hidden rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black md:block"
          >
            {isLoggedIn ? "👤 Profile" : "Login"}
          </Link>

        </div>

        {/* MOBILE LOCATION */}
        <div className="w-full basis-full border-t border-zinc-100 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setShowLocation(true)}
            className="flex w-full items-center gap-2 text-left"
          >
            <span className="text-lg">📍</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-400">DELIVER TO</span>
              <span className="block truncate text-xs font-black text-zinc-900">{selectedLocation?.name || "Select Location"}</span>
              {selectedLocation?.address && (
                <span className="mt-0.5 block truncate text-[9px] font-medium text-zinc-400">{selectedLocation.address}</span>
              )}
            </span>
            <span className="text-sm">▼</span>
          </button>
        </div>
        {/* MOBILE SEARCH + PROFILE */}
        <div className="w-full basis-full px-3 pb-2 md:hidden">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <div className="flex h-10 items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 shadow-sm">
                <span className="shrink-0 text-base text-zinc-400">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, brands, needs..."
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none placeholder:text-zinc-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mr-1 shrink-0 text-zinc-400"
                  >
                    ×
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  title="Voice Search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs"
                >
                  🎙️
                </button>
              </div>

              {/* MOBILE SEARCH RESULTS */}
              {search.trim() && !loading && filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
                  <div className="max-h-[360px] overflow-y-auto">
                    {filteredProducts.slice(0, 7).map((product) => {
                      const image = getProductImage(product);
                      const price = Number(product.price || 0);
                      const mrp = Number(product.mrp || 0);
                      const discount =
                        mrp > price && mrp > 0
                          ? Math.round(((mrp - price) / mrp) * 100)
                          : 0;

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={() => setSearch("")}
                          className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3 active:bg-yellow-50"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">
                            {image ? (
                              <img src={image} alt={product.name || "Product"} className="h-full w-full object-contain" />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-zinc-900">{product.name}</p>
                            {(product.brandName || product.category) && (
                              <p className="mt-0.5 truncate text-[9px] text-zinc-400">
                                {product.brandName || product.category}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs font-black text-zinc-900">₹{price}</span>
                              {mrp > price && (
                                <>
                                  <span className="text-[9px] text-zinc-400 line-through">₹{mrp}</span>
                                  <span className="rounded bg-yellow-100 px-1 py-0.5 text-[8px] font-black text-yellow-700">{discount}% OFF</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-zinc-300">→</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {search.trim() && !loading && filteredProducts.length === 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-2xl">
                  <div className="text-xl">🔍</div>
                  <p className="mt-1 text-[11px] font-black text-zinc-700">Product nahi mila</p>
                </div>
              )}
            </div>

            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              aria-label={isLoggedIn ? "Profile" : "Login"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg shadow-sm"
            >
              👤
            </Link>
          </div>
        </div>



      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="bg-gradient-to-b from-white via-white to-yellow-50/40">

        <div className="mx-auto max-w-7xl px-3 py-2 md:px-4 md:py-10">

          <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">

            <div className="grid items-center gap-3 p-4 md:grid-cols-2 md:gap-8 md:p-12">

              <div>

                <h1 className="mt-0 whitespace-nowrap text-[14px] font-black leading-none tracking-tight sm:text-[18px] md:whitespace-normal md:text-6xl">
                  आपकी जरूरत, <span className="text-yellow-500">हमारी जिम्मेदारी।</span>
                </h1>

                <p className="mt-2 hidden max-w-xl text-sm leading-6 text-zinc-500 md:mt-5 md:block md:text-base">
                  Groceries, snacks,
                  beverages, personal
                  care और daily
                  essentials एक ही जगह।
                </p>

                <div className="mt-2 flex flex-row items-center gap-2 sm:mt-6 sm:flex-wrap sm:gap-3">

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
                    className="rounded-lg bg-yellow-400 px-3 py-1.5 text-[10px] font-black shadow-sm transition hover:bg-yellow-500 md:rounded-2xl md:px-6 md:py-3 md:text-sm"
                  >
                    Shop Now →
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowNeed(true)
                    }
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[9px] font-bold md:rounded-2xl md:px-5 md:py-3 md:text-sm"
                  >
                    आपकी जरूरत 🧠
                  </button>

                </div>

              </div>

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

                  <div className="relative mt-4 flex justify-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-black text-6xl shadow-[0_18px_35px_rgba(0,0,0,0.18)]">
                      🌙
                    </div>
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
          MATCHED NEEDS FROM MAIN SEARCH
      ================================================= */}

      {search &&
        matchedNeeds.length >
          0 && (
          <section className="mx-auto max-w-7xl px-4 pt-6">

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5">

              <div className="flex items-center gap-2">
                <span className="text-xl">
                  🧠
                </span>

                <div>
                  <h2 className="text-sm font-black">
                    Aapki Zarurat
                  </h2>

                  <p className="text-[10px] text-zinc-500">
                    Aapki search ke liye
                    relevant requirement mili
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">

                {matchedNeeds.map(
                  (need) => (
                    <button
                      key={need.id}
                      type="button"
                      onClick={() => {
                        setNeedText(
                          need.title
                        );
                        setShowNeed(
                          true
                        );
                      }}
                      className="rounded-2xl border border-yellow-300 bg-white px-4 py-3 text-left shadow-sm"
                    >

                      <div className="flex items-center gap-2">

                        <span className="text-xl">
                          {need.icon}
                        </span>

                        <span className="text-xs font-black">
                          {need.title}
                        </span>

                      </div>

                      {need.description && (
                        <p className="mt-1 max-w-xs text-[10px] text-zinc-500">
                          {
                            need.description
                          }
                        </p>
                      )}

                    </button>
                  )
                )}

              </div>

            </div>

          </section>
        )}

      {/* =================================================
          TOP BRANDS
      ================================================= */}

      {(() => {
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
              product.id;

            if (
              !map.has(key)
            ) {
              map.set(
                key,
                product
              );
            }
          });

        const topBrands =
          Array.from(
            map.values()
          );

        if (
          topBrands.length ===
          0
        ) {
          return null;
        }

        return (
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

              {topBrands.map(
                (product) => (
                  <Link
                    key={
                      product.id
                    }
                    href={`/product/${product.id}`}
                    className="min-w-[135px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-yellow-400"
                  >

                    <div className="flex h-20 items-center justify-center rounded-xl bg-zinc-50">

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
                          className="h-full w-full object-contain p-2" loading="lazy"
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
        );
      })()}

      {/* =================================================
          BUY 1 GET 2
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 pt-10">

        <Link
          href="/offers/buy-1-get-2"
          className="flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-500 p-3 md:rounded-3xl md:p-5 text-white shadow-[0_10px_24px_rgba(79,70,229,0.20)] transition hover:-translate-y-1"
        >

          <div>

            <p className="text-[10px] font-black">
              SPECIAL OFFER
            </p>

            <h2 className="mt-1 text-lg font-black md:text-2xl">
              Buy 1 Get 2 🎁
            </h2>

            <p className="mt-1 text-[9px] font-bold md:text-xs">
              Special selected products
            </p>

          </div>

          <span className="rounded-lg bg-white px-3 py-2 text-[9px] font-black text-indigo-700 shadow-sm md:rounded-xl md:px-4 md:py-3 md:text-xs">
            View Offers →
          </span>

        </Link>

      </section>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 pb-14 pt-10"
      >

        <div className="flex items-end justify-between">

          <div>

            <h2 className="text-xl font-black">
              {search &&
              matchedNeeds.length >
                0
                ? "Aapki Zarurat ke Products"
                : "Popular Products"}
            </h2>

            <p className="mt-1 text-xs text-zinc-400">
              {loading
                ? "Loading..."
                : `${sortedProducts.length} Products`}
            </p>

          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory(
                "All"
              );
              setPriceSort("default");
            }}
            className="text-xs font-black text-yellow-600"
          >
            View All →
          </button>

        </div>

        {/* PRODUCT FILTER */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTempCategory(selectedCategory);
              setTempPriceSort(priceSort);
              setShowFilter(true);
            }}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[10px] font-black text-zinc-700 shadow-sm"
          >
            ⚙️ Filter
          </button>
          {(selectedCategory !== "All" || priceSort !== "default") && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setPriceSort("default");
              }}
              className="rounded-xl bg-yellow-50 px-3 py-2.5 text-[10px] font-black text-yellow-700"
            >
              Clear Filter ×
            </button>
          )}
          <span className="truncate text-[10px] font-bold text-zinc-400">
            {selectedCategory !== "All" ? selectedCategory : "All Products"}
            {priceSort === "high" ? " • Price High" : priceSort === "low" ? " • Price Low" : ""}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4">

            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-2xl bg-zinc-100"
              />
            ))}

          </div>
        ) : sortedProducts.length ===
          0 ? (

          <div className="mt-5 rounded-3xl bg-zinc-50 p-10 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h3 className="mt-4 font-black">
              Product nahi mila
            </h3>

            {search && (
              <p className="mt-2 text-xs text-zinc-400">
                Search:
                <span className="font-bold text-zinc-600">
                  {" "}
                  {search}
                </span>
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory(
                  "All"
                );
                setPriceSort("default");
              }}
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
            >
              Clear Search
            </button>

          </div>
        ) : (

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4">

            {sortedProducts.map(
              (product) => {
                const image =
                  getProductImage(
                    product
                  );

                const stock =
                  Number(
                    product.stock || 0
                  );

                const price =
                  Number(
                    product.price || 0
                  );

                const mrp =
                  Number(
                    product.mrp || 0
                  );

                const discount =
                  mrp > price &&
                  mrp > 0
                    ? Math.round(
                        ((mrp - price) /
                          mrp) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md md:rounded-[24px] md:shadow-[0_8px_20px_rgba(0,0,0,0.08),0_18px_45px_rgba(0,0,0,0.06)]"
                  >
                    <div className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <Link href={`/product/${product.id}`}>
                      <div className="relative flex h-[78px] items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-yellow-50/50 md:h-48">
                        <div className="pointer-events-none absolute bottom-5 h-5 w-24 rounded-full bg-black/10 blur-xl transition-all duration-300 group-hover:w-28 group-hover:bg-black/15" />

                        {image ? (
                          <img
                            src={image}
                            alt={product.name || "Product"}
                            className="relative z-[1] h-full w-full object-contain p-1 md:p-4 md:drop-shadow-[0_8px_8px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="relative z-[1] text-xs text-zinc-400">
                            No Image
                          </span>
                        )}

                        {discount > 0 && (
                          <div className="absolute left-0 top-4 z-20">
                            <div className="rounded-r-full bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-[11px] font-black text-white shadow-[0_6px_14px_rgba(34,197,94,0.25)] transition-transform duration-300 group-hover:translate-x-1">
                              {discount}% OFF
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="relative border-t border-zinc-100 bg-white p-1.5 md:p-3.5">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="line-clamp-2 min-h-[28px] text-[9px] font-black leading-3 transition-colors group-hover:text-yellow-600 md:min-h-[38px] md:text-sm md:leading-5">
                          {product.name ||
                            product.title ||
                            product.productName ||
                            "Product"}
                        </h3>
                      </Link>

                      {product.brandName && (
                        <p className="mt-0.5 truncate text-[7px] font-bold text-yellow-600">
                          {product.brandName}
                        </p>
                      )}

                      <div className="mt-1 flex items-end gap-1 md:mt-3 md:gap-2">
                        <p className="text-[11px] font-black text-green-600 md:text-lg">
                          ₹{price}
                        </p>

                        {mrp > price && (
                          <>
                            <p className="hidden pb-0.5 text-[10px] text-zinc-400 line-through md:block">
                              MRP ₹{mrp}
                            </p>
                            <span className="hidden rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-black text-green-700 md:inline-block">
                              {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      {stock > 0 && stock <= 5 && (
                        <p className="mt-0.5 text-[7px] font-bold text-orange-500">
                          Only {stock} left
                        </p>
                      )}

                      {stock <= 0 ? (
                        <div className="mt-3 rounded-xl bg-zinc-100 py-3 text-center text-[10px] font-black text-zinc-400">
                          Out of Stock
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="mt-1 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white shadow-sm md:mt-3 md:h-10 md:w-10 md:text-xl"
                          aria-label={`Add ${product.name || "product"} to cart`}
                        >
                          +
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

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-zinc-200 bg-zinc-50">

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">

          <div>

            <div className="text-2xl font-black">
              Night
              <span className="text-yellow-500">
                Now
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Fast and reliable
              delivery at your
              doorstep.
            </p>

          </div>

          <div>

            <h3 className="font-black">
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

            <h3 className="font-black">
              Support
            </h3>

            <p className="mt-3 text-sm text-zinc-500">
              Need help with
              your order?
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
            © 2026 Night Now.
            All rights reserved.
          </p>

        </div>

      </footer>

      {/* FILTER MODAL */}
      {showFilter && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-3 pb-0 backdrop-blur-sm md:items-center md:pb-3">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4">
              <div>
                <h2 className="text-lg font-black">Filter Products</h2>
                <p className="mt-1 text-[10px] text-zinc-400">Choose category and price order</p>
              </div>
              <button type="button" onClick={() => setShowFilter(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl">×</button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4">
              <p className="text-xs font-black">Category</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={`modal-${category.name}`}
                    type="button"
                    onClick={() => setTempCategory(category.name)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs font-black ${tempCategory === category.name ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-zinc-200 bg-white text-zinc-600"}`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>

              <p className="mt-5 text-xs font-black">Price</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["default", "Default"],
                  ["high", "MRP High ↓"],
                  ["low", "MRP Low ↑"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTempPriceSort(value as "default" | "high" | "low")}
                    className={`rounded-2xl border px-2 py-3 text-[10px] font-black ${tempPriceSort === value ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 p-4">
              <button type="button" onClick={() => { setTempCategory("All"); setTempPriceSort("default"); }} className="rounded-2xl border border-zinc-200 py-3 text-sm font-black">Reset</button>
              <button type="button" onClick={() => { setSelectedCategory(tempCategory); setPriceSort(tempPriceSort); setShowFilter(false); }} className="rounded-2xl bg-yellow-400 py-3 text-sm font-black text-black">Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      <LocationSelector
        open={showLocation}
        onClose={() => setShowLocation(false)}
        location={selectedLocation}
        onSelect={handleLocationSelect}
      />

      {/* =================================================
          AAPKI ZARURAT MODAL
      ================================================= */}

      {showNeed && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-3 pt-16 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

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
                  setShowNeed(
                    false
                  );
                  setNeedText("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl"
              >
                ×
              </button>

            </div>

            {/* SEARCH */}

            <div className="p-4">

              <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">

                <span className="text-zinc-400">
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
                    type="button"
                    onClick={() =>
                      setNeedText(
                        ""
                      )
                    }
                    className="text-zinc-400"
                  >
                    ×
                  </button>
                )}

              </div>

              {/* --------------------------------------
                  MATCHED ADMIN NEED
              -------------------------------------- */}

              {needText &&
                modalMatchedNeeds.length >
                  0 && (
                  <div className="mt-3 space-y-2">

                    {modalMatchedNeeds.map(
                      (need) => (
                        <div
                          key={
                            need.id
                          }
                          className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3"
                        >

                          <div className="flex items-start gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                              {
                                need.icon
                              }
                            </div>

                            <div className="min-w-0">

                              <p className="text-xs font-black">
                                {
                                  need.title
                                }
                              </p>

                              {need.description && (
                                <p className="mt-1 text-[10px] text-zinc-500">
                                  {
                                    need.description
                                  }
                                </p>
                              )}

                              {need.keywords &&
                                need.keywords.length >
                                  0 && (
                                  <p className="mt-1 text-[9px] font-bold text-yellow-700">
                                    {need.keywords
                                      .slice(
                                        0,
                                        5
                                      )
                                      .join(
                                        " • "
                                      )}
                                  </p>
                                )}

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              {/* --------------------------------------
                  PRODUCTS
              -------------------------------------- */}

              {needText &&
                needSuggestions.length >
                  0 && (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">

                    {needSuggestions.map(
                      (product) => (
                        <div
                          key={
                            product.id
                          }
                          className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3"
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
                                  product.name ||
                                  "Product"
                                }
                                className="h-full w-full object-contain p-2" loading="lazy"
                              />
                            ) : (
                              "📦"
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-xs font-black">
                              {product.name ||
                                product.title ||
                                product.productName ||
                                "Product"}
                            </p>

                            {product.brandName && (
                              <p className="mt-1 truncate text-[10px] font-bold text-yellow-600">
                                {
                                  product.brandName
                                }
                              </p>
                            )}

                            <p className="mt-1 text-xs font-bold text-green-600">
                              ₹
                              {Number(
                                product.price ||
                                  0
                              )}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddToCart(
                                product
                              )
                            }
                            disabled={
                              Number(
                                product.stock ||
                                  0
                              ) <= 0
                            }
                            className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black disabled:bg-zinc-200 disabled:text-zinc-400"
                          >
                            {Number(
                              product.stock ||
                                0
                            ) <= 0
                              ? "Out"
                              : "Add"}
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              {/* --------------------------------------
                  NO RESULT
              -------------------------------------- */}

              {needText &&
                modalMatchedNeeds.length ===
                  0 &&
                needSuggestions.length ===
                  0 && (
                  <div className="py-8 text-center">

                    <div className="text-4xl">
                      🔎
                    </div>

                    <p className="mt-3 text-sm font-bold text-zinc-400">
                      Relevant product ya
                      requirement nahi mila.
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-400">
                      Product name, brand,
                      need ya keyword try
                      karein.
                    </p>

                  </div>
                )}

              {/* --------------------------------------
                  EMPTY
              -------------------------------------- */}

              {!needText && (
                <div className="py-8 text-center">

                  <div className="text-4xl">
                    🔎
                  </div>

                  <p className="mt-3 text-sm font-bold text-zinc-400">
                    Apni zarurat type karein
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-400">
                    Example: party,
                    function, snacks,
                    milk, paracetamol
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