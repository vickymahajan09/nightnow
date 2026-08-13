"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

type Brand = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type Variant = {
  id: string;
  name: string;
  price: string;
  mrp: string;
  stock: string;
};

export default function ProductMasterPage() {
  const router = useRouter();

  // =====================================================
  // BASIC
  // =====================================================

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");

  // =====================================================
  // PRICE
  // =====================================================

  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");

  // =====================================================
  // IMAGES
  // =====================================================

  const [images, setImages] = useState([
    "",
    "",
    "",
    "",
    "",
  ]);

  // =====================================================
  // STATUS
  // =====================================================

  const [active, setActive] = useState(true);

  // =====================================================
  // BRAND / CATEGORY
  // =====================================================

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [brandsLoading, setBrandsLoading] =
    useState(true);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  // =====================================================
  // VARIANTS
  // =====================================================

  const [variants, setVariants] =
    useState<Variant[]>([]);

  // =====================================================
  // SAVE
  // =====================================================

  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD BRANDS
  // =====================================================

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setBrandsLoading(true);

        const snapshot = await getDocs(
          collection(db, "brands")
        );

        const data: Brand[] =
          snapshot.docs
            .map((item) => ({
              id: item.id,
              name: String(
                item.data().name || ""
              ).trim(),
            }))
            .filter(
              (item) =>
                item.name.length > 0
            )
            .sort((a, b) =>
              a.name.localeCompare(
                b.name
              )
            );

        setBrands(data);
      } catch (error) {
        console.error(
          "Brand loading error:",
          error
        );
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBrands();
  }, []);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const snapshot = await getDocs(
          collection(db, "categories")
        );

        const data: Category[] =
          snapshot.docs
            .map((item) => ({
              id: item.id,
              name: String(
                item.data().name || ""
              ).trim(),
              icon: String(
                item.data().icon || ""
              ),
            }))
            .filter(
              (item) =>
                item.name.length > 0
            )
            .sort((a, b) =>
              a.name.localeCompare(
                b.name
              )
            );

        setCategories(data);
      } catch (error) {
        console.error(
          "Category loading error:",
          error
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // =====================================================
  // DISCOUNT
  // =====================================================

  const discount = useMemo(() => {
    const sellingPrice =
      Number(price) || 0;

    const originalMrp =
      Number(mrp) || 0;

    if (
      originalMrp <= 0 ||
      sellingPrice <= 0 ||
      sellingPrice >= originalMrp
    ) {
      return 0;
    }

    return Math.round(
      ((originalMrp - sellingPrice) /
        originalMrp) *
        100
    );
  }, [price, mrp]);

  // =====================================================
  // IMAGE UPDATE
  // =====================================================

  const updateImage = (
    index: number,
    value: string
  ) => {
    setImages((current) => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
  };

  // =====================================================
  // ADD VARIANT
  // =====================================================

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      {
        id:
          Date.now().toString() +
          Math.random()
            .toString(36)
            .slice(2),

        name: "",
        price: "",
        mrp: "",
        stock: "",
      },
    ]);
  };

  // =====================================================
  // UPDATE VARIANT
  // =====================================================

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string
  ) => {
    setVariants((current) => {
      const updated = [...current];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  // =====================================================
  // DELETE VARIANT
  // =====================================================

  const deleteVariant = (
    index: number
  ) => {
    setVariants((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = () => {
    setName("");
    setCategory("");
    setBrand("");
    setDescription("");

    setPrice("");
    setMrp("");
    setStock("");

    setImages([
      "",
      "",
      "",
      "",
      "",
    ]);

    setActive(true);
    setVariants([]);
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const saveProduct = async () => {
    const cleanName = name.trim();
    const cleanCategory =
      category.trim();
    const cleanBrand =
      brand.trim();

    const sellingPrice =
      Number(price) || 0;

    const originalMrp =
      Number(mrp) || 0;

    const productStock =
      Number(stock) || 0;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!cleanName) {
      alert(
        "Product name required"
      );
      return;
    }

    if (!cleanCategory) {
      alert(
        "Please select category"
      );
      return;
    }

    if (!cleanBrand) {
      alert(
        "Please select brand"
      );
      return;
    }

    if (sellingPrice <= 0) {
      alert(
        "Selling price required"
      );
      return;
    }

    if (originalMrp <= 0) {
      alert(
        "MRP required"
      );
      return;
    }

    if (
      sellingPrice >
      originalMrp
    ) {
      alert(
        "Selling price MRP se zyada nahi ho sakta"
      );
      return;
    }

    try {
      setSaving(true);

      const cleanImages =
        images.filter(
          (item) =>
            item.trim().length > 0
        );

      const cleanVariants =
        variants
          .filter(
            (item) =>
              item.name.trim().length >
              0
          )
          .map((item) => ({
            id: item.id,
            name: item.name.trim(),
            price:
              Number(item.price) || 0,
            mrp:
              Number(item.mrp) || 0,
            stock:
              Number(item.stock) || 0,
          }));

      await addDoc(
        collection(
          db,
          "products"
        ),
        {
          name: cleanName,

          category:
            cleanCategory,

          brand:
            cleanBrand,

          description:
            description.trim(),

          price:
            sellingPrice,

          mrp:
            originalMrp,

          discount,

          stock:
            productStock,

          image:
            cleanImages[0] || "",

          images:
            cleanImages,

          image1:
            cleanImages[0] || "",

          image2:
            cleanImages[1] || "",

          image3:
            cleanImages[2] || "",

          image4:
            cleanImages[3] || "",

          image5:
            cleanImages[4] || "",

          variants:
            cleanVariants,

          active,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      alert(
        "✅ Product successfully added"
      );

      resetForm();

      router.push(
        "/admin/product"
      );
    } catch (error) {
      console.error(
        "Product save error:",
        error
      );

      alert(
        "❌ Product save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
            NIGHT NOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Product Master
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Product add karne ke liye complete details fill karein.
          </p>

        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            1. Product Information
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {/* PRODUCT NAME */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-black">
                Product Name *
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Example: Amul Gold Milk"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400 focus:bg-white"
              />

            </div>

            {/* CATEGORY */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Category *
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400 focus:bg-white"
              >

                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select Category"}
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.name}
                    >
                      {item.icon
                        ? `${item.icon} `
                        : ""}
                      {item.name}
                    </option>
                  )
                )}

              </select>

              {!categoriesLoading &&
                categories.length ===
                  0 && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    ⚠️ Category Master me category add karein.
                  </p>
                )}

            </div>

            {/* BRAND DROPDOWN */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Brand *
              </label>

              <select
                value={brand}
                onChange={(e) =>
                  setBrand(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400 focus:bg-white"
              >

                <option value="">
                  {brandsLoading
                    ? "Loading brands..."
                    : "Select Brand"}
                </option>

                {brands.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  )
                )}

              </select>

              {!brandsLoading &&
                brands.length ===
                  0 && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    ⚠️ Brand Master me brand add karein.
                  </p>
                )}

            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-black">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Product description..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-yellow-400 focus:bg-white"
              />

            </div>

          </div>

        </section>

        {/* =================================================
            PRICE
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h2 className="text-xl font-black">
                2. Price & Stock
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                MRP aur selling price se discount automatically calculate hoga.
              </p>

            </div>

            {discount > 0 && (
              <div className="rounded-2xl bg-green-100 px-5 py-3 text-center">

                <div className="text-2xl font-black text-green-700">
                  {discount}% OFF
                </div>

                <div className="text-xs font-bold text-green-600">
                  Customer Saving
                </div>

              </div>
            )}

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            {/* MRP */}

            <div>

              <label className="mb-2 block text-sm font-black">
                MRP *
              </label>

              <input
                type="number"
                min="0"
                value={mrp}
                onChange={(e) =>
                  setMrp(
                    e.target.value
                  )
                }
                placeholder="100"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
              />

            </div>

            {/* SELLING */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Selling Price *
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="85"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
              />

            </div>

            {/* STOCK */}

            <div>

              <label className="mb-2 block text-sm font-black">
                Stock
              </label>

              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) =>
                  setStock(
                    e.target.value
                  )
                }
                placeholder="100"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
              />

            </div>

          </div>

        </section>

        {/* =================================================
            FIVE IMAGES
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            3. Product Images
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Maximum 5 images. Product detail page par swipe gallery ke liye.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {images.map(
              (image, index) => (
                <div key={index}>

                  <label className="mb-2 block text-sm font-black">
                    Image {index + 1}
                  </label>

                  <input
                    type="url"
                    value={image}
                    onChange={(e) =>
                      updateImage(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400"
                  />

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            VARIANTS
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h2 className="text-xl font-black">
                4. Size / Variants
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Example: 250 ML, 500 ML, 1 KG, Small, Medium, Pack of 2
              </p>

            </div>

            <button
              type="button"
              onClick={
                addVariant
              }
              className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black"
            >
              + Add Variant
            </button>

          </div>

          {variants.length === 0 ? (

            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-7 text-center">

              <div className="text-3xl">
                📦
              </div>

              <p className="mt-2 text-sm font-bold text-slate-500">
                No variants added
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {variants.map(
                (
                  variant,
                  index
                ) => (

                  <div
                    key={
                      variant.id
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="grid gap-3 md:grid-cols-4">

                      <input
                        value={
                          variant.name
                        }
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="500 ML"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-yellow-400"
                      />

                      <input
                        type="number"
                        min="0"
                        value={
                          variant.mrp
                        }
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "mrp",
                            e.target.value
                          )
                        }
                        placeholder="MRP"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-yellow-400"
                      />

                      <input
                        type="number"
                        min="0"
                        value={
                          variant.price
                        }
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "price",
                            e.target.value
                          )
                        }
                        placeholder="Selling Price"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-yellow-400"
                      />

                      <input
                        type="number"
                        min="0"
                        value={
                          variant.stock
                        }
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "stock",
                            e.target.value
                          )
                        }
                        placeholder="Stock"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-yellow-400"
                      />

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteVariant(
                          index
                        )
                      }
                      className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                    >
                      🗑️ Remove
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =================================================
            STATUS
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-black">
                Product Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Active product customer ko show hoga.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setActive(
                  !active
                )
              }
              className={`relative h-8 w-14 rounded-full ${
                active
                  ? "bg-green-500"
                  : "bg-slate-300"
              }`}
            >

              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow ${
                  active
                    ? "left-7"
                    : "left-1"
                }`}
              />

            </button>

          </div>

        </section>

        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                resetForm
              }
              disabled={saving}
              className="rounded-2xl border border-slate-200 px-7 py-4 font-black text-slate-700"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={
                saveProduct
              }
              disabled={saving}
              className="rounded-2xl bg-yellow-400 px-8 py-4 font-black text-black hover:bg-yellow-300 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "✅ Add Product"}
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}