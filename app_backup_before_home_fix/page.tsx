"use client";
import {
  getOffers,
  type Offer,
} from "./services/offerService";

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

const HOME_SECTIONS_KEY = "nightnow_home_sections";

const DEFAULT_HOME_CATEGORIES = [
  { id: "grocery-vegetables", name: "Vegetables & Fruits", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 1, active: true, showOnHome: true },
  { id: "grocery-attarice", name: "Atta, Rice & Dal", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 2, active: true, showOnHome: true },
  { id: "grocery-oil", name: "Oil, Ghee & Masala", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 3, active: true, showOnHome: true },
  { id: "grocery-dairy", name: "Dairy, Bread & Eggs", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 4, active: true, showOnHome: true },
  { id: "grocery-bakery", name: "Bakery & Biscuits", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 5, active: true, showOnHome: true },
  { id: "grocery-dryfruit", name: "Dry Fruits & Cereals", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 6, active: true, showOnHome: true },
  { id: "grocery-meat", name: "Chicken, Meat & Fish", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 7, active: true, showOnHome: true },
  { id: "grocery-kitchenware", name: "Kitchenware & Appliances", section: "Grocery & Kitchen", heading: "Grocery & Kitchen", subtitle: "Everyday essentials", image: "", order: 8, active: true, showOnHome: true },
  { id: "snacks-chips", name: "Chips & Namkeen", section: "Snacks & Drinks", heading: "Snacks & Drinks", subtitle: "Tasty picks for every time", image: "", order: 9, active: true, showOnHome: true },
  { id: "snacks-sweets", name: "Sweets & Chocolates", section: "Snacks & Drinks", heading: "Snacks & Drinks", subtitle: "Tasty picks for every time", image: "", order: 10, active: true, showOnHome: true },
  { id: "snacks-drinks", name: "Drinks & Juices", section: "Snacks & Drinks", heading: "Snacks & Drinks", subtitle: "Tasty picks for every time", image: "", order: 11, active: true, showOnHome: true },
  { id: "snacks-tea", name: "Tea, Coffee & More", section: "Snacks & Drinks", heading: "Snacks & Drinks", subtitle: "Tasty picks for every time", image: "", order: 12, active: true, showOnHome: true },
];

export default function HomePage() {
  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
    cart,
  } = useCart();

  // MOBILE PRODUCT SCROLLER HEADING - change only this text when needed
  const mobileProductScrollerHeading = "Popular Products";

  type HomeCategory = {
    id: string;
    name: string;
    section: string;
    image: string;
    heading?: string;
    subtitle?: string;
    order: number;
    active?: boolean;
    showOnHome?: boolean;
    productIds?: string[];
  };

  type HomeSectionConfig = {
    key: string;
    section: string;
    heading: string;
    subtitle: string;
    order: number;
    active: boolean;
    showOnHome: boolean;
    productIds: string[];
  };

  const [homeCategories, setHomeCategories] =
    useState<HomeCategory[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSectionConfig[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [sortMode, setSortMode] =
    useState<"default" | "high" | "low">("default");
  const [discountFilter, setDiscountFilter] =
    useState<"all" | "10" | "20" | "50">("all");
  const [showSortCategory, setShowSortCategory] = useState(false);

  const [showNeed, setShowNeed] = useState(false);
  const [needText, setNeedText] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ==========================================
  // LOAD HOME CATEGORIES FROM ADMIN
  // ==========================================

  useEffect(() => {
    const loadHomeCategories = () => {
      try {
        const saved = localStorage.getItem(
          "nightnow_admin_categories"
        );

        if (!saved) {
          localStorage.setItem(
            "nightnow_admin_categories",
            JSON.stringify(DEFAULT_HOME_CATEGORIES)
          );
          setHomeCategories(DEFAULT_HOME_CATEGORIES);
          return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          setHomeCategories(DEFAULT_HOME_CATEGORIES);
          return;
        }

        // V10: section-level configuration is stored separately so the
        // customer-facing heading is never taken from an individual category.
        let sectionConfig = new Map<string, any>();
        let sections: any[] = [];
        try {
          const rawSections = localStorage.getItem(HOME_SECTIONS_KEY);
          const parsedSections = rawSections ? JSON.parse(rawSections) : [];
          sections = Array.isArray(parsedSections) ? parsedSections : [];
          sections.forEach((section: any) => {
            const sectionName = String(section?.section || "").trim();
            if (!sectionName) return;
            sectionConfig.set(sectionName.toLowerCase(), section);
          });
        } catch {
          sectionConfig = new Map<string, any>();
          sections = [];
        }

        const activeCategories = parsed
          .map((category: HomeCategory) => {
            const sectionName = String(category?.section || category?.heading || category?.name || "Products").trim() || "Products";
            const config = sectionConfig.get(sectionName.toLowerCase());
            return {
              ...category,
              section: sectionName,
              heading: String(config?.heading || category.heading || sectionName).trim() || sectionName,
              subtitle: String(config?.subtitle || category.subtitle || "Explore more products").trim() || "Explore more products",
              order: Number(config?.order ?? category.order ?? 0),
              productIds: Array.isArray(config?.productIds) ? config.productIds.map(String) : Array.isArray(category.productIds) ? category.productIds.map(String) : [],
            };
          })
          .filter((category: HomeCategory) => category.active !== false && category.showOnHome !== false)
          .sort((a: HomeCategory, b: HomeCategory) => Number(a.order || 0) - Number(b.order || 0));

        setHomeCategories(activeCategories);

        if (Array.isArray(sections) && sections.length > 0) {
          setHomeSections(
            sections
              .map((section: any, index: number) => ({
                key: String(section?.key || section?.section || `section-${index}`),
                section: String(section?.section || `Section ${index + 1}`),
                heading: String(section?.heading || section?.section || `Section ${index + 1}`),
                subtitle: String(section?.subtitle || "Explore more products"),
                order: Number(section?.order ?? index + 1),
                active: section?.active !== false,
                showOnHome: section?.showOnHome !== false,
                productIds: Array.isArray(section?.productIds) ? section.productIds.map(String) : [],
              }))
              .filter((section: HomeSectionConfig) => section.active && section.showOnHome)
              .sort((a: HomeSectionConfig, b: HomeSectionConfig) => a.order - b.order)
          );
        } else {
          setHomeSections([]);
        }
      } catch (error) {
        console.error(
          "Home category loading error:",
          error
        );
        setHomeCategories([]);
      }
    };

    loadHomeCategories();

    // Admin and Home run in the same browser tab, so the native
    // "storage" event does not fire in the Home tab. Listen for our
    // custom event as well, and refresh when the tab becomes visible.
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nightnow_admin_categories") {
        loadHomeCategories();
      }
    };

    const handleAdminUpdate = () => loadHomeCategories();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadHomeCategories();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("nightnow_admin_categories_updated", handleAdminUpdate);
    window.addEventListener("focus", handleAdminUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nightnow_admin_categories_updated", handleAdminUpdate);
      window.removeEventListener("focus", handleAdminUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

 // ==========================================
// LOAD PRODUCTS + NEEDS + BRANDS + OFFERS
// ==========================================

useEffect(() => {
  const loadData = async () => {
    setLoading(true);

    const [
      productResult,
      needResult,
      brandResult,
      offerResult,
    ] = await Promise.allSettled([
      getProducts(),
      getNeeds(),
      getBrands(),
      getOffers(),
    ]);
    // ========================================
    // PRODUCTS
    // ========================================

    if (
      productResult.status === "fulfilled"
    ) {
      const data =
        Array.isArray(
          productResult.value
        )
          ? productResult.value.filter(
              (item: any) =>
                item?.active !== false
            )
          : [];

      setProducts(
        data as Product[]
      );
    } else {
      console.error(
        "Products load error:",
        productResult.reason
      );

      setProducts([]);
    }

    // ========================================
    // NEEDS
    // ========================================

    if (
      needResult.status === "fulfilled"
    ) {
      const data =
        Array.isArray(
          needResult.value
        )
          ? needResult.value.filter(
              (item: Need) =>
                item?.active !== false
            )
          : [];

      setNeeds(data);
    } else {
      console.error(
        "Needs load error:",
        needResult.reason
      );

      setNeeds([]);
    }

    // ========================================
    // BRANDS
    // ========================================

    if (
      brandResult.status === "fulfilled"
    ) {
      const data =
        Array.isArray(
          brandResult.value
        )
          ? brandResult.value.filter(
              (item: any) =>
                item?.active !== false
            )
          : [];

      setBrands(
        data as Brand[]
      );
    } else {
      console.error(
        "Brands load error:",
        brandResult.reason
      );

      setBrands([]);
    }

    // ========================================
    // OFFERS
    // ========================================

    if (
      offerResult.status === "fulfilled"
    ) {
      const data =
        Array.isArray(
          offerResult.value
        )
          ? offerResult.value.filter(
              (item: Offer) =>
                item?.active !== false
            )
          : [];

      console.log(
        "NIGHTNOW ACTIVE OFFERS:",
        data
      );

      setOffers(data);
    } else {
      console.error(
        "Offers load error:",
        offerResult.reason
      );

      setOffers([]);
    }

    // ========================================
    // LOADING COMPLETE
    // ========================================

    setLoading(false);
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

  const sortByMrp = (items: Product[]) => {
    if (sortMode === "default") {
      return items;
    }

    return [...items].sort((a: any, b: any) => {
      const aMrp = Number(a?.mrp ?? a?.MRP ?? a?.price ?? 0);
      const bMrp = Number(b?.mrp ?? b?.MRP ?? b?.price ?? 0);

      return sortMode === "high"
        ? bMrp - aMrp
        : aMrp - bMrp;
    });
  };

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

      if (discountFilter !== "all") {
        const minimum = Number(discountFilter);
        result = result.filter((product: any) => {
          const mrp = Number(product?.mrp ?? product?.MRP ?? product?.price ?? 0);
          const price = Number(product?.price ?? 0);
          const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
          return discount >= minimum;
        });
      }
      return sortByMrp(result);
    }

    // ----------------------------------------
    // Normal product search
    // ----------------------------------------

    let result = products.filter(
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

    if (discountFilter !== "all") {
      const minimum = Number(discountFilter);
      result = result.filter((product: any) => {
        const mrp = Number(product?.mrp ?? product?.MRP ?? product?.price ?? 0);
        const price = Number(product?.price ?? 0);
        const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
        return discount >= minimum;
      });
    }

    return sortByMrp(result);
  }, [
    products,
    search,
    selectedCategory,
    matchedNeeds,
    productsFromMatchedNeeds,
    sortMode,
    discountFilter,
  ]);

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
      ...(product as any).variantId
        ? { variantId: (product as any).variantId }
        : {},
    } as any);
  };

  const getMobileCartQuantity = (
    product: Product
  ) => {
    return getItemQuantity(
      product.id,
      (product as any).variantId || undefined
    );
  };

  const handleMobileDecrease = (
    product: Product
  ) => {
    const quantity = getMobileCartQuantity(product);

    if (quantity <= 0) return;

    removeFromCart(
      product.id,
      (product as any).variantId || undefined
    );
  };

  const handleMobileIncrease = (
    product: Product
  ) => {
    const stock = Number(product.stock || 0);
    const quantity = getMobileCartQuantity(product);

    if (stock <= 0 || quantity >= stock) return;

    addToCart({
      ...product,
      quantity: 1,
      ...(product as any).variantId
        ? { variantId: (product as any).variantId }
        : {},
    } as any);
  };

  return (
   <main className="min-h-screen bg-gradient-to-b from-[#fdf4ff] via-[#fff8fc] to-[#f3e8ff] text-zinc-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-purple-100 bg-[#fffaff]/95 backdrop-blur">

        <div className="relative mx-auto hidden max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:flex md:flex-nowrap">

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
{/* SEARCH BAR */}
<div className="px-3">
  <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
    <span className="text-sm">🔍</span>

    <input
      type="text"
      placeholder="Search products..."
      className="flex-1 bg-transparent text-xs font-medium outline-none"
    />
  </div>

  {/* Small tagline below search */}
  <p className="mt-1.5 px-1 text-[9px] font-semibold text-zinc-500">
    आपकी जरूरत, हमारी जिम्मेदारी
  </p>
</div>

{/* SMALL NEED BUTTON */}
<div className="mt-2 px-3">
  <button
    type="button"
    className="rounded-full bg-yellow-400 px-3 py-1.5 text-[9px] font-black text-zinc-900"
  >
    आपकी जरूरत 🛍️
  </button>
</div>

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
                  className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5 transition hover:bg-yellow-50"
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
            className="w-full bg-zinc-50 px-3 py-2.5 text-center text-xs font-black text-yellow-600 hover:bg-yellow-50"
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
            className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
          >
            {isLoggedIn ? "👤 Profile" : "Login"}
          </Link>

        </div>
        {/* MOBILE TOP - LOGO + LOCATION */}
        <div className="flex w-full items-center justify-between gap-2 px-4 py-2 md:hidden">
          <Link href="/" className="flex shrink-0 items-center gap-1.5">
            <span className="text-xl">🌙</span>
            <span className="text-base font-black leading-none">
              Night<span className="text-yellow-500">Now</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setShowLocation(true)}
            className="min-w-0 flex-1 text-right"
          >
            <span className="block text-[7px] font-bold uppercase tracking-wide text-zinc-400">
              DELIVER TO
            </span>

            <span className="block truncate text-[10px] font-black text-zinc-900">
              📍 {selectedLocation?.name || "Select Location"} ▼
            </span>

            {selectedLocation?.address && (
              <span className="block truncate text-[8px] font-medium text-zinc-400">
                {selectedLocation.address}
              </span>
            )}
          </button>
        </div>

        {/* MOBILE SEARCH - FIRST / STICKY */}
        <div className="w-full basis-full md:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex min-w-0 flex-1 items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 shadow-sm">
              <span className="shrink-0 text-base text-zinc-400">🔍</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brands, needs..."
                className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none placeholder:text-zinc-400"
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
            <Link
              href={isLoggedIn ? "/profile" : "/login"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-sm font-black text-black"
              aria-label={isLoggedIn ? "Profile" : "Login"}
            >
              {isLoggedIn ? "👤" : "↪"}
            </Link>
          </div>

          {/* MOBILE SEARCH RESULTS */}
          {search.trim() &&
            !loading &&
            filteredProducts.length > 0 && (
              <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-[100] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
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
                        className="flex items-center gap-2 border-b border-zinc-100 px-3 py-3 active:bg-yellow-50"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50">
                          {image ? (
                            <img src={image} alt={product.name || "Product"} className="h-full w-full object-contain" />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-zinc-900">
                            {product.name}
                          </p>
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
                                <span className="rounded bg-yellow-100 px-1 py-0.5 text-[8px] font-black text-yellow-700">
                                  {discount}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-zinc-300">→</span>
                      </Link>
                    );
                  })}
                </div>

                {filteredProducts.length > 7 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTimeout(() => {
                        document.getElementById("products")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 50);
                    }}
                    className="w-full bg-zinc-50 px-3 py-3 text-center text-[10px] font-black text-yellow-600"
                  >
                    View all {filteredProducts.length} products →
                  </button>
                )}
              </div>
            )}

          {search.trim() &&
            !loading &&
            filteredProducts.length === 0 && (
              <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-[100] rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-2xl">
                <div className="text-xl">🔍</div>
                <p className="mt-1 text-[11px] font-black text-zinc-700">
                  Product nahi mila
                </p>
              </div>
            )}
        </div>

        {/* MOBILE LOCATION - BELOW SEARCH */}
       <div className="hidden w-full basis-full md:hidden">
          <button
            type="button"
            onClick={() => setShowLocation(true)}
            className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left"
          >
            <span className="text-lg">📍</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-400">
                DELIVER TO
              </span>
              <span className="block truncate text-xs font-black text-zinc-900">
                {selectedLocation?.name || "Select Location"}
              </span>
              {selectedLocation?.address && (
                <span className="mt-0.5 block truncate text-[9px] font-medium text-zinc-400">
                  {selectedLocation.address}
                </span>
              )}
            </span>
            <span className="text-sm">▼</span>
          </button>
        </div>

      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="hidden bg-gradient-to-b from-[#fffaff] via-[#fdf4ff] to-[#f3e8ff] md:block">

        <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">

          <div className="overflow-hidden rounded-none border-0 bg-transparent shadow-none md:rounded-[28px] md:border md:border-zinc-200 md:bg-white md:shadow-sm">

            <div className="grid items-center gap-8 p-7 md:grid-cols-2 md:p-12">

              <div>

                <div className="mb-4 hidden h-14 w-14 items-center justify-center rounded-2xl bg-black text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.18)] md:flex">
                  🌙
                </div>

               
                <p className="mt-3 hidden max-w-xl text-sm leading-6 text-zinc-500 md:block md:text-base">
                  Groceries, snacks, beverages, personal care और daily essentials एक ही जगह।
                </p>

                <div className="mt-3 flex flex-row gap-2 sm:mt-6 sm:flex-row sm:flex-wrap">

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
                                 
                                  >
            
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
    MOBILE QUICK CATEGORIES
    Separate from the Home Category image section.
================================================= */}
<section className="border-b border-zinc-100 bg-white px-3 py-2 md:hidden">
  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
    {categories.map((category) => {
      const active = selectedCategory === category.name;
      return (
        <button
          key={`quick-${category.name}`}
          type="button"
          onClick={() => setSelectedCategory(category.name)}
          className={`flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 ${
            active ? "bg-yellow-50" : "bg-white"
          }`}
        >
          <span className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-xl ${
            active ? "border-yellow-400 bg-yellow-100" : "border-zinc-200 bg-zinc-50"
          }`}>
            {category.icon}
          </span>
          <span className="max-w-[62px] truncate text-[8px] font-black text-zinc-700">
            {category.name}
          </span>
        </button>
      );
    })}
  </div>
</section>

{/* =================================================
    LIVE OFFERS
================================================= */}

{offers.filter(
  (offer: Offer) =>
    offer.active !== false
).length > 0 && (
  <section className="w-full px-3 pt-2 pb-3">

    {/* LIVE HEADER */}

    <div className="mb-2 flex items-center justify-between">

      <div className="flex items-center gap-2">

        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />

          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>

        <span className="text-[11px] font-black text-zinc-900">
          LIVE OFFERS
        </span>

      </div>

      {offers.filter(
        (offer: Offer) =>
          offer.active !== false
      ).length > 1 && (
        <span className="text-[9px] font-bold text-zinc-400">
          Swipe →
        </span>
      )}

    </div>


    {/* OFFER SCROLLER */}

    <div
      className="flex gap-2.5 overflow-x-auto pb-1"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >

      {offers
        .filter(
          (offer: Offer) =>
            offer.active !== false
        )
        .map(
          (offer: Offer) => {

            let offerType =
              "SPECIAL OFFER";

            if (
              offer.type ===
              "BUY_1_GET_1"
            ) {
              offerType =
                "BUY 1 GET 1";
            }

            if (
              offer.type ===
              "BUY_1_GET_2"
            ) {
              offerType =
                "BUY 1 GET 2";
            }

            if (
              offer.type ===
              "BUY_X_GET_Y"
            ) {
              offerType =
                `BUY ${offer.buyQuantity} GET ${offer.freeQuantity}`;
            }

            return (
              <Link
                key={offer.id}
                href={`/offers/${offer.id}`}
                className="group relative min-w-[calc(100vw-36px)] max-w-[360px] overflow-hidden rounded-[18px] border border-yellow-300 bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-300 px-3 py-2.5 shadow-[0_5px_16px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-[0.98]"
              >

                {/* MOVING SHINE */}

                <span
                  className="pointer-events-none absolute inset-y-0 -left-16 w-10 -skew-x-12 bg-white/40 transition-transform duration-[1800ms] group-hover:translate-x-[430px]"
                />

                {/* TOP */}

                <div className="relative z-10 flex items-center justify-between gap-2">

                  <div className="min-w-0">

                    <div className="flex items-center gap-1.5">

                      <span className="text-[8px] font-black text-black/60">
                        {offerType}
                      </span>

                    </div>

                    <h3 className="mt-0.5 truncate text-[14px] font-black leading-tight text-black">
                      {offer.title}
                    </h3>

                    {offer.description && (
                      <p className="mt-0.5 truncate text-[8px] font-semibold text-black/60">
                        {offer.description}
                      </p>
                    )}

                  </div>


                  {/* OFFER BADGE */}

                  <span className="shrink-0 animate-pulse rounded-full bg-black px-2.5 py-1 text-[7px] font-black text-white">
                    OFFER
                  </span>

                </div>


                {/* BOTTOM */}

                <div className="relative z-10 mt-2 flex items-center justify-between">

                  <span className="text-[8px] font-bold text-black/55">
                    Tap to see offer
                  </span>

                  <span className="rounded-lg bg-black px-3 py-1.5 text-[8px] font-black text-white transition-transform group-hover:translate-x-1">
                    View Offer →
                  </span>

                </div>

              </Link>
            );
          }
        )}

    </div>

  </section>
)}


        {/* =================================================
            MOBILE ADMIN-CONTROLLED HOME SECTIONS
            Sections are grouped by the admin Section Group.
            Heading/subtitle/products belong to the whole section.
        ================================================= */}
        <div className="md:hidden px-3 pb-5">
          {(() => {
            const categoryBySection = new Map<string, HomeCategory[]>();
            homeCategories.forEach((category) => {
              const key = String(category.section || category.heading || category.name || "Products").trim().toLowerCase();
              const list = categoryBySection.get(key) || [];
              list.push(category);
              categoryBySection.set(key, list);
            });

            const groups = (homeSections.length > 0 ? homeSections : Array.from(categoryBySection.entries()).map(([key, items], index) => ({
              key,
              section: items[0]?.section || "Products",
              heading: items[0]?.heading || items[0]?.section || "Products",
              subtitle: items[0]?.subtitle || "Explore more products",
              order: Number(items[0]?.order || index + 1),
              active: true,
              showOnHome: true,
              productIds: Array.from(new Set(items.flatMap((item) => item.productIds || []))),
            }))).filter((group) => group.active && group.showOnHome).sort((a, b) => a.order - b.order);

            if (groups.length === 0) return null;

            return groups.map((group) => {
              const items = categoryBySection.get(String(group.section || "").trim().toLowerCase()) || [];
              const names = items.map((c) => normalizeSearchText(c.name)).filter(Boolean);
              const selectedProductIds = Array.from(new Set((group.productIds || []).map(String)));

              let sectionProducts = selectedProductIds.length > 0
                ? products.filter((product) => product.active !== false && selectedProductIds.includes(String(product.id)))
                : products.filter((product) => {
                    if (product.active === false) return false;
                    const searchable = productSearchText(product);
                    const productCategory = normalizeSearchText(product.category);
                    return names.some((name) => productCategory.includes(name) || searchable.includes(name));
                  });

              if (sectionProducts.length === 0 && selectedProductIds.length === 0) {
                sectionProducts = products.filter((p) => p.active !== false).slice(0, 8);
              }

              return (
                <section key={`admin-home-section-${group.key}`} className="pt-5">
                  <div className="mb-3 flex items-end justify-between">
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-black leading-5 text-zinc-900">{group.heading}</h2>
                      <p className="mt-1 text-[10px] font-medium text-zinc-500">{group.subtitle}</p>
                    </div>
                    <Link href="/categories" className="shrink-0 text-[10px] font-black text-yellow-600">See all →</Link>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {items.slice(0, 8).map((category) => (
                      <Link
                        key={`admin-category-${category.id}`}
                        href={`/categories?category=${encodeURIComponent(category.name)}`}
                        className="min-w-0 rounded-xl bg-white p-1 text-center"
                      >
                        <div className="flex h-[72px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="h-full w-full object-contain" loading="lazy" />
                          ) : (
                            <span className="text-2xl">🛍️</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[8px] font-bold leading-3 text-zinc-800">{category.name}</p>
                      </Link>
                    ))}
                  </div>

                  {sectionProducts.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                      {sectionProducts.slice(0, 8).map((product) => {
                        const image = getProductImage(product);
                        const price = Number(product.price || 0);
                        return (
                          <Link key={`admin-section-product-${group.key}-${product.id}`} href={`/product/${product.id}`} className="w-[128px] shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                            <div className="relative flex h-[122px] items-center justify-center bg-white">
                              {image ? <img src={image} alt={product.name || "Product"} className="h-full w-full object-contain p-2" loading="lazy" /> : <span className="text-2xl">📦</span>}
                              <span className="absolute bottom-2 right-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[8px] font-black text-green-700">ADD</span>
                            </div>
                            <div className="p-2">
                              <p className="line-clamp-2 min-h-[26px] text-[9px] font-black leading-3 text-zinc-800">{product.name || "Product"}</p>
                              <p className="mt-1 text-[12px] font-black text-green-600">₹{price}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  <Link href="/categories" className="mt-3 flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[9px] font-black text-zinc-800">See all products →</Link>
                </section>
              );
            });
          })()}
        </div>

      {/* =================================================
          MATCHED NEEDS FROM MAIN SEARCH
      ================================================= */}

      {search &&
        matchedNeeds.length >
          0 && (
          <section className="mx-auto max-w-7xl px-3 pt-4">

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

              <div className="mt-4 flex flex-wrap gap-2">

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
                      className="rounded-2xl border border-yellow-300 bg-white px-3 py-2.5 text-left shadow-sm"
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
          CATEGORIES
      ================================================= */}

      <section className="hidden md:block mx-auto max-w-7xl px-3 pt-6">

        <div>

          <h2 className="text-xl font-black">
            Shop by Category
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Choose what you need
          </p>

        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">

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
            )
          )}

        </div>

      </section>
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
          <section className="mx-auto max-w-7xl px-3 pt-6">

            <div>

              <h2 className="text-xl font-black">
                ⭐ Top Brands
              </h2>

              <p className="mt-1 text-xs text-zinc-400">
                Popular brands on Night Now
              </p>

            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">

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
          PRODUCTS
      ================================================= */}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 pb-14 pt-10"
      >

        <div className="flex items-end justify-between">

          <div>

            <h2 className="text-xl font-black">
  <span className="md:hidden">
    {search ? mobileProductScrollerHeading : "More Products"}
  </span>

  <span className="hidden md:inline">
    {search &&
    matchedNeeds.length >
      0
      ? "Aapki Zarurat ke Products"
      : "Popular Products"}
  </span>
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
              setSelectedCategory(
                "All"
              );
            }}
            className="text-xs font-black text-yellow-600"
          >
            View All →
          </button>

        </div>

                {/* MOBILE + DESKTOP SORT CONTROLS */}
        <div className="mt-4 flex justify-start">
          <details className="relative w-full md:w-auto">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[11px] font-black text-zinc-700 shadow-sm md:min-w-[190px]">
              <span>↕️ Sort By</span>
              <span className="text-zinc-400">⌄</span>
            </summary>
            <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg md:absolute md:left-0 md:top-full md:z-30 md:w-[260px]">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSortMode("low")} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "low" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>Low Price</button>
                <button type="button" onClick={() => setSortMode("high")} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "high" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>High Price</button>
                <button type="button" onClick={() => setDiscountFilter("50")} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "50" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>50%+ Discount</button>
                <button type="button" onClick={() => setDiscountFilter("20")} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "20" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>20%+ Discount</button>
                <button type="button" onClick={() => setDiscountFilter("10")} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "10" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>10%+ Discount</button>
                <button type="button" onClick={() => { setSortMode("default"); setDiscountFilter("all"); }} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black text-zinc-600">Clear</button>
              </div>
              <button type="button" onClick={() => setShowSortCategory((v) => !v)} className="mt-2 flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black text-zinc-700">
                <span>Category</span><span>{showSortCategory ? "⌃" : "⌄"}</span>
              </button>
              {showSortCategory && (
                <div className="mt-2 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                  {categories.map((category) => (
                    <button key={`sort-category-${category.name}`} type="button" onClick={() => setSelectedCategory(category.name)} className={["rounded-full border px-3 py-1.5 text-[9px] font-black", selectedCategory === category.name ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        {loading ? (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-4">

            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 min-w-[145px] flex-none animate-pulse rounded-2xl bg-zinc-100 md:h-64 md:min-w-0"
              />
            ))}

          </div>
        ) : filteredProducts.length ===
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
              }}
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
            >
              Clear Search
            </button>

          </div>
        ) : (

          <div className="mt-5 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-4">

            {filteredProducts.map(
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
                    className="group relative min-w-[132px] max-w-[132px] flex-none snap-start overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 md:min-w-0 md:flex-auto md:rounded-[24px] md:shadow-[0_8px_20px_rgba(0,0,0,0.08),0_18px_45px_rgba(0,0,0,0.06)] md:hover:-translate-y-2 md:hover:scale-[1.015] md:hover:shadow-[0_18px_35px_rgba(0,0,0,0.14),0_30px_65px_rgba(0,0,0,0.10)] md:active:translate-y-0 md:[transform-style:preserve-3d]"
                  >
                    <div className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <Link href={`/product/${product.id}`}>
                      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-yellow-50/50 p-2 md:h-48 md:p-0 md:[transform:translateZ(20px)]">
                        <div className="pointer-events-none absolute bottom-5 h-5 w-24 rounded-full bg-black/10 blur-xl transition-all duration-300 group-hover:w-28 group-hover:bg-black/15" />

                        {image ? (
                          <img
                            src={image}
                            alt={product.name || "Product"}
                            className="relative z-[1] h-full w-full object-contain p-1.5 md:p-4 drop-shadow-[0_12px_10px_rgba(0,0,0,0.14)] transition-all duration-500 md:group-hover:scale-110 md:group-hover:-translate-y-1"
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

                        {stock > 0 && getMobileCartQuantity(product) <= 0 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleAddToCart(product);
                            }}
                            aria-label={`Add ${product.name || "product"} to cart`}
                            className="absolute bottom-2 right-2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xl font-black leading-none text-white shadow-[0_4px_10px_rgba(37,99,235,0.28)] transition-transform active:scale-90 md:hidden"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </Link>

                    <div className="relative border-t border-zinc-100 bg-white p-2 md:p-3.5 md:[transform:translateZ(10px)]">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="line-clamp-2 min-h-[30px] text-[10px] font-black leading-3.5 transition-colors md:min-h-[38px] md:text-sm md:leading-5 md:group-hover:text-yellow-600">
                          {product.name ||
                            product.title ||
                            product.productName ||
                            "Product"}
                        </h3>
                      </Link>

                      {product.brandName && (
                        <p className="mt-1 hidden truncate text-[9px] font-bold text-yellow-600 md:block md:text-[10px]">
                          {product.brandName}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-end gap-1 md:mt-3 md:gap-2">
                        <p className="text-sm font-black text-green-600 md:text-lg">
                          ₹{price}
                        </p>

                        {mrp > price && (
                          <>
                            <p className="hidden pb-0.5 text-[9px] text-zinc-400 line-through sm:inline md:text-[10px]">
                              MRP ₹{mrp}
                            </p>
                            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[8px] font-black text-green-700 md:px-2 md:text-[9px]">
                              {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      {stock > 0 && stock <= 5 && (
                        <p className="mt-1 text-[8px] font-bold text-orange-500 md:text-[9px]">
                          Only {stock} left
                        </p>
                      )}

                      {stock <= 0 ? (
                        <div className="mt-2 rounded-lg bg-zinc-100 py-2 text-center text-[9px] font-black text-zinc-400 md:mt-3 md:rounded-xl md:py-3 md:text-[10px]">
                          Out of Stock
                        </div>
                      ) : (
                        <>
                          {/* MOBILE ONLY: FIXED QUANTITY AREA */}
                          {/*
                            Reserve the same height even when quantity is 0.
                            This keeps the - / qty / + control locked to the
                            same vertical position for every product card.
                          */}
                          <div className="mt-2 h-9 md:hidden">
                            {getMobileCartQuantity(product) > 0 ? (
                              <div className="flex h-9 w-full items-center overflow-hidden rounded-lg bg-yellow-400">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleMobileDecrease(product);
                                  }}
                                  aria-label={`Decrease ${product.name || "product"} quantity`}
                                  className="flex h-full w-10 shrink-0 items-center justify-center bg-black text-lg font-black text-white active:bg-zinc-800"
                                >
                                  −
                                </button>

                                <span className="flex h-full min-w-0 flex-1 items-center justify-center text-xs font-black text-black">
                                  {getMobileCartQuantity(product)}
                                </span>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleMobileIncrease(product);
                                  }}
                                  disabled={getMobileCartQuantity(product) >= stock}
                                  aria-label={`Increase ${product.name || "product"} quantity`}
                                  className="flex h-full w-10 shrink-0 items-center justify-center bg-black text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-40 active:bg-zinc-800"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="h-9 w-full" aria-hidden="true" />
                            )}
                          </div>

                          {/* DESKTOP ONLY: EXISTING BUTTON UNCHANGED */}
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="mt-3 hidden w-full rounded-xl bg-yellow-400 py-3 text-[10px] font-black text-black shadow-[0_6px_0_#d4a900,0_8px_15px_rgba(0,0,0,0.10)] transition-all duration-150 md:block md:hover:-translate-y-0.5 md:hover:bg-yellow-500 md:hover:shadow-[0_6px_0_#d4a900,0_12px_20px_rgba(0,0,0,0.14)] md:active:translate-y-[3px] md:active:shadow-[0_2px_0_#d4a900]"
                          >
                            🛒 Add to Cart
                          </button>
                        </>
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
          MOBILE CART POPUP
          Appears after an item is added and links to /cart
      ================================================= */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[70px] z-[90] px-3 md:hidden">
          <Link href="/cart" className="block">
            <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-yellow-400 p-3 text-black shadow-[0_8px_30px_rgba(0,0,0,0.20)] active:scale-[0.99]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-xl text-white">
                🛒
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold">
                  {cartCount} {cartCount === 1 ? "item" : "items"} in cart
                </p>
                <p className="text-sm font-black">
                  View your cart
                </p>
              </div>

              <span className="shrink-0 rounded-xl bg-black px-3 py-2.5 text-[10px] font-black text-white">
                View Cart →
              </span>
            </div>
          </Link>
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

                          <div className="flex items-start gap-2">

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
                          className="flex items-center gap-2 rounded-2xl bg-zinc-50 p-3"
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