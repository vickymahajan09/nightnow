"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "../../lib/firebase";

import {
  addOffer,
  deleteOffer,
  getOffers,
  toggleOffer,
  updateOffer,
  type Offer,
  type OfferType,
} from "../../services/offerService";

import {
  getBrands,
  type Brand,
} from "../../services/brandService";

import {
  getProducts,
  type Product,
} from "../../services/productService";

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [authUser, setAuthUser] =
  useState<User | null>(null);

const [authLoading, setAuthLoading] =
  useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [type, setType] =
    useState<OfferType>("BUY_1_GET_2");

  const [buyQuantity, setBuyQuantity] =
    useState("1");

  const [freeQuantity, setFreeQuantity] =
    useState("2");

  const [brandIds, setBrandIds] =
    useState<string[]>([]);

  const [productIds, setProductIds] =
    useState<string[]>([]);

  const [active, setActive] =
    useState(true);

  // ==========================================
  // LOAD ALL DATA
  // ==========================================

  const loadAll = async () => {
    setLoading(true);

    try {
      const [
        offerResult,
        brandResult,
        productResult,
      ] = await Promise.allSettled([
        getOffers(),
        getBrands(),
        getProducts(),
      ]);

      // ------------------------------
      // OFFERS
      // ------------------------------

      if (
        offerResult.status === "fulfilled"
      ) {
        setOffers(
          Array.isArray(
            offerResult.value
          )
            ? offerResult.value
            : []
        );
      } else {
        console.error(
          "GET OFFERS ERROR:",
          offerResult.reason
        );

        setOffers([]);
      }

      // ------------------------------
      // BRANDS
      // ------------------------------

      if (
        brandResult.status === "fulfilled"
      ) {
        setBrands(
          Array.isArray(
            brandResult.value
          )
            ? brandResult.value.filter(
                (item: any) =>
                  item?.active !== false
              )
            : []
        );
      } else {
        console.error(
          "GET BRANDS ERROR:",
          brandResult.reason
        );

        setBrands([]);
      }

      // ------------------------------
      // PRODUCTS
      // ------------------------------

      if (
        productResult.status === "fulfilled"
      ) {
        setProducts(
          Array.isArray(
            productResult.value
          )
            ? productResult.value.filter(
                (item: any) =>
                  item?.active !== false
              )
            : []
        );
      } else {
        console.error(
          "GET PRODUCTS ERROR:",
          productResult.reason
        );

        setProducts([]);
      }

      // ------------------------------
      // ERROR DETAILS
      // ------------------------------

      const failed: string[] = [];

      if (
        offerResult.status ===
        "rejected"
      ) {
        failed.push("Offers");
      }

      if (
        brandResult.status ===
        "rejected"
      ) {
        failed.push("Brands");
      }

      if (
        productResult.status ===
        "rejected"
      ) {
        failed.push("Products");
      }

      if (failed.length > 0) {
        console.error(
          "FAILED SERVICES:",
          failed
        );

        alert(
          `${failed.join(
            ", "
          )} load nahi ho paaye. Console me exact error check karein.`
        );
      }
    } catch (error) {
      console.error(
        "Admin offers loading error:",
        error
      );

      alert(
        "Admin data load nahi ho paya."
      );
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const unsubscribe =
    onAuthStateChanged(
      auth,
      (user) => {
        console.log(
          "🔥 FIREBASE AUTH EMAIL:",
          user?.email
        );

        console.log(
          "🔥 FIREBASE AUTH UID:",
          user?.uid
        );

        setAuthUser(user);
        setAuthLoading(false);
      }
    );

  return () => {
    unsubscribe();
  };
}, []);


useEffect(() => {
  if (authLoading) {
    return;
  }

  loadAll();
}, [authLoading]);

  // ==========================================
  // RESET
  // ==========================================

  const reset = () => {
    setEditingId(null);

    setTitle("");
    setDescription("");

    setType("BUY_1_GET_2");

    setBuyQuantity("1");
    setFreeQuantity("2");

    setBrandIds([]);
    setProductIds([]);

    setActive(true);
  };

  // ==========================================
  // TOGGLE ID
  // ==========================================

  const toggleId = (
    id: string,
    current: string[],
    setter: (
      value: string[]
    ) => void
  ) => {
    setter(
      current.includes(id)
        ? current.filter(
            (item) =>
              item !== id
          )
        : [...current, id]
    );
  };

  // ==========================================
  // OFFER TYPE
  // ==========================================

  const handleTypeChange = (
    nextType: OfferType
  ) => {
    setType(nextType);

    if (
      nextType ===
      "BUY_1_GET_1"
    ) {
      setBuyQuantity("1");
      setFreeQuantity("1");
    }

    if (
      nextType ===
      "BUY_1_GET_2"
    ) {
      setBuyQuantity("1");
      setFreeQuantity("2");
    }

    if (
      nextType ===
      "NONE"
    ) {
      setBuyQuantity("1");
      setFreeQuantity("0");
    }

    if (
      nextType ===
      "BUY_X_GET_Y"
    ) {
      setBuyQuantity("2");
      setFreeQuantity("1");
    }
  };

  // ==========================================
  // SAVE
  // ==========================================

  const save = async () => {
    if (!title.trim()) {
      alert(
        "Offer title enter karein."
      );
      return;
    }

    if (
      type !== "NONE" &&
      brandIds.length === 0 &&
      productIds.length === 0
    ) {
      alert(
        "Kam se kam 1 brand ya product select karein."
      );
      return;
    }

    if (
      type ===
      "BUY_X_GET_Y"
    ) {
      if (
        Number(buyQuantity) <=
        0
      ) {
        alert(
          "Buy quantity invalid hai."
        );
        return;
      }

      if (
        Number(freeQuantity) <=
        0
      ) {
        alert(
          "Free quantity invalid hai."
        );
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description:
          description.trim(),
        type,

        buyQuantity:
          Number(
            buyQuantity
          ),

        freeQuantity:
          Number(
            freeQuantity
          ),

        brandIds,
        productIds,

        active,
      };

      if (editingId) {
        await updateOffer(
          editingId,
          payload
        );

        alert(
          "Offer updated."
        );
      } else {
        await addOffer(
          payload
        );

        alert(
          "Offer created."
        );
      }

      reset();

      await loadAll();
    } catch (error: any) {
      console.error(
        "Offer save error:",
        error
      );

      alert(
        error?.message ||
          "Offer save nahi hua."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const edit = (
    offer: Offer
  ) => {
    setEditingId(
      offer.id
    );

    setTitle(
      offer.title || ""
    );

    setDescription(
      offer.description ||
        ""
    );

    setType(
      offer.type
    );

    setBuyQuantity(
      String(
        offer.buyQuantity ||
          1
      )
    );

    setFreeQuantity(
      String(
        offer.freeQuantity ||
          0
      )
    );

    setBrandIds(
      Array.isArray(
        offer.brandIds
      )
        ? offer.brandIds.map(
            String
          )
        : []
    );

    setProductIds(
      Array.isArray(
        offer.productIds
      )
        ? offer.productIds.map(
            String
          )
        : []
    );

    setActive(
      offer.active !== false
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const remove = async (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this offer?"
      )
    ) {
      return;
    }

    try {
      await deleteOffer(id);

      setOffers(
        (items) =>
          items.filter(
            (item) =>
              item.id !== id
          )
      );
    } catch (error) {
      console.error(
        "Offer delete error:",
        error
      );

      alert(
        "Offer delete nahi hua."
      );
    }
  };

  // ==========================================
  // ACTIVE / HIDDEN
  // ==========================================

  const changeActive = async (
    offer: Offer
  ) => {
    try {
      await toggleOffer(
        offer.id,
        !offer.active
      );

      setOffers(
        (items) =>
          items.map(
            (item) =>
              item.id ===
              offer.id
                ? {
                    ...item,
                    active:
                      !item.active,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Offer status error:",
        error
      );

      alert(
        "Offer status update nahi hua."
      );
    }
  };

  // ==========================================
  // BRAND NAME
  // ==========================================

  const brandName = (
    id: string
  ) => {
    return (
      brands.find(
        (brand) =>
          String(
            brand.id
          ) === String(id)
      )?.name ||
      id
    );
  };

  // ==========================================
  // PRODUCT NAME
  // ==========================================

  const productName = (
    id: string
  ) => {
    return (
      products.find(
        (product) =>
          String(
            product.id
          ) === String(id)
      )?.name ||
      id
    );
  };

  // ==========================================
  // OFFER LABEL
  // ==========================================

  const offerLabel = (
    offer: Offer
  ) => {
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
      return `BUY ${offer.buyQuantity} GET ${offer.freeQuantity}`;
    }

    return "NO OFFER";
  };

  // ==========================================
  // SELECTED SUMMARY
  // ==========================================

  const selectedSummary =
    useMemo(
      () => ({
        brands:
          brandIds.map(
            brandName
          ),

        products:
          productIds.map(
            productName
          ),
      }),
      [
        brandIds,
        productIds,
        brands,
        products,
      ]
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-black px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-yellow-400">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Offers
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Product/brand specific offers manage karein.
          </p>
        </div>

        {/* FORM */}

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

          <div className="flex items-center justify-between gap-3">

            <h2 className="text-xl font-black">
              {editingId
                ? "Edit Offer"
                : "Create Offer"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-black"
              >
                Cancel Edit
              </button>
            )}

          </div>

          {/* TITLE + DESCRIPTION */}

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Offer title"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none focus:border-yellow-400"
            />

            <input
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Description"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none focus:border-yellow-400"
            />

          </div>

          {/* OFFER TYPE */}

          <div className="mt-5">

            <p className="mb-2 text-xs font-black text-zinc-500">
              OFFER TYPE
            </p>

            <div className="grid gap-2 sm:grid-cols-4">

              {[
                [
                  "NONE",
                  "No Offer",
                ],
                [
                  "BUY_1_GET_1",
                  "Buy 1 Get 1",
                ],
                [
                  "BUY_1_GET_2",
                  "Buy 1 Get 2",
                ],
                [
                  "BUY_X_GET_Y",
                  "Buy X Get Y",
                ],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      handleTypeChange(
                        value as OfferType
                      )
                    }
                    className={`rounded-2xl border p-4 text-left text-xs font-black ${
                      type === value
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-zinc-800 bg-zinc-900 text-white"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}

            </div>

          </div>

          {/* CUSTOM X/Y */}

          {type ===
            "BUY_X_GET_Y" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-xs font-black text-zinc-500">
                  BUY QUANTITY
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    buyQuantity
                  }
                  onChange={(e) =>
                    setBuyQuantity(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none focus:border-yellow-400"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-black text-zinc-500">
                  FREE QUANTITY
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    freeQuantity
                  }
                  onChange={(e) =>
                    setFreeQuantity(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none focus:border-yellow-400"
                />

              </div>

            </div>
          )}

          {/* BRANDS */}

          <div className="mt-6">

            <div className="flex items-center justify-between">

              <p className="text-xs font-black text-zinc-500">
                SELECT BRANDS
              </p>

              <span className="text-[10px] text-zinc-600">
                {brands.length} available
              </span>

            </div>

            <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">

              {brands.length === 0 ? (
                <div className="col-span-full rounded-xl bg-zinc-900 p-5 text-center text-xs text-zinc-500">
                  Koi active brand nahi mila.
                </div>
              ) : (
                brands.map(
                  (brand) => {

                    const id =
                      String(
                        brand.id
                      );

                    const selected =
                      brandIds.includes(
                        id
                      );

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          toggleId(
                            id,
                            brandIds,
                            setBrandIds
                          )
                        }
                        className={`rounded-xl border p-3 text-left text-xs font-bold ${
                          selected
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-zinc-800 bg-zinc-900"
                        }`}
                      >
                        {selected
                          ? "✓ "
                          : ""}
                        {brand.name}
                      </button>
                    );
                  }
                )
              )}

            </div>

          </div>

          {/* PRODUCTS */}

          <div className="mt-6">

            <div className="flex items-center justify-between">

              <p className="text-xs font-black text-zinc-500">
                SELECT PRODUCTS
              </p>

              <span className="text-[10px] text-zinc-600">
                {products.length} available
              </span>

            </div>

            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">

              {products.length === 0 ? (
                <div className="col-span-full rounded-xl bg-zinc-900 p-5 text-center text-xs text-zinc-500">
                  Koi active product nahi mila.
                </div>
              ) : (
                products.map(
                  (product) => {

                    const id =
                      String(
                        product.id
                      );

                    const selected =
                      productIds.includes(
                        id
                      );

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          toggleId(
                            id,
                            productIds,
                            setProductIds
                          )
                        }
                        className={`rounded-xl border p-3 text-left ${
                          selected
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-zinc-800 bg-zinc-900"
                        }`}
                      >

                        <p className="truncate text-xs font-black">
                          {selected
                            ? "✓ "
                            : ""}
                          {product.name}
                        </p>

                        {(
                          product as any
                        ).brandName && (
                          <p className="mt-1 truncate text-[9px] opacity-60">
                            {
                              (
                                product as any
                              ).brandName
                            }
                          </p>
                        )}

                      </button>
                    );
                  }
                )
              )}

            </div>

          </div>

          {/* ACTIVE */}

          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-900 p-4">

            <input
              type="checkbox"
              checked={active}
              onChange={(e) =>
                setActive(
                  e.target.checked
                )
              }
              className="h-5 w-5 accent-yellow-400"
            />

            <div>

              <p className="text-sm font-black">
                Offer Active
              </p>

              <p className="text-[10px] text-zinc-500">
                Customer ko active offer dikhega.
              </p>

            </div>

          </label>

          {/* TARGET SUMMARY */}

          {(selectedSummary.brands
            .length > 0 ||
            selectedSummary.products
              .length > 0) && (

            <div className="mt-5 rounded-2xl border border-yellow-900/50 bg-yellow-950/20 p-4">

              <p className="text-xs font-black text-yellow-400">
                TARGET
              </p>

              {selectedSummary.brands
                .length > 0 && (
                <p className="mt-2 text-xs text-zinc-300">
                  Brands:{" "}
                  {selectedSummary.brands.join(
                    ", "
                  )}
                </p>
              )}

              {selectedSummary.products
                .length > 0 && (
                <p className="mt-2 text-xs text-zinc-300">
                  Products:{" "}
                  {selectedSummary.products.join(
                    ", "
                  )}
                </p>
              )}

            </div>
          )}

          {/* SAVE */}

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="mt-6 w-full rounded-2xl bg-yellow-400 py-4 text-sm font-black text-black disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Offer"
              : "Create Offer"}
          </button>

        </section>

        {/* EXISTING OFFERS */}

        <section className="mt-8">

          <div className="flex items-end justify-between">

            <div>

              <h2 className="text-xl font-black">
                Existing Offers
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {offers.length} offer
                {offers.length === 1
                  ? ""
                  : "s"}
              </p>

            </div>

          </div>

          {loading ? (

            <div className="py-16 text-center text-zinc-500">
              Loading offers...
            </div>

          ) : offers.length === 0 ? (

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center">

              <div className="text-5xl">
                🎁
              </div>

              <p className="mt-4 font-black">
                No offers created.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {offers.map(
                (offer) => (

                  <article
                    key={
                      offer.id
                    }
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-lg font-black">
                          {offer.title}
                        </p>

                        {offer.description && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {
                              offer.description
                            }
                          </p>
                        )}

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${
                          offer.active
                            ? "bg-green-400 text-black"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {offer.active
                          ? "ACTIVE"
                          : "OFF"}
                      </span>

                    </div>

                    <div className="mt-4 rounded-2xl bg-yellow-400 p-3 text-center text-sm font-black text-black">
                      {offerLabel(
                        offer
                      )}
                    </div>

                    {offer.brandIds &&
                      offer.brandIds.length >
                        0 && (

                        <div className="mt-4">

                          <p className="text-[9px] font-black text-zinc-600">
                            BRANDS
                          </p>

                          <p className="mt-1 text-xs text-zinc-300">
                            {offer.brandIds
                              .map(
                                brandName
                              )
                              .join(
                                ", "
                              )}
                          </p>

                        </div>
                      )}

                    {offer.productIds &&
                      offer.productIds.length >
                        0 && (

                        <div className="mt-4">

                          <p className="text-[9px] font-black text-zinc-600">
                            PRODUCTS
                          </p>

                          <p className="mt-1 line-clamp-3 text-xs text-zinc-300">
                            {offer.productIds
                              .map(
                                productName
                              )
                              .join(
                                ", "
                              )}
                          </p>

                        </div>
                      )}

                    <div className="mt-5 grid grid-cols-3 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          edit(
                            offer
                          )
                        }
                        className="rounded-xl bg-zinc-800 py-2 text-[10px] font-black"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeActive(
                            offer
                          )
                        }
                        className="rounded-xl bg-blue-600 py-2 text-[10px] font-black"
                      >
                        {offer.active
                          ? "Hide"
                          : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          remove(
                            offer.id
                          )
                        }
                        className="rounded-xl bg-red-600 py-2 text-[10px] font-black"
                      >
                        Delete
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}