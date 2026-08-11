"use client";

import {
  addProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} from "../../../services/productService";

import { getCategories } from "../../../services/categoryService";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AddProductPage() {
  // =========================================
  // BASIC PRODUCT
  // =========================================

  const [name, setName] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] =
    useState("");

  // =========================================
  // PRODUCT DETAILS
  // =========================================

  const [brand, setBrand] = useState("");
  const [productType, setProductType] =
    useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("");
  const [packSize, setPackSize] =
    useState("");
  const [manufacturer, setManufacturer] =
    useState("");
  const [countryOfOrigin, setCountryOfOrigin] =
    useState("");

  const [keyFeatures, setKeyFeatures] =
    useState("");

  const [ingredients, setIngredients] =
    useState("");

  const [usageInstructions, setUsageInstructions] =
    useState("");

  // =========================================
  // IMAGES
  // =========================================

  const [images, setImages] =
    useState<string[]>([]);

  const [uploading, setUploading] =
    useState(false);

  // =========================================
  // DATA
  // =========================================

  const [categories, setCategories] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  // =========================================
  // EDIT
  // =========================================

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(
        "Products loading failed:",
        error
      );
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(
        "Categories loading failed:",
        error
      );
    }
  };

  // =========================================
  // IMAGE UPLOAD
  // =========================================

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      e.target.files || []
    );

    if (files.length === 0) return;

    const remaining =
      5 - images.length;

    if (remaining <= 0) {
      alert(
        "Maximum 5 images allowed."
      );
      e.target.value = "";
      return;
    }

    const selectedFiles =
      files.slice(0, remaining);

    setUploading(true);

    try {
      const uploadedImages: string[] = [];

      for (const file of selectedFiles) {
        const data = new FormData();

        data.append("file", file);

        data.append(
          "upload_preset",
          "nightnow"
        );

        const res =
          await axios.post(
            "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
            data
          );

        if (res.data?.secure_url) {
          uploadedImages.push(
            res.data.secure_url
          );
        }
      }

      setImages((prev) => [
        ...prev,
        ...uploadedImages,
      ]);

      alert(
        `${uploadedImages.length} image${
          uploadedImages.length > 1
            ? "s"
            : ""
        } uploaded successfully.`
      );
    } catch (error) {
      console.error(
        "Image upload failed:",
        error
      );

      alert(
        "Image upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // =========================================
  // REMOVE IMAGE
  // =========================================

  const removeImage = (
    index: number
  ) => {
    setImages((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // =========================================
  // CLEAR FORM
  // =========================================

  const clearForm = () => {
    setName("");
    setMrp("");
    setPrice("");
    setCategory("");
    setStock("");
    setDescription("");

    setBrand("");
    setProductType("");
    setWeight("");
    setUnit("");
    setPackSize("");
    setManufacturer("");
    setCountryOfOrigin("");

    setKeyFeatures("");
    setIngredients("");
    setUsageInstructions("");

    setImages([]);

    setEditingId("");
  };

  // =========================================
  // DISCOUNT
  // =========================================

  const mrpNumber =
    Number(mrp || 0);

  const priceNumber =
    Number(price || 0);

  const discount =
    mrpNumber > priceNumber &&
    mrpNumber > 0
      ? Math.round(
          ((mrpNumber -
            priceNumber) /
            mrpNumber) *
            100
        )
      : 0;

  // =========================================
  // SAVE PRODUCT
  // =========================================

  const saveProduct = async () => {
    if (!name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!price) {
      alert("Please enter selling price.");
      return;
    }

    if (!category) {
      alert("Please select category.");
      return;
    }

    if (images.length === 0) {
      alert(
        "Please upload at least 1 product image."
      );
      return;
    }

    if (
      mrpNumber > 0 &&
      priceNumber > mrpNumber
    ) {
      alert(
        "Selling price cannot be greater than MRP."
      );
      return;
    }

    try {
      const product = {
        name: name.trim(),

        mrp: Number(
          mrp || price
        ),

        price: Number(price),

        category,

        stock: Number(
          stock || 0
        ),

        description:
          description.trim(),

        // DETAILS

        brand:
          brand.trim(),

        productType:
          productType.trim(),

        weight:
          weight.trim(),

        unit:
          unit.trim(),

        packSize:
          packSize.trim(),

        manufacturer:
          manufacturer.trim(),

        countryOfOrigin:
          countryOfOrigin.trim(),

        keyFeatures:
          keyFeatures.trim(),

        ingredients:
          ingredients.trim(),

        usageInstructions:
          usageInstructions.trim(),

        // IMAGES

        image:
          images[0] || "",

        images,

        discount,
      };

      if (editingId) {
        await updateProduct(
          editingId,
          product
        );

        alert(
          "Product Updated Successfully."
        );
      } else {
        await addProduct(product);

        alert(
          "Product Added Successfully."
        );
      }

      clearForm();

      await loadProducts();
    } catch (error) {
      console.error(
        "Save product failed:",
        error
      );

      alert(
        "Failed to save product."
      );
    }
  };

  // =========================================
  // DELETE PRODUCT
  // =========================================

  const removeProduct = async (
    id: string
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    try {
      await deleteProduct(id);

      await loadProducts();

      alert(
        "Product deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      alert(
        "Failed to delete product."
      );
    }
  };

  // =========================================
  // EDIT PRODUCT
  // =========================================

  const editProduct = (
    item: any
  ) => {
    setEditingId(item.id);

    setName(
      item.name || ""
    );

    setMrp(
      String(
        item.mrp ||
          item.price ||
          ""
      )
    );

    setPrice(
      String(
        item.price || ""
      )
    );

    setCategory(
      item.category || ""
    );

    setStock(
      String(
        item.stock || ""
      )
    );

    setDescription(
      item.description || ""
    );

    setBrand(
      item.brand || ""
    );

    setProductType(
      item.productType || ""
    );

    setWeight(
      item.weight || ""
    );

    setUnit(
      item.unit || ""
    );

    setPackSize(
      item.packSize || ""
    );

    setManufacturer(
      item.manufacturer || ""
    );

    setCountryOfOrigin(
      item.countryOfOrigin || ""
    );

    setKeyFeatures(
      item.keyFeatures || ""
    );

    setIngredients(
      item.ingredients || ""
    );

    setUsageInstructions(
      item.usageInstructions || ""
    );

    const existingImages =
      Array.isArray(item.images)
        ? item.images
        : item.image
        ? [item.image]
        : [];

    setImages(
      existingImages.slice(0, 5)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // SEARCH
  // =========================================

  const filteredProducts =
    products.filter(
      (item: any) =>
        item.name
          ?.toLowerCase()
          .includes(
            search
              .toLowerCase()
          )
    );

  // =========================================
  // UI
  // =========================================

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm font-bold text-zinc-500">
              Night Now Admin
            </p>

            <h1 className="text-3xl font-black text-yellow-400 md:text-4xl">
              {editingId
                ? "Edit Product"
                : "Add Product"}
            </h1>

          </div>

          <button
            onClick={() =>
              window.history.back()
            }
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold hover:bg-zinc-700"
          >
            ← Back
          </button>

        </div>

        {/* ================================= */}
        {/* FORM */}
        {/* ================================= */}

        <div className="mt-8 rounded-2xl bg-zinc-900 p-5 md:p-7">

          <h2 className="text-xl font-black">
            Product Information
          </h2>

          {/* BASIC */}

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {/* NAME */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Product Name *
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Example: Surf Excel Matic"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

            {/* MRP */}

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-300">
                MRP
              </label>

              <input
                type="number"
                value={mrp}
                onChange={(e) =>
                  setMrp(
                    e.target.value
                  )
                }
                placeholder="399"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

            {/* PRICE */}

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Selling Price *
              </label>

              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="324"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

          </div>

          {/* DISCOUNT PREVIEW */}

          {discount > 0 && (
            <div className="mt-4 rounded-xl bg-green-500/10 p-4">

              <p className="text-sm text-zinc-400">
                Automatic Discount
              </p>

              <p className="mt-1 text-2xl font-black text-green-400">
                {discount}% OFF
              </p>

              <p className="text-xs text-zinc-500">
                ₹{mrpNumber} → ₹
                {priceNumber}
              </p>

            </div>
          )}

          {/* CATEGORY + STOCK */}

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Category *
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              >

                <option value="">
                  Select Category
                </option>

                {categories.map(
                  (cat: any) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                    >
                      {cat.icon || "📦"}{" "}
                      {cat.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Stock
              </label>

              <input
                type="number"
                value={stock}
                onChange={(e) =>
                  setStock(
                    e.target.value
                  )
                }
                placeholder="100"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

          </div>

          {/* ================================= */}
          {/* IMAGES */}
          {/* ================================= */}

          <div className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-black">
                  Product Images
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Upload up to 5 images
                </p>

              </div>

              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold">
                {images.length}/5
              </span>

            </div>

            {/* UPLOAD */}

            {images.length < 5 && (
              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 text-center hover:border-yellow-400">

                <div>

                  <div className="text-3xl">
                    📸
                  </div>

                  <p className="mt-2 font-bold">
                    {uploading
                      ? "Uploading..."
                      : "Click to upload images"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    JPG, PNG, WEBP
                  </p>

                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={
                    uploadImage
                  }
                  disabled={uploading}
                  className="hidden"
                />

              </label>
            )}

            {/* IMAGE GRID */}

            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">

                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-zinc-700 bg-white"
                    >

                      <img
                        src={image}
                        alt={`Product ${
                          index + 1
                        }`}
                        className="h-32 w-full object-contain"
                      />

                      {/* MAIN */}

                      {index === 0 && (
                        <div className="absolute left-1 top-1 rounded-md bg-yellow-400 px-2 py-1 text-[9px] font-black text-black">
                          MAIN
                        </div>
                      )}

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white"
                      >
                        ×
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* ================================= */}
          {/* PRODUCT DETAILS */}
          {/* ================================= */}

          <div className="mt-7">

            <h3 className="text-xl font-black">
              Product Details
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              {/* BRAND */}

              <input
                value={brand}
                onChange={(e) =>
                  setBrand(
                    e.target.value
                  )
                }
                placeholder="Brand"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* PRODUCT TYPE */}

              <input
                value={productType}
                onChange={(e) =>
                  setProductType(
                    e.target.value
                  )
                }
                placeholder="Product Type"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* WEIGHT */}

              <input
                value={weight}
                onChange={(e) =>
                  setWeight(
                    e.target.value
                  )
                }
                placeholder="Weight e.g. 2 kg"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* UNIT */}

              <input
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value
                  )
                }
                placeholder="Unit e.g. 1 pack"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* PACK SIZE */}

              <input
                value={packSize}
                onChange={(e) =>
                  setPackSize(
                    e.target.value
                  )
                }
                placeholder="Pack Size"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* MANUFACTURER */}

              <input
                value={manufacturer}
                onChange={(e) =>
                  setManufacturer(
                    e.target.value
                  )
                }
                placeholder="Manufacturer"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {/* COUNTRY */}

              <input
                value={countryOfOrigin}
                onChange={(e) =>
                  setCountryOfOrigin(
                    e.target.value
                  )
                }
                placeholder="Country of Origin"
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

          </div>

          {/* ================================= */}
          {/* DESCRIPTION */}
          {/* ================================= */}

          <div className="mt-7 grid gap-4">

            <div>

              <label className="mb-2 block text-sm font-bold">
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
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold">
                Key Features
              </label>

              <textarea
                value={keyFeatures}
                onChange={(e) =>
                  setKeyFeatures(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Fast cleaning, stain removal, etc."
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold">
                Ingredients
              </label>

              <textarea
                value={ingredients}
                onChange={(e) =>
                  setIngredients(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Ingredients..."
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold">
                Usage Instructions
              </label>

              <textarea
                value={usageInstructions}
                onChange={(e) =>
                  setUsageInstructions(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="How to use this product..."
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />

            </div>

          </div>

          {/* ================================= */}
          {/* SAVE */}
          {/* ================================= */}

          <button
            onClick={saveProduct}
            disabled={uploading}
            className="mt-7 w-full rounded-xl bg-yellow-400 py-4 text-lg font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingId
              ? "Update Product"
              : "Save Product"}
          </button>

          {editingId && (
            <button
              onClick={clearForm}
              className="mt-3 w-full rounded-xl bg-zinc-800 py-3 font-bold hover:bg-zinc-700"
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* ================================= */}
        {/* PRODUCT LIST */}
        {/* ================================= */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-black">
                Products
              </h2>

              <p className="text-sm text-zinc-500">
                {filteredProducts.length} products
              </p>

            </div>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search products..."
              className="rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400 md:w-80"
            />

          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (item: any) => {

                const itemMrp =
                  Number(
                    item.mrp ||
                      item.price ||
                      0
                  );

                const itemPrice =
                  Number(
                    item.price || 0
                  );

                const itemDiscount =
                  itemMrp >
                  itemPrice
                    ? Math.round(
                        ((itemMrp -
                          itemPrice) /
                          itemMrp) *
                          100
                      )
                    : 0;

                const itemImage =
                  item.image ||
                  (Array.isArray(
                    item.images
                  )
                    ? item.images[0]
                    : "/no-image.png");

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl bg-zinc-900"
                  >

                    <div className="relative flex h-40 items-center justify-center bg-white">

                      {itemDiscount >
                        0 && (
                        <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-blue-500 px-2 py-1 text-[10px] font-black text-white">
                          {
                            itemDiscount
                          }
                          % OFF
                        </div>
                      )}

                      <img
                        src={
                          itemImage
                        }
                        alt={
                          item.name
                        }
                        className="h-full w-full object-contain"
                      />

                    </div>

                    <div className="p-3">

                      <h3 className="line-clamp-2 min-h-10 font-bold">
                        {item.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">

                        <span className="font-black text-yellow-400">
                          ₹
                          {
                            itemPrice
                          }
                        </span>

                        {itemMrp >
                          itemPrice && (
                          <span className="text-xs text-zinc-500 line-through">
                            ₹
                            {
                              itemMrp
                            }
                          </span>
                        )}

                      </div>

                      <p className="mt-1 text-xs text-zinc-400">
                        Stock:{" "}
                        {item.stock ||
                          0}
                      </p>

                      <div className="mt-3 flex gap-2">

                        <button
                          onClick={() =>
                            editProduct(
                              item
                            )
                          }
                          className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold hover:bg-blue-500"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            removeProduct(
                              item.id
                            )
                          }
                          className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold hover:bg-red-500"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {filteredProducts.length ===
            0 && (
            <div className="py-12 text-center text-zinc-500">
              No Products Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}