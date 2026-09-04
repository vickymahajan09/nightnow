"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  addOffer,
  type OfferType,
} from "../../../services/offerService";

import {
  getProducts,
  type Product,
} from "../../../services/productService";

import {
  getBrands,
  type Brand,
} from "../../../services/brandService";

export default function CreateOfferPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [type, setType] =
    useState<OfferType>("BUY_1_GET_2");

  const [buyQuantity, setBuyQuantity] =
    useState(1);

  const [freeQuantity, setFreeQuantity] =
    useState(2);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [selectedProducts, setSelectedProducts] =
    useState<string[]>([]);

  const [selectedBrands, setSelectedBrands] =
    useState<string[]>([]);

  const [active, setActive] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================
  // LOAD PRODUCTS + BRANDS
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          productData,
          brandData,
        ] = await Promise.all([
          getProducts(),
          getBrands(),
        ]);

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );

        setBrands(
          Array.isArray(brandData)
            ? brandData
            : []
        );

      } catch (err) {
        console.error(
          "Create offer data loading error:",
          err
        );

        setError(
          "Failed to load Products/Brands."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);


  // ==========================================
  // PRODUCT SELECT
  // ==========================================

  const toggleProduct = (
    productId: string
  ) => {
    setSelectedProducts((current) =>
      current.includes(productId)
        ? current.filter(
            (id) => id !== productId
          )
        : [...current, productId]
    );
  };


  // ==========================================
  // BRAND SELECT
  // ==========================================

  const toggleBrand = (
    brandId: string
  ) => {
    setSelectedBrands((current) =>
      current.includes(brandId)
        ? current.filter(
            (id) => id !== brandId
          )
        : [...current, brandId]
    );
  };


  // ==========================================
  // SAVE OFFER
  // ==========================================

  const handleSave = async () => {
    setError("");
    setMessage("");


    if (!title.trim()) {
      setError(
        "Please enter an offer title."
      );
      return;
    }


    // NONE offer doesn't require
    // product/brand selection.
    if (
      type !== "NONE" &&
      selectedProducts.length === 0 &&
      selectedBrands.length === 0
    ) {
      setError(
        "Select at least 1 Product or Brand."
      );
      return;
    }


    if (
      type === "BUY_X_GET_Y" &&
      (buyQuantity < 1 ||
        freeQuantity < 1)
    ) {
      setError(
        "Buy and Free quantity must be 1 or more."
      );
      return;
    }


    try {
      setSaving(true);

      await addOffer({
        title: title.trim(),

        description:
          description.trim(),

        type,

        buyQuantity:
          Number(buyQuantity),

        freeQuantity:
          Number(freeQuantity),

        brandIds:
          selectedBrands,

        productIds:
          selectedProducts,

        active,
      } as any);


      setMessage(
        "Offer successfully create ho gaya."
      );


      // Reset form

      setTitle("");
      setDescription("");

      setType("BUY_1_GET_2");

      setBuyQuantity(1);
      setFreeQuantity(2);

      setSelectedProducts([]);
      setSelectedBrands([]);

      setActive(true);

    } catch (err) {
      console.error(
        "Create offer error:",
        err
      );

      setError(
        "Failed to save the offer."
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] text-zinc-900">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

          <div>

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-500">
              NightNow Admin
            </p>

            <h1 className="text-xl font-black">
              Create New Offer
            </h1>

          </div>


          <Link
            href="/admin/offers"
            className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white"
          >
            ← All Offers
          </Link>

        </div>

      </header>


      <section className="mx-auto max-w-5xl px-4 pb-12 pt-6">

        {/* SUCCESS */}

        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            ✅ {message}
          </div>
        )}


        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
            ⚠️ {error}
          </div>
        )}


        <div className="grid gap-5 md:grid-cols-2">

          {/* ======================================
              BASIC DETAILS
          ======================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm md:col-span-2">

            <h2 className="text-lg font-black">
              Offer Details
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Basic information about the offer.
            </p>


            {/* TITLE */}

            <label className="mt-5 block text-xs font-black">
              Offer Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Example: Friday Deal"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            />


            {/* DESCRIPTION */}

            <label className="mt-5 block text-xs font-black">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Example: Buy products and get exciting free items."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            />

          </div>


          {/* ======================================
              OFFER TYPE
          ======================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm">

            <h2 className="text-lg font-black">
              Offer Type
            </h2>


            <label className="mt-5 block text-xs font-black">
              Select Offer Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as OfferType
                )
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none"
            >

              <option value="BUY_1_GET_2">
                BUY 1 GET 2
              </option>

              <option value="BUY_1_GET_1">
                BUY 1 GET 1
              </option>

              <option value="BUY_X_GET_Y">
                BUY X GET Y
              </option>

              <option value="NONE">
                Special / No Quantity Rule
              </option>

            </select>


            {/* BUY X GET Y */}

            {type ===
              "BUY_X_GET_Y" && (

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div>

                  <label className="text-xs font-black">
                    Buy Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={(e) =>
                      setBuyQuantity(
                        Math.max(
                          1,
                          Number(
                            e.target.value
                          )
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-bold outline-none"
                  />

                </div>


                <div>

                  <label className="text-xs font-black">
                    Free Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={freeQuantity}
                    onChange={(e) =>
                      setFreeQuantity(
                        Math.max(
                          1,
                          Number(
                            e.target.value
                          )
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-bold outline-none"
                  />

                </div>

              </div>

            )}


            {/* ACTIVE */}

            <div className="mt-6 flex items-center justify-between rounded-xl bg-zinc-50 p-4">

              <div>

                <p className="text-sm font-black">
                  Offer Active
                </p>

                <p className="text-xs text-zinc-500">
                  Customers can see this offer.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setActive(
                    !active
                  )
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  active
                    ? "bg-green-500"
                    : "bg-zinc-300"
                }`}
              >

                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    active
                      ? "left-6"
                      : "left-1"
                  }`}
                />

              </button>

            </div>

          </div>


          {/* ======================================
              SELECTED SUMMARY
          ======================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm">

            <h2 className="text-lg font-black">
              Selection Summary
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between rounded-xl bg-blue-50 p-3">

                <span className="text-xs font-bold text-blue-600">
                  Products
                </span>

                <span className="text-sm font-black text-blue-700">
                  {selectedProducts.length}
                </span>

              </div>


              <div className="flex justify-between rounded-xl bg-purple-50 p-3">

                <span className="text-xs font-bold text-purple-600">
                  Brands
                </span>

                <span className="text-sm font-black text-purple-700">
                  {selectedBrands.length}
                </span>

              </div>


              <div className="rounded-xl bg-yellow-50 p-4">

                <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700">
                  Offer
                </p>

                <p className="mt-1 text-sm font-black">
                  {type ===
                  "BUY_X_GET_Y"
                    ? `BUY ${buyQuantity} GET ${freeQuantity}`
                    : type.replaceAll(
                        "_",
                        " "
                      )}

                </p>

              </div>

            </div>

          </div>


          {/* ======================================
              PRODUCTS
          ======================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm md:col-span-2">

            <div className="flex items-end justify-between">

              <div>

                <h2 className="text-lg font-black">
                  Select Products
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Select products included in this offer.
                </p>

              </div>

              <span className="rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600">
                {selectedProducts.length} Selected
              </span>

            </div>


            {loading ? (

              <div className="mt-5 text-sm text-zinc-500">
                Loading products...
              </div>

            ) : products.length === 0 ? (

              <div className="mt-5 rounded-xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                No products found.
              </div>

            ) : (

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                {products.map(
                  (product: any) => {

                    const id =
                      String(
                        product.id
                      );

                    const selected =
                      selectedProducts.includes(
                        id
                      );

                    return (

                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          toggleProduct(
                            id
                          )
                        }
                        className={`rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-2xl">
                            🛍️
                          </span>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                              selected
                                ? "bg-blue-600 text-white"
                                : "border border-zinc-300"
                            }`}
                          >
                            {selected
                              ? "✓"
                              : ""}
                          </span>

                        </div>


                        <p className="mt-3 line-clamp-2 text-xs font-black">
                          {product.name ||
                            product.title ||
                            "Product"}
                        </p>


                        <p className="mt-1 text-[10px] text-zinc-500">
                          ₹
                          {Number(
                            product.price ||
                              0
                          )}
                        </p>

                      </button>

                    );
                  }
                )}

              </div>

            )}

          </div>


          {/* ======================================
              BRANDS
          ======================================= */}

          <div className="rounded-3xl bg-white p-5 shadow-sm md:col-span-2">

            <div className="flex items-end justify-between">

              <div>

                <h2 className="text-lg font-black">
                  Select Brands
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Offer ko complete brand par apply karne ke liye brand select karo.
                </p>

              </div>

              <span className="rounded-lg bg-purple-50 px-3 py-1 text-[10px] font-black text-purple-600">
                {selectedBrands.length} Selected
              </span>

            </div>


            {loading ? (

              <div className="mt-5 text-sm text-zinc-500">
                Loading brands...
              </div>

            ) : brands.length === 0 ? (

              <div className="mt-5 rounded-xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                No brands found.
              </div>

            ) : (

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                {brands.map(
                  (brand: any) => {

                    const id =
                      String(
                        brand.id
                      );

                    const selected =
                      selectedBrands.includes(
                        id
                      );

                    return (

                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          toggleBrand(
                            id
                          )
                        }
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >

                        <span className="text-xs font-black">
                          {brand.name ||
                            brand.title ||
                            "Brand"}
                        </span>


                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                            selected
                              ? "bg-purple-600 text-white"
                              : "border border-zinc-300"
                          }`}
                        >
                          {selected
                            ? "✓"
                            : ""}
                        </span>

                      </button>

                    );
                  }
                )}

              </div>

            )}

          </div>


          {/* ======================================
              SAVE
          ======================================= */}

          <div className="md:col-span-2">

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-2xl bg-black py-4 text-sm font-black text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {saving
                ? "Saving Offer..."
                : "💾 SAVE OFFER"}
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}