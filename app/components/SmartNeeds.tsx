"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { getNeeds, type Need } from "../services/needService";
import { getBrands, type Brand } from "../services/brandService";

const scenarios = [
  {
    id: "party",
    icon: "🎉",
    title: "मुझे पार्टी करनी है",
    keywords: ["chips", "cold", "drink", "namkeen", "ice", "plate", "tissue"],
  },
  {
    id: "guests",
    icon: "👨‍👩‍👧",
    title: "मेहमान आने वाले हैं",
    keywords: ["snacks", "cold", "drink", "biscuit", "chocolate", "plate", "tissue"],
  },
  {
    id: "baby",
    icon: "👶",
    title: "Baby Emergency",
    keywords: ["diaper", "baby", "wipes", "baby food"],
  },
  {
    id: "home",
    icon: "🏠",
    title: "घर का सामान खत्म हो गया",
    keywords: ["milk", "bread", "egg", "atta", "flour", "oil", "grocery"],
  },
  {
    id: "midnight",
    icon: "🌙",
    title: "Midnight Snacks",
    keywords: ["chips", "chocolate", "cold", "drink", "ice cream", "namkeen"],
  },
  {
    id: "personal",
    icon: "🧴",
    title: "Personal Care",
    keywords: ["soap", "shampoo", "toothpaste", "skin care"],
  },
];

type Product = {
  id: string;
  name?: string;
  category?: string;
  brand?: string;
  image?: string;
  images?: string[];
  price?: number;
  mrp?: number;
  stock?: number;
  variantId?: string;
  variantName?: string;
  size?: string;
  weight?: string;
  volume?: string;
  pack?: string;
  description?: string;
  searchKeywords?: string[];
  [key: string]: any;
};

function text(value: any) {
  if (Array.isArray(value)) {
    return value.join(" ").toLowerCase();
  }

  return String(value || "").toLowerCase();
}

export default function SmartNeeds() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] =
    useState<any>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [needs, setNeeds] =
    useState<Need[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const {
    addToCart,
    removeFromCart,
    getItemQuantity,
  } = useCart();

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = async () => {
    if (products.length > 0 && needs.length > 0) return products;

    try {
      setLoading(true);

      const { collection, getDocs } =
        await import("firebase/firestore");

      const { db } =
        await import("../lib/firebase");

      const [snapshot, needData, brandData] =
        await Promise.all([
          getDocs(collection(db, "products")),
          getNeeds(),
          getBrands(),
        ]);

      const data =
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

      setProducts(data);
      setNeeds(
        needData.filter(
          (item) => item.active !== false
        )
      );
      setBrands(
        brandData.filter((item) => item.active !== false)
      );
      return data;
    } catch (error) {
      console.error(
        "SmartNeeds products error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PRODUCT SEARCH TEXT
  // =====================================================

  const productText = (product: Product) => {
    return [
      product.name,
      product.category,
      product.categoryName,
      product.brand,
      product.brandName,
      product.description,
      product.searchKeywords,
      product.size,
      product.weight,
      product.volume,
      product.pack,
    ]
      .map(text)
      .join(" ");
  };

  // =====================================================
  // BRAND MATCHING
  // =====================================================

  const productMatchesBrand = (
    product: Product,
    brandId: string
  ) => {
    const brand = brands.find(
      (item) => String(item.id) === String(brandId)
    );
    const brandName = text(brand?.name || brandId);
    const productBrandId = String(product.brandId || "");
    const productBrandName = text(
      product.brandName || product.brand || ""
    );

    return (
      productBrandId === String(brandId) ||
      (!!brandName && productBrandName === brandName) ||
      (!!brandName && productBrandName.includes(brandName))
    );
  };

  // =====================================================
  // MATCH PRODUCTS
  // =====================================================

  const matchingProducts = useMemo(() => {
    if (!selected) return [];

    const keywords = Array.isArray(selected.keywords)
      ? selected.keywords.map((keyword: string) => keyword.toLowerCase().trim()).filter(Boolean)
      : [];

    const selectedProductIds = Array.isArray(selected.productIds)
      ? selected.productIds.map(String)
      : [];

    const selectedBrandIds = Array.isArray(selected.brandIds)
      ? selected.brandIds.map(String)
      : [];

    if (!keywords.length && !selectedProductIds.length && !selectedBrandIds.length) {
      return [];
    }

    return products
      .filter((product) => product.active !== false)
      .map((product) => {
        const searchable =
          productText(product);

        let score = 0;

        if (selectedProductIds.includes(String(product.id))) {
          score += 100;
        }

        if (
          selectedBrandIds.some((brandId: string) =>
            productMatchesBrand(product, brandId)
          )
        ) {
          score += 50;
        }

        keywords.forEach(
          (keyword: string) => {
            if (
              searchable.includes(
                keyword.toLowerCase()
              )
            ) {
              score +=
                keyword.length > 5
                  ? 3
                  : 1;
            }
          }
        );

        return {
          product,
          score,
        };
      })
      .filter(
        (item) => item.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 12)
      .map(
        (item) =>
          item.product
      );
  }, [
    products,
    selected,
    brands,
  ]);

  // =====================================================
  // CUSTOM SEARCH
  // =====================================================

  const findProducts = async () => {
    const loadedProducts = await loadProducts();

    const sourceProducts =
      loadedProducts && loadedProducts.length > 0
        ? loadedProducts
        : products;

    const searchText =
      search.trim().toLowerCase();

    if (!searchText) return;

    const words =
      searchText.split(/\s+/);

    const results =
      sourceProducts
        .map((product) => {
          const searchable =
            productText(product);

          let score = 0;

          words.forEach((word) => {
            if (
              word.length > 2 &&
              searchable.includes(word)
            ) {
              score += 2;
            }
          });

          // Common searches
          const maps: Record<
            string,
            string[]
          > = {
            movie: [
              "chips",
              "chocolate",
              "cold",
              "drink",
              "namkeen",
              "snacks",
            ],

            cricket: [
              "chips",
              "cold",
              "drink",
              "namkeen",
            ],

            party: [
              "chips",
              "cold",
              "drink",
              "namkeen",
              "plate",
            ],

            baby: [
              "diaper",
              "wipes",
              "baby",
            ],

            midnight: [
              "chips",
              "chocolate",
              "namkeen",
            ],
          };

          words.forEach((word) => {
            const related =
              maps[word] || [];

            related.forEach(
              (keyword) => {
                if (
                  searchable.includes(
                    keyword
                  )
                ) {
                  score += 3;
                }
              }
            );
          });

          return {
            product,
            score,
          };
        })
        .filter(
          (item) =>
            item.score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .slice(0, 12)
        .map(
          (item) =>
            item.product
        );

    setSelected({
      id: "custom",
      title: search,
      keywords: words,
    });

    setCustomResults(
      results
    );
  };

  const [
    customResults,
    setCustomResults,
  ] = useState<Product[]>([]);

  // =====================================================
  // FINAL PRODUCTS
  // =====================================================

  const visibleProducts =
    selected?.id === "custom"
      ? customResults
      : matchingProducts;

  // =====================================================
  // SELECT SCENARIO
  // =====================================================

  const choose = async (
    scenario: any
  ) => {
    setSelected(scenario);
    setSearch("");
    setCustomResults([]);

    await loadProducts();
  };

  // =====================================================
  // ADD
  // =====================================================

  const addProduct = (
    product: Product
  ) => {
    addToCart({
      ...product,
      quantity: 1,
      variantId:
        product.variantId ||
        "default",
    });
  };

  // =====================================================
  // REMOVE
  // =====================================================

  const removeProduct = (
    product: Product
  ) => {
    removeFromCart(
      product.id,
      product.variantId ||
        "default"
    );
  };

  // =====================================================
  // VIEW
  // =====================================================

  return (
    <section className="bg-white px-4 py-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            MAIN BUTTON
        ================================================= */}

        <div className="flex justify-center">

          <button
            type="button"
            onClick={() => {
              setOpen(!open);

              if (!open) {
                loadProducts();
              }
            }}
            className="flex w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-300 px-5 py-4 shadow-lg"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">
                🤖
              </div>

              <div className="text-left">

                <p className="text-xs font-black text-zinc-600">
                  NIGHT NOW SMART
                </p>

                <p className="text-lg font-black">
                  आपकी जरूरत?
                </p>

              </div>

            </div>

            <span className="text-2xl font-black">
              {open ? "−" : "+"}
            </span>

          </button>

        </div>

        {/* =================================================
            OPEN CONTENT
        ================================================= */}

        {open && (
          <div className="mt-5 rounded-3xl bg-zinc-50 p-4 md:p-6">

            <h2 className="text-2xl font-black">
              आपको क्या चाहिए?
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              अपनी जरूरत चुनिए।
            </p>

            {/* SCENARIOS */}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              {(needs.length > 0
                ? needs.map((need) => ({
                    id: need.id,
                    icon: need.icon,
                    title: need.title,
                    keywords: need.keywords,
                    brandIds: need.brandIds,
                    productIds: need.productIds,
                  }))
                : scenarios
              ).map((scenario: any) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => choose(scenario)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected?.id === scenario.id
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-zinc-200 bg-white hover:border-yellow-300"
                  }`}
                >
                  <div className="text-3xl">
                    {scenario.icon}
                  </div>
                  <p className="mt-3 text-sm font-black">
                    {scenario.title}
                  </p>
                </button>
              ))}

            </div>

            {/* CUSTOM SEARCH */}

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">

              <p className="text-sm font-black">
                🤖 अपनी जरूरत लिखें
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      findProducts();
                    }
                  }}
                  placeholder="जैसे movie time के लिए snacks चाहिए"
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />

                <button
                  type="button"
                  onClick={
                    findProducts
                  }
                  className="rounded-xl bg-zinc-900 px-6 py-3 font-black text-white"
                >
                  Find
                </button>

              </div>

            </div>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {selected && (
              <div className="mt-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs font-black uppercase text-yellow-600">
                      Suggested Products
                    </p>

                    <h3 className="mt-1 text-xl font-black">
                      {selected.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(null)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    ×
                  </button>

                </div>

                {loading ? (
                  <div className="py-10 text-center font-bold text-zinc-500">
                    Products loading...
                  </div>
                ) : visibleProducts.length ===
                  0 ? (
                  <div className="mt-4 rounded-2xl bg-white p-8 text-center">
                    <div className="text-4xl">
                      🔍
                    </div>

                    <p className="mt-3 font-black">
                      Matching products नहीं मिले
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">

                    {visibleProducts.map(
                      (product) => {

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

                        const stock =
                          Number(
                            product.stock ||
                              0
                          );

                        const quantity =
                          getItemQuantity(
                            product.id,
                            product.variantId ||
                              "default"
                          );

                        const image =
                          product.image ||
                          product.images?.[0] ||
                          "/no-image.png";

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
                            key={
                              product.id
                            }
                            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
                          >

                            {/* IMAGE */}

                            <Link
                              href={`/product/${product.id}`}
                              className="shrink-0"
                            >
                              <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-50">

                                {discount >
                                  0 && (
                                  <span className="absolute left-1 top-1 rounded bg-green-600 px-1 text-[8px] font-black text-white">
                                    {discount}%
                                  </span>
                                )}

                                <img
                                  src={image}
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-contain"
                                />

                              </div>
                            </Link>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">

                              <Link
                                href={`/product/${product.id}`}
                              >
                                <h4 className="line-clamp-2 text-sm font-black">
                                  {product.name ||
                                    "Product"}
                                </h4>
                              </Link>

                              <div className="mt-1 flex items-center gap-2">

                                <span className="font-black">
                                  ₹{price}
                                </span>

                                {mrp >
                                  price && (
                                  <span className="text-xs text-zinc-400 line-through">
                                    ₹{mrp}
                                  </span>
                                )}

                              </div>

                              {/* ADD / MINUS PLUS */}

                              {quantity ===
                              0 ? (

                                <button
                                  type="button"
                                  disabled={
                                    stock ===
                                    0
                                  }
                                  onClick={() =>
                                    addProduct(
                                      product
                                    )
                                  }
                                  className="mt-2 rounded-lg bg-yellow-400 px-5 py-2 text-xs font-black disabled:bg-zinc-200 disabled:text-zinc-400"
                                >
                                  {stock ===
                                  0
                                    ? "OUT OF STOCK"
                                    : "ADD"}
                                </button>

                              ) : (

                                <div className="mt-2 flex h-9 w-fit items-center overflow-hidden rounded-lg bg-yellow-400">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeProduct(
                                        product
                                      )
                                    }
                                    className="h-full w-9 bg-black text-lg font-black text-white"
                                  >
                                    −
                                  </button>

                                  <span className="flex w-10 items-center justify-center text-xs font-black">
                                    {quantity}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={
                                      stock >
                                        0 &&
                                      quantity >=
                                        stock
                                    }
                                    onClick={() =>
                                      addProduct(
                                        product
                                      )
                                    }
                                    className="h-full w-9 bg-black text-lg font-black text-white disabled:opacity-40"
                                  >
                                    +
                                  </button>

                                </div>

                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

                {/* =================================================
                    VIEW CART
                ================================================= */}

                {visibleProducts.some(
                  (product) =>
                    getItemQuantity(
                      product.id,
                      product.variantId ||
                        "default"
                    ) > 0
                ) && (
                  <Link
                    href="/cart"
                    className="mt-5 block"
                  >
                    <button
                      type="button"
                      className="w-full rounded-xl bg-zinc-900 py-4 font-black text-white shadow-md hover:bg-black"
                    >
                      🛒 View Cart →
                    </button>
                  </Link>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}