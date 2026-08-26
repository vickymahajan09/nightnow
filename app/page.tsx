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

import {
  getHomeSections,
} from "./services/homeSectionService";

import { getOrders } from "./services/orderService";
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
  { name: "Baby Care", icon: "👶" },
  { name: "Home Care", icon: "🏠" },
  { name: "Pet Care", icon: "🐾" },
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
    type: string;
    heading: string;
    subtitle: string;
    order: number;
    priority: number;
    active: boolean;
    showOnHome: boolean;
    productIds: string[];
    categories: string[];
    brands: string[];
    image: string;
    mobileImage: string;
    desktopImage: string;
    productLimit: number;
    seeAll: boolean;
    seeAllText: string;
    seeAllUrl: string;
    startDate: string;
    endDate: string;
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

  const searchPlaceholders = [
    "Search here...",
    "Search face wash",
    "Search Maggi",
    "Search medicines",
    "Search grocery",
    "Search personal care",
  ];

  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSearchPlaceholderIndex((current) =>
        (current + 1) % searchPlaceholders.length
      );
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [sortMode, setSortMode] =
    useState<"default" | "high" | "low">("default");
  const [discountFilter, setDiscountFilter] =
    useState<"all" | "10" | "20" | "50">("all");
  const [showCategoryBy, setShowCategoryBy] = useState(false);

  // =====================================================
  // FILTER / SORT HELPERS
  // =====================================================

  const closeSortMenu = (target?: HTMLElement | null) => {
    const details = target?.closest("details") as HTMLDetailsElement | null;
    if (details) details.open = false;
  };

  const selectHomeCategory = (categoryName: string, target?: HTMLElement | null) => {
    setSelectedCategory(categoryName);
    setShowCategoryBy(false);
    closeSortMenu(target);

    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 40);
  };

  const clearAllProductFilters = (target?: HTMLElement | null) => {
    setSearch("");
    setSelectedCategory("All");
    setSortMode("default");
    setDiscountFilter("all");
    setShowCategoryBy(false);
    closeSortMenu(target);
  };

  const applyDiscountFilter = (value: "10" | "20" | "50", target?: HTMLElement | null) => {
    setDiscountFilter(value);
    closeSortMenu(target);
  };

  const applySortMode = (value: "default" | "high" | "low", target?: HTMLElement | null) => {
    setSortMode(value);
    closeSortMenu(target);
  };

  const [showNeed, setShowNeed] = useState(false);
  const [needText, setNeedText] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
  const [smartPickMode, setSmartPickMode] = useState<"fast" | "under99" | "deals" | "value">("fast");

  const [budgetMode, setBudgetMode] = useState<"49" | "99" | "199">("99");
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  const RECENTLY_VIEWED_KEY = "nightnow_recently_viewed";

  // All real product categories + the main shopping categories.
  // This keeps the Sort By menu useful even when Admin adds new categories.
  const categoryOptions = useMemo(() => {
    const iconMap: Record<string, string> = {
      all: "🛍️",
      medicines: "💊",
      medicine: "💊",
      grocery: "🛒",
      dairy: "🥛",
      "personal care": "🧴",
      "baby care": "👶",
      "home care": "🏠",
      "pet care": "🐾",
    };

    const result = [...categories];
    const seen = new Set(result.map((item) => item.name.toLowerCase()));

    products.forEach((product: any) => {
      const raw = String(product?.category || product?.categoryName || "").trim();
      if (!raw) return;

      const name = raw.replace(/\s+/g, " ");
      const key = name.toLowerCase();

      if (key === "all" || seen.has(key)) return;

      seen.add(key);
      result.push({
        name,
        icon: iconMap[key] || "📦",
      });
    });

    return result;
  }, [products]);

  // ==========================================
  // LOAD HOME CATEGORIES FROM ADMIN
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadHomeCategories = async () => {
      try {
        try {
          const firestoreSections = await getHomeSections();

          if (!cancelled && firestoreSections.length > 0) {
            const now = new Date();

            const activeSections = firestoreSections
              .map((section: any, index: number) => ({
                key: String(section?.id || section?.key || `firestore-section-${index}`),
                section: String(section?.title || section?.section || `Section ${index + 1}`).trim(),
                type: String(section?.type || "product-carousel"),
                heading: String(section?.title || section?.heading || section?.section || `Section ${index + 1}`).trim(),
                subtitle: String(section?.subtitle || "Explore more products").trim(),
                order: Number(section?.order ?? index + 1),
                priority: Number(section?.priority ?? 1),
                active: section?.active !== false,
                showOnHome: section?.showOnHome !== false,
                productIds: Array.isArray(section?.products) ? section.products.map(String) : [],
                categories: Array.isArray(section?.categories) ? section.categories.map(String) : [],
                brands: Array.isArray(section?.brands) ? section.brands.map(String) : [],
                image: String(section?.image || ""),
                mobileImage: String(section?.mobileImage || ""),
                desktopImage: String(section?.desktopImage || ""),
                productLimit: Math.max(1, Number(section?.productLimit || 10)),
                seeAll: section?.seeAll !== false,
                seeAllText: String(section?.seeAllText || "See All"),
                seeAllUrl: String(section?.seeAllUrl || "/products"),
                startDate: String(section?.startDate || ""),
                endDate: String(section?.endDate || ""),
              }))
              .filter((section: HomeSectionConfig) => {
                if (!section.active || !section.showOnHome) return false;

                if (section.startDate) {
                  const start = new Date(section.startDate);
                  if (!Number.isNaN(start.getTime()) && now < start) return false;
                }

                if (section.endDate) {
                  const end = new Date(section.endDate);
                  if (!Number.isNaN(end.getTime()) && now > end) return false;
                }

                return true;
              })
              .sort(
                (a: HomeSectionConfig, b: HomeSectionConfig) =>
                  a.order - b.order || a.priority - b.priority
              );

            setHomeSections(activeSections);
            return;
          }
        } catch (firestoreError) {
          console.error("Firestore home sections load error:", firestoreError);
        }

        const saved = localStorage.getItem("nightnow_admin_categories");

        if (!saved) {
          localStorage.setItem(
            "nightnow_admin_categories",
            JSON.stringify(DEFAULT_HOME_CATEGORIES)
          );
          if (!cancelled) setHomeCategories(DEFAULT_HOME_CATEGORIES);
          return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          if (!cancelled) setHomeCategories(DEFAULT_HOME_CATEGORIES);
          return;
        }

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
            const sectionName =
              String(
                category?.section ||
                  category?.heading ||
                  category?.name ||
                  "Products"
              ).trim() || "Products";

            const config = sectionConfig.get(
              sectionName.toLowerCase()
            );

            return {
              ...category,
              section: sectionName,
              heading:
                String(
                  config?.heading ||
                    category.heading ||
                    sectionName
                ).trim() || sectionName,
              subtitle:
                String(
                  config?.subtitle ||
                    category.subtitle ||
                    "Explore more products"
                ).trim() || "Explore more products",
              order: Number(
                config?.order ??
                  category.order ??
                  0
              ),
              productIds: Array.isArray(
                config?.productIds
              )
                ? config.productIds.map(String)
                : Array.isArray(category.productIds)
                  ? category.productIds.map(String)
                  : [],
            };
          })
          .filter(
            (category: HomeCategory) =>
              category.active !== false &&
              category.showOnHome !== false
          )
          .sort(
            (a: HomeCategory, b: HomeCategory) =>
              Number(a.order || 0) -
              Number(b.order || 0)
          );

        if (!cancelled) {
          setHomeCategories(activeCategories);

          if (Array.isArray(sections) && sections.length > 0) {
            setHomeSections(
              sections
                .map((section: any, index: number) => ({
                  key: String(
                    section?.key ||
                      section?.section ||
                      `section-${index}`
                  ),
                  section: String(
                    section?.section ||
                      `Section ${index + 1}`
                  ),
                  type: "product-carousel",
                  heading: String(
                    section?.heading ||
                      section?.section ||
                      `Section ${index + 1}`
                  ),
                  subtitle: String(
                    section?.subtitle ||
                      "Explore more products"
                  ),
                  order: Number(
                    section?.order ??
                      index + 1
                  ),
                  priority: 1,
                  active:
                    section?.active !== false,
                  showOnHome:
                    section?.showOnHome !== false,
                  productIds: Array.isArray(
                    section?.productIds
                  )
                    ? section.productIds.map(String)
                    : [],
                  categories: [],
                  brands: [],
                  image: "",
                  mobileImage: "",
                  desktopImage: "",
                  productLimit: 10,
                  seeAll: true,
                  seeAllText: "See All",
                  seeAllUrl: "/categories",
                  startDate: "",
                  endDate: "",
                }))
                .filter(
                  (section: HomeSectionConfig) =>
                    section.active &&
                    section.showOnHome
                )
                .sort(
                  (
                    a: HomeSectionConfig,
                    b: HomeSectionConfig
                  ) => a.order - b.order
                )
            );
          } else {
            setHomeSections([]);
          }
        }
      } catch (error) {
        console.error(
          "Home category loading error:",
          error
        );

        if (!cancelled) {
          setHomeCategories([]);
          setHomeSections([]);
        }
      }
    };

    void loadHomeCategories();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "nightnow_admin_categories" ||
        event.key === HOME_SECTIONS_KEY
      ) {
        void loadHomeCategories();
      }
    };

    const handleAdminUpdate = () => {
      void loadHomeCategories();
    };

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadHomeCategories();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      "nightnow_admin_categories_updated",
      handleAdminUpdate
    );
    window.addEventListener("focus", handleAdminUpdate);
    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "nightnow_admin_categories_updated",
        handleAdminUpdate
      );
      window.removeEventListener("focus", handleAdminUpdate);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []); // ==========================================
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

  // ==========================================
  // RECENTLY VIEWED PRODUCTS
  // ==========================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentlyViewedIds(
          parsed.map(String).filter(Boolean).slice(0, 12)
        );
      }
    } catch (error) {
      console.error("Recently viewed load error:", error);
    }
  }, []);

  const recordRecentlyViewed = (productId: string) => {
    const id = String(productId);
    if (!id) return;

    setRecentlyViewedIds((current) => {
      const updated = [
        id,
        ...current.filter((item) => item !== id),
      ].slice(0, 12);

      try {
        localStorage.setItem(
          RECENTLY_VIEWED_KEY,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Recently viewed save error:", error);
      }

      return updated;
    });
  };

  const recentlyViewedProducts = useMemo(() => {
    const productMap = new Map(
      products
        .filter((product) => product.active !== false)
        .map((product) => [String(product.id), product])
    );

    return recentlyViewedIds
      .map((id) => productMap.get(id))
      .filter((product): product is Product => Boolean(product))
      .slice(0, 12);
  }, [products, recentlyViewedIds]);

  const budgetProducts = useMemo(() => {
    const limit = Number(budgetMode);

    return products
      .filter(
        (product) =>
          product.active !== false &&
          Number(product.stock || 0) > 0 &&
          Number(product.price || 0) > 0 &&
          Number(product.price || 0) <= limit
      )
      .sort((a, b) =>
        Number(a.price || 0) - Number(b.price || 0)
      )
      .slice(0, 12);
  }, [products, budgetMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // BUY AGAIN - PREVIOUSLY ORDERED PRODUCTS
  // ==========================================
  useEffect(() => {
    let cancelled = false;

    const loadBuyAgainProducts = async () => {
      if (!isLoggedIn || products.length === 0) {
        if (!cancelled) setBuyAgainProducts([]);
        return;
      }

      try {
        const orders: any[] = await getOrders();
        const seen = new Set<string>();
        const orderedIds: string[] = [];

        for (const order of orders) {
          if (String(order?.status || "").toLowerCase() === "cancelled") continue;

          const items: any[] = Array.isArray(order?.items) ? order.items : [];

          for (const item of items) {
            const id = String(item?.id || item?.productId || "");
            if (id && !seen.has(id)) {
              seen.add(id);
              orderedIds.push(id);
            }
          }
        }

        const productMap = new Map(products.map((product) => [String(product.id), product]));
        const result = orderedIds
          .map((id) => productMap.get(id))
          .filter((product): product is Product => Boolean(product))
          .slice(0, 12);

        if (!cancelled) setBuyAgainProducts(result);
      } catch (error) {
        console.error("Buy Again loading error:", error);
        if (!cancelled) setBuyAgainProducts([]);
      }
    };

    void loadBuyAgainProducts();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, products]);

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

  // ============================================================
  // DYNAMIC HOME PAGE BUILDER RENDERER
  // ============================================================
  const getSectionProducts = (section: HomeSectionConfig) => {
    const selectedIds = new Set((section.productIds || []).map(String));

    let result: Product[] = products.filter((product) => product.active !== false);

    if (selectedIds.size > 0) {
      result = result.filter((product) => selectedIds.has(String(product.id)));
    } else if ((section.brands || []).length > 0) {
      const selectedBrands = new Set((section.brands || []).map(String));
      result = result.filter((product: any) =>
        selectedBrands.has(String(product.brandId || "")) ||
        selectedBrands.has(String(product.brandName || "")) ||
        selectedBrands.has(String(product.brand || ""))
      );
    }

    return result.slice(0, Math.max(1, Number(section.productLimit || 10)));
  };

  const getCompactProductCard = (
    product: Product,
    keyPrefix: string
  ) => {
    const imageUrl = getProductImage(product);
    const price = Number(product.price || 0);
    const mrp = Number(product.mrp || 0);
    const stock = Number(product.stock || 0);
    const discount = mrp > price && mrp > 0
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;
    const quantity = getMobileCartQuantity(product);

    return (
      <div
        key={`${keyPrefix}-${product.id}`}
        className="w-[98px] shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        <Link
          href={`/product/${product.id}`}
          className="block"
          onClick={() => recordRecentlyViewed(product.id)}
        >
          <div className="relative flex aspect-square items-center justify-center bg-white p-1.5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name || "Product"}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl">📦</span>
            )}

            {discount > 0 && (
              <span className="absolute left-0 top-2 rounded-r-full bg-green-500 px-1.5 py-0.5 text-[7px] font-black text-white">
                {discount}% OFF
              </span>
            )}
          </div>

          <div className="px-1.5 pb-1">
            <p className="line-clamp-2 min-h-[24px] text-[8px] font-black leading-3 text-zinc-900">
              {product.name || product.title || product.productName || "Product"}
            </p>

            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[11px] font-black text-green-600">
                ₹{price}
              </span>
              {mrp > price && (
                <span className="truncate text-[7px] text-zinc-400 line-through">
                  ₹{mrp}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="px-1.5 pb-1.5">
          {quantity > 0 ? (
            <div className="flex h-7 items-center justify-between rounded-lg bg-yellow-400 px-1">
              <button
                type="button"
                onClick={() => handleMobileDecrease(product)}
                className="h-5 w-5 rounded-md bg-black text-[12px] font-black text-white"
              >
                −
              </button>
              <span className="text-[9px] font-black text-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleMobileIncrease(product)}
                disabled={stock <= 0 || quantity >= stock}
                className="h-5 w-5 rounded-md bg-black text-[12px] font-black text-white disabled:opacity-30"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAddToCart(product)}
              disabled={stock <= 0}
              aria-label={`Add ${product.name || "product"} to cart`}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-lg font-black leading-none text-white shadow-sm disabled:opacity-30"
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  };

  const getSmartPickProducts = () => {
    const active = products.filter((product) => product.active !== false && Number(product.stock || 0) > 0);

    if (smartPickMode === "under99") {
      return active.filter((product) => Number(product.price || 0) <= 99).slice(0, 12);
    }

    if (smartPickMode === "deals") {
      return [...active]
        .map((product) => {
          const price = Number(product.price || 0);
          const mrp = Number(product.mrp || 0);
          const discount = mrp > price && mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
          return { product, discount };
        })
        .sort((a, b) => b.discount - a.discount)
        .filter((item) => item.discount > 0)
        .slice(0, 12)
        .map((item) => item.product);
    }

    if (smartPickMode === "value") {
      return [...active]
        .map((product) => {
          const price = Number(product.price || 0);
          const mrp = Number(product.mrp || 0);
          const discount = mrp > price && mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
          return { product, score: discount * 2 + Math.max(0, 100 - price) / 10 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((item) => item.product);
    }

    return active.slice(0, 12);
  };

  const renderDynamicHomeSection = (section: HomeSectionConfig, mobile: boolean) => {
    const sectionProducts = getSectionProducts(section);
    const selectedCategoryIds = new Set((section.categories || []).map(String));
    const sectionCategories = homeCategories.filter((category) =>
      selectedCategoryIds.has(String(category.id))
    );

    const type = String(section.type || "product-carousel");
    const image = mobile
      ? section.mobileImage || section.image
      : section.desktopImage || section.image;

    if (type === "category-carousel") {
      return (
        <section key={`${mobile ? "m" : "d"}-${section.key}`} className={mobile ? "px-3 pb-5 pt-4" : "mx-auto max-w-7xl px-4 pb-7 pt-7"}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className={mobile ? "text-[18px] font-black" : "text-xl font-black"}>{section.heading}</h2>
              {section.subtitle && <p className="mt-1 text-xs text-zinc-400">{section.subtitle}</p>}
            </div>
            {section.seeAll && <Link href={section.seeAllUrl || "/categories"} className="text-xs font-black text-yellow-600">{section.seeAllText || "See All"} →</Link>}
          </div>
          <div className={mobile ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8"}>
            {sectionCategories.map((category) => (
              <Link key={`${section.key}-${category.id}`} href={`/categories?category=${encodeURIComponent(category.name)}`} className={mobile ? "w-[78px] shrink-0 text-center" : "rounded-2xl border border-zinc-200 bg-white p-3 text-center"}>
                <div className={mobile ? "flex h-[72px] items-center justify-center rounded-xl bg-zinc-50" : "flex h-24 items-center justify-center rounded-xl bg-zinc-50"}>
                  {category.image ? <img src={category.image} alt={category.name} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-2xl">🛍️</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] font-black">{category.name}</p>
              </Link>
            ))}
            {sectionCategories.length === 0 && <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-xs text-zinc-400">Admin में categories select करें।</div>}
          </div>
        </section>
      );
    }

    if ((type === "banner" || type === "offer") && image) {
      return (
        <section key={`${mobile ? "m" : "d"}-${section.key}`} className={mobile ? "px-3 pb-5 pt-4" : "mx-auto max-w-7xl px-4 pb-7 pt-7"}>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className={mobile ? "text-[18px] font-black" : "text-xl font-black"}>{section.heading}</h2>
              {section.subtitle && <p className="mt-1 text-xs text-zinc-400">{section.subtitle}</p>}
            </div>
            {section.seeAll && <Link href={section.seeAllUrl || "/products"} className="text-xs font-black text-yellow-600">{section.seeAllText || "See All"} →</Link>}
          </div>
          <Link href={section.seeAllUrl || "/products"} className="block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <img src={image} alt={section.heading} className="max-h-[360px] w-full object-cover" loading="lazy" />
          </Link>
        </section>
      );
    }

    return (
      <section key={`${mobile ? "m" : "d"}-${section.key}`} className={mobile ? "px-3 pb-5 pt-4" : "mx-auto max-w-7xl px-4 pb-7 pt-7"}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className={mobile ? "text-[18px] font-black leading-5" : "text-xl font-black"}>{section.heading}</h2>
            {section.subtitle && <p className="mt-1 text-xs text-zinc-400">{section.subtitle}</p>}
          </div>
          {section.seeAll && <Link href={section.seeAllUrl || "/products"} className="shrink-0 text-xs font-black text-yellow-600">{section.seeAllText || "See All"} →</Link>}
        </div>

        <div className={mobile ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "grid grid-cols-4 gap-3 lg:grid-cols-6"}>
          {sectionProducts.map((product) => getCompactProductCard(product, section.key))}
          {sectionProducts.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-xs text-zinc-400">इस section में products select नहीं हैं।</div>}
        </div>
      </section>
    );
  };


  // ============================================================
  // HOME OFFERS
  // ============================================================
  const getOfferProductsForHome = (offer: Offer) => {
    const productIds = new Set(Array.isArray(offer.productIds) ? offer.productIds.map(String) : []);
    const brandIds = new Set(Array.isArray(offer.brandIds) ? offer.brandIds.map(String) : []);

    return products.filter((product: any) => {
      if (product?.active === false) return false;
      const productId = String(product?.id || "");
      const brandId = String(product?.brandId || product?.brand || product?.brandID || product?.brandName || "");
      return productIds.has(productId) || (brandId && brandIds.has(brandId));
    });
  };

  const getHomeOfferLabel = (offer: Offer) => {
    if (offer.type === "BUY_1_GET_1") return "BUY 1 GET 1";
    if (offer.type === "BUY_1_GET_2") return "BUY 1 GET 2";
    if (offer.type === "BUY_X_GET_Y") return `BUY ${offer.buyQuantity || 1} GET ${offer.freeQuantity || 1}`;
    return "SPECIAL OFFER";
  };
  
  const homeVisibleOffers = offers.filter(
    (offer) => offer.active !== false
  );

  return (
   <main className="min-h-screen bg-gradient-to-br from-[#fff7ed] via-[#f5f7ff] to-[#f3efff] text-zinc-900">

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
      placeholder={searchPlaceholders[searchPlaceholderIndex]}
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
      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-2xl">

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

        {/* =================================================
            DESKTOP FILTER BAR - SORT BY + CATEGORY BY
        ================================================= */}
        <div className="hidden w-full border-t border-purple-100 bg-white/95 px-4 py-2 md:block">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[11px] font-black text-zinc-700 shadow-sm">
                <span>↕️ Sort By</span>
                <span className="text-zinc-400">⌄</span>
              </summary>
              <div className="absolute left-0 top-[calc(100%+6px)] z-[120] w-[320px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
                <p className="px-1 pb-2 text-[9px] font-black uppercase tracking-wider text-zinc-400">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={(e) => applySortMode("default", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "default" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>Recommended</button>
                  <button type="button" onClick={(e) => applySortMode("low", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "low" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>Low Price</button>
                  <button type="button" onClick={(e) => applySortMode("high", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "high" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>High Price</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("10", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "10" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>10%+ OFF</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("20", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "20" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>20%+ OFF</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("50", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "50" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>50%+ OFF</button>
                </div>
              </div>
            </details>

            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[11px] font-black text-zinc-700 shadow-sm">
                <span>🗂️ Category By</span>
                <span className="text-zinc-400">⌄</span>
              </summary>
              <div className="absolute left-0 top-[calc(100%+6px)] z-[120] w-[340px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Category By</p>
                  <button type="button" onClick={(e) => clearAllProductFilters(e.currentTarget)} className="text-[9px] font-black text-yellow-700">All Products</button>
                </div>
                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                  {categoryOptions.map((category) => (
                    <button key={`desktop-category-by-${category.name}`} type="button" onClick={(e) => selectHomeCategory(category.name, e.currentTarget)} className={["rounded-xl border px-2.5 py-2.5 text-left text-[9px] font-black", selectedCategory === category.name ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            {(selectedCategory !== "All" || sortMode !== "default" || discountFilter !== "all") && (
              <button type="button" onClick={(e) => clearAllProductFilters(e.currentTarget)} className="rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2.5 text-[10px] font-black text-yellow-800">Clear Filters</button>
            )}
          </div>
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
                placeholder={searchPlaceholders[searchPlaceholderIndex]}
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


        {/* =================================================
            MOBILE FILTERS - SORT BY + CATEGORY BY
            Both filters stay directly below the search bar.
        ================================================= */}
        <div className="w-full basis-full border-t border-zinc-100 bg-white px-3 py-2 md:hidden">
          <div className="flex gap-2">
            <details className="relative min-w-0 flex-1">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[10px] font-black text-zinc-700 shadow-sm">
                <span>↕️ Sort By</span>
                <span className="text-zinc-400">⌄</span>
              </summary>
              <div className="absolute left-0 top-[calc(100%+6px)] z-[120] w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
                <p className="px-1 pb-2 text-[9px] font-black uppercase tracking-wider text-zinc-400">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={(e) => applySortMode("default", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "default" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>Recommended</button>
                  <button type="button" onClick={(e) => applySortMode("low", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "low" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>Low Price</button>
                  <button type="button" onClick={(e) => applySortMode("high", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", sortMode === "high" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>High Price</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("10", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "10" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>10%+ OFF</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("20", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "20" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>20%+ OFF</button>
                  <button type="button" onClick={(e) => applyDiscountFilter("50", e.currentTarget)} className={["rounded-xl border px-3 py-2 text-[10px] font-black", discountFilter === "50" ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>50%+ OFF</button>
                </div>
              </div>
            </details>

            <details className="relative min-w-0 flex-1">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[10px] font-black text-zinc-700 shadow-sm">
                <span>🗂️ Category By</span>
                <span className="text-zinc-400">⌄</span>
              </summary>
              <div className="absolute right-0 top-[calc(100%+6px)] z-[120] w-[300px] max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Category By</p>
                  <button type="button" onClick={(e) => clearAllProductFilters(e.currentTarget)} className="text-[9px] font-black text-yellow-700">All Products</button>
                </div>
                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                  {categoryOptions.map((category) => (
                    <button key={`mobile-category-by-${category.name}`} type="button" onClick={(e) => selectHomeCategory(category.name, e.currentTarget)} className={["rounded-xl border px-2.5 py-2.5 text-left text-[9px] font-black", selectedCategory === category.name ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-200 bg-white text-zinc-600"].join(" ")}>
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          </div>

          {(selectedCategory !== "All" || sortMode !== "default" || discountFilter !== "all") && (
            <button type="button" onClick={(e) => clearAllProductFilters(e.currentTarget)} className="mt-2 w-full rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-[9px] font-black text-yellow-800">Clear Filters</button>
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
    MOBILE QUICK CATEGORIES REMOVED
    Categories are now available from the Sort By menu
    and the dedicated category navigation below.
================================================= */}

        {/* =================================================
            SMART PICKS
        ================================================= */}
        <section className="mx-2 rounded-3xl border border-indigo-100 bg-gradient-to-br from-[#e8f1ff] via-[#ffffff] to-[#f7eaff] px-3 pb-4 pt-4 shadow-[0_10px_30px_rgba(79,70,229,0.10)] md:mx-auto md:max-w-7xl md:px-4 md:pb-6 md:pt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">NightNow 
Smart Picks</p>
              <h2 className="mt-1 text-[18px] font-black leading-5 md:text-xl">What are you looking for?</h2>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "fast" as const, icon: "⚡", title: "Fast Picks", sub: "Ready now" },
              { id: "under99" as const, icon: "₹", title: "Under ₹99", sub: "Budget picks" },
              { id: "deals" as const, icon: "🔥", title: "Hot Deals", sub: "Best discounts" },
              { id: "value" as const, icon: "💎", title: "Value Picks", sub: "Smart value" },
            ].map((item) => {
              const active = smartPickMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSmartPickMode(item.id)}
                  className={`w-[60px] h-[58px] shrink-0 rounded-xl border px-1.5 py-1 text-left transition ${active ? "border-blue-500 bg-blue-500 text-white shadow-md" : "border-zinc-200 bg-white/95 text-zinc-900 shadow-sm"}`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <p className="mt-0.5 truncate text-[8px] font-black leading-3">{item.title}</p>
                  <p className={`truncate text-[6px] leading-3 ${active ? "text-blue-100" : "text-zinc-400"}`}>{item.sub}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {getSmartPickProducts().map((product) => getCompactProductCard(product, `smart-${smartPickMode}`))}
            {getSmartPickProducts().length === 0 && (
              <div className="w-full rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-center text-xs text-zinc-400">
                Is category me abhi products available nahi hain.
              </div>
            )}
          </div>
        </section>


        {/* =================================================
            TODAY'S OFFERS
        ================================================= */}
        {homeVisibleOffers.length > 0 && (
          <section className="mx-2 rounded-3xl border border-yellow-100 bg-gradient-to-br from-[#fff9df] via-white to-[#fff3e8] px-3 pb-5 pt-4 shadow-[0_10px_30px_rgba(245,158,11,0.08)] md:mx-auto md:max-w-7xl md:px-4 md:pb-7 md:pt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500">NightNow Deals</p>
                <h2 className="mt-1 text-[18px] font-black leading-5 md:text-xl">🔥 Today's Offers</h2>
                <p className="mt-1 text-[9px] text-zinc-400">Save more with our latest offers</p>
              </div>
              <Link href="/offers" className="shrink-0 text-[10px] font-black text-yellow-700">View All →</Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 lg:grid-cols-4">
              {homeVisibleOffers.slice(0, 8).map((offer) => {
                const offerProducts = getOfferProductsForHome(offer);
                const previewProducts = offerProducts.slice(0, 4);
                const remaining = Math.max(0, offerProducts.length - previewProducts.length);

                return (
                  <Link key={`home-offer-${String(offer.id)}`} href={`/offers/${encodeURIComponent(String(offer.id))}`} className="group w-[220px] shrink-0 overflow-hidden rounded-2xl border border-yellow-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:w-auto">
                    <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-300 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="line-clamp-1 text-xs font-black text-black">{offer.title || "Special Offer"}</h3>
                        <span className="shrink-0 rounded-full bg-black px-2 py-1 text-[7px] font-black text-white">{getHomeOfferLabel(offer)}</span>
                      </div>
                    </div>

                    <div className="p-3">
                      {previewProducts.length > 0 ? (
                        <div className="flex items-center justify-center py-1">
                          {previewProducts.map((product: any, index: number) => {
                            const image = getProductImage(product);
                            return (
                              <div key={`home-offer-product-${String(product.id)}-${index}`} className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-zinc-50 shadow-sm ${index > 0 ? "-ml-2" : ""}`}>
                                {image ? <img src={image} alt={product.name || "Product"} className="h-full w-full object-contain p-1" loading="lazy" /> : <span className="text-lg">📦</span>}
                              </div>
                            );
                          })}
                          {remaining > 0 && <div className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-black text-[9px] font-black text-white shadow-sm">+{remaining}</div>}
                        </div>
                      ) : (
                        <div className="flex h-12 items-center justify-center rounded-xl bg-zinc-50 text-[9px] font-bold text-zinc-400">View offer products</div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                        <span className="text-[8px] font-bold text-zinc-400">{offerProducts.length > 0 ? `${offerProducts.length} products` : "Special deal"}</span>
                        <span className="text-[9px] font-black text-yellow-700 transition group-hover:translate-x-0.5">Shop Offer →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* =================================================
            BUDGET ZONE
        ================================================= */}
        <section className="mx-2 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50 px-3 pb-5 pt-3 md:mx-auto md:max-w-7xl md:px-4 md:pb-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">NightNow Budget Zone</p>
              <h2 className="mt-1 text-[18px] font-black leading-5 md:text-xl">Best Picks Under Your Budget</h2>
              <p className="mt-1 text-[9px] text-zinc-400">Smart products at pocket-friendly prices</p>
            </div>
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "49" as const, label: "Under ₹49", icon: "💸" },
              { id: "99" as const, label: "Under ₹99", icon: "🔥" },
              { id: "199" as const, label: "Under ₹199", icon: "💰" },
            ].map((item) => {
              const active = budgetMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBudgetMode(item.id)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left transition ${active ? "border-emerald-500 bg-emerald-500 text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-900"}`}
                >
                  <span className="mr-1 text-sm">{item.icon}</span>
                  <span className="text-[10px] font-black">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-3 lg:grid-cols-6">
            {budgetProducts.map((product) =>
              getCompactProductCard(product, `budget-${budgetMode}`)
            )}
            {budgetProducts.length === 0 && (
              <div className="w-full rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-center text-xs text-zinc-400 md:col-span-full">
                Is budget range me abhi products available nahi hain.
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            RECENTLY VIEWED
        ================================================= */}
        {recentlyViewedProducts.length > 0 && (
          <section className="px-3 pb-5 pt-1 md:mx-auto md:max-w-7xl md:px-4 md:pb-7">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-500">Continue Shopping</p>
                <h2 className="mt-1 text-[18px] font-black leading-5 md:text-xl">Recently Viewed</h2>
                <p className="mt-1 text-[9px] text-zinc-400">Pick up where you left off</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-3 lg:grid-cols-6">
              {recentlyViewedProducts.map((product) =>
                getCompactProductCard(product, "recently-viewed")
              )}
            </div>
          </section>
        )}

        {/* =================================================
            BUY AGAIN
        ================================================= */}
        {isLoggedIn && buyAgainProducts.length > 0 && (
          <section className="px-3 pb-5 pt-2 md:mx-auto md:max-w-7xl md:px-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black leading-5 md:text-xl">Buy Again</h2>
                <p className="mt-1 text-[9px] text-zinc-400">Your recently purchased products</p>
              </div>
              <Link href="/orders" className="text-[10px] font-black text-yellow-600">View Orders →</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {buyAgainProducts.map((product) => getCompactProductCard(product, "buy-again"))}
            </div>
          </section>
        )}

        {/* =================================================
            DYNAMIC HOME PAGE BUILDER - MOBILE
        ================================================= */}
        <div className="md:hidden">
          {homeSections.map((section) =>
            renderDynamicHomeSection(section, true)
          )}
        </div>

        {/* =================================================
            DYNAMIC HOME PAGE BUILDER - DESKTOP
        ================================================= */}
        <div className="hidden md:block">
          {homeSections.map((section) =>
            renderDynamicHomeSection(section, false)
          )}
        </div>

      {/* =================================================
          MATCHED NEEDS FROM MAIN SEARCH
      ================================================= */}

      {search &&
        matchedNeeds.length >
          0 && (
          <section className="mx-auto max-w-7xl px-3 pt-4">

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-3">

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

        <div className="mt-5 flex gap-3 overflow-x-auto rounded-3xl border border-violet-100 bg-white/80 p-3 pb-3 shadow-[0_10px_35px_rgba(76,29,149,0.06)] backdrop-blur">

          {categoryOptions.map(
            (category) => (
              <button
                key={
                  category.name
                }
                type="button"
                onClick={() =>
                  selectHomeCategory(category.name)
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
            onClick={(e) => clearAllProductFilters(e.currentTarget)}
            className="text-xs font-black text-yellow-600"
          >
            View All →
          </button>

        </div>

       {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="aspect-square w-full animate-pulse bg-zinc-100" />
                <div className="space-y-2 p-2.5">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
                  <div className="h-7 w-7 animate-pulse rounded-lg bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-zinc-50 p-10 text-center">
            <div className="text-5xl">🔍</div>
            <h3 className="mt-4 font-black">Product nahi mila</h3>
            {search && (
              <p className="mt-2 text-xs text-zinc-400">
                Search: <span className="font-bold text-zinc-600">{search}</span>
              </p>
            )}
            <button
              type="button"
              onClick={(e) => clearAllProductFilters(e.currentTarget)}
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="mt-5 flex gap-2.5 overflow-x-auto overflow-y-hidden pb-3 scrollbar-hide snap-x snap-mandatory">
            {filteredProducts.map((product) =>
              getCompactProductCard(product, "products")
            )}
          </div>
        )}

      </section>

      {/* =================================================
    MOBILE STICKY CART BAR
================================================= */}
{cartCount > 0 && (
  <div className="fixed inset-x-0 bottom-3 z-[90] px-3 md:hidden">
    <Link href="/cart" className="block">
      <div
        className="
          mx-auto
          flex
          max-w-md
          items-center
          gap-2
          rounded-2xl
          border
          border-zinc-200
          bg-white
          px-3
          py-2
          text-black
          shadow-[0_8px_30px_rgba(0,0,0,0.18)]
          active:scale-[0.99]
        "
      >
        {/* CART ICON */}
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-yellow-400
            text-lg
          "
        >
          🛒
        </div>

        {/* CART INFO */}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold text-zinc-500">
            {cartCount}{" "}
            {cartCount === 1 ? "item" : "items"} in cart
          </p>

          <p className="truncate text-[12px] font-black text-zinc-900">
            Ready to checkout
          </p>
        </div>

        {/* VIEW CART */}
        <span
          className="
            shrink-0
            rounded-xl
            bg-black
            px-3
            py-2
            text-[9px]
            font-black
            text-white
          "
        >
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