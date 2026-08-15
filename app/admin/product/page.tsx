"use client";

import {
  addProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} from "../../services/productService";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCategories } from "../../services/categoryService";

import {
  getBrands,
  type Brand,
} from "../../services/brandService";

export default function AddProductPage() {
  // ==========================================
  // PRODUCT FORM
  // ==========================================

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] =
    useState("");

  const [image, setImage] = useState("");

  // ==========================================
  // STATES
  // ==========================================

  const [uploading, setUploading] =
    useState(false);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loadingBrands, setLoadingBrands] =
    useState(true);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadBrands();
  }, []);

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const loadProducts = async () => {
    try {
      const data =
        await getProducts();

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Products load error:",
        error
      );
    }
  };

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  const loadCategories = async () => {
    try {
      const data =
        await getCategories();

      setCategories(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Categories load error:",
        error
      );
    }
  };

  // ==========================================
  // LOAD BRANDS
  // ==========================================

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);

      const data =
        await getBrands();

      // Only enabled brands
      const activeBrands =
        Array.isArray(data)
          ? data.filter(
              (brand) =>
                brand.active !== false
            )
          : [];

      setBrands(activeBrands);
    } catch (error) {
      console.error(
        "Brands load error:",
        error
      );

      setBrands([]);

      alert(
        "Failed to load brands. Please check Brand Editor / Firebase permissions."
      );
    } finally {
      setLoadingBrands(false);
    }
  };

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) {
      return;
    }

    const file =
      e.target.files[0];

    const data =
      new FormData();

    data.append(
      "file",
      file
    );

    data.append(
      "upload_preset",
      "nightnow"
    );

    setUploading(true);

    try {
      const res =
        await axios.post(
          "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
          data
        );

      setImage(
        res.data.secure_url
      );

      alert(
        "Image Uploaded Successfully"
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      alert(
        "Image Upload Failed"
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // CLEAR FORM
  // ==========================================

  const clearForm = () => {
    setName("");
    setPrice("");
    setCategory("");

    setBrandId("");
    setBrandName("");

    setStock("");
    setDescription("");
    setImage("");

    setEditingId("");
  };

  // ==========================================
  // SAVE / UPDATE PRODUCT
  // ==========================================

  const saveProduct =
    async () => {
      if (
        !name.trim() ||
        !price ||
        !category ||
        !image
      ) {
        alert(
          "Please fill all required fields"
        );

        return;
      }

      try {
        // Find selected brand
        const selectedBrand =
          brands.find(
            (brand) =>
              brand.id === brandId
          );

        const finalBrandName =
          selectedBrand?.name ||
          brandName ||
          "";

        const product = {
          name:
            name.trim(),

          price:
            Number(price),

          category,

          // BRAND DATA
          brandId:
            brandId || "",

          brandName:
            finalBrandName,

          stock:
            Number(stock || 0),

          description,

          image,
        };

        if (editingId) {
          await updateProduct(
            editingId,
            product
          );

          alert(
            "Product Updated Successfully"
          );
        } else {
          await addProduct(
            product
          );

          alert(
            "Product Added Successfully"
          );
        }

        clearForm();

        await loadProducts();

      } catch (error) {
        console.error(
          "Save product error:",
          error
        );

        alert(
          "Failed to Save Product"
        );
      }
    };

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const removeProduct =
    async (
      id: string
    ) => {
      if (
        !confirm(
          "Delete Product?"
        )
      ) {
        return;
      }

      try {
        await deleteProduct(
          id
        );

        await loadProducts();

        alert(
          "Product deleted successfully"
        );
      } catch (error) {
        console.error(
          "Delete product error:",
          error
        );

        alert(
          "Failed to delete product"
        );
      }
    };

  // ==========================================
  // EDIT PRODUCT
  // ==========================================

  const editProduct =
    (item: any) => {
      setEditingId(
        item.id
      );

      setName(
        item.name || ""
      );

      setPrice(
        String(
          item.price || ""
        )
      );

      setCategory(
        item.category || ""
      );

      // Existing product brand
      setBrandId(
        item.brandId || ""
      );

      setBrandName(
        item.brandName || ""
      );

      setStock(
        String(
          item.stock || ""
        )
      );

      setDescription(
        item.description || ""
      );

      setImage(
        item.image || ""
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // ==========================================
  // SEARCH PRODUCTS
  // ==========================================

  const filteredProducts =
    products.filter(
      (item: any) => {
        const text =
          search
            .toLowerCase()
            .trim();

        if (!text) {
          return true;
        }

        const productName =
          String(
            item.name || ""
          ).toLowerCase();

        const productBrand =
          String(
            item.brandName || ""
          ).toLowerCase();

        return (
          productName.includes(
            text
          ) ||
          productBrand.includes(
            text
          )
        );
      }
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* =====================================
            TITLE
        ====================================== */}

        <div className="mb-8">

          <h1 className="text-4xl font-black text-yellow-400">
            {editingId
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Add, edit and manage Night Now products.
          </p>

        </div>

        {/* =====================================
            PRODUCT FORM
        ====================================== */}

        <div className="max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

          {/* PRODUCT NAME */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Product Name *
            </label>

            <input
              placeholder="Product Name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

          </div>

          {/* PRICE */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Price *
            </label>

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

          </div>

          {/* ===================================
              BRAND
          ==================================== */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Brand
            </label>

            <select
              value={brandId}
              onChange={(e) => {

                const selectedId =
                  e.target.value;

                setBrandId(
                  selectedId
                );

                const selected =
                  brands.find(
                    (brand) =>
                      brand.id ===
                      selectedId
                  );

                setBrandName(
                  selected?.name ||
                    ""
                );
              }}
              disabled={
                loadingBrands
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400 disabled:opacity-50"
            >

              <option value="">
                {loadingBrands
                  ? "Loading Brands..."
                  : "Select Brand"}
              </option>

              {brands.map(
                (brand) => (
                  <option
                    key={
                      brand.id
                    }
                    value={
                      brand.id
                    }
                  >
                    {brand.name}
                  </option>
                )
              )}

            </select>

            {!loadingBrands &&
              brands.length ===
                0 && (
                <p className="mt-2 text-xs text-red-400">
                  No active brands found.
                  Add a brand from Brand Editor first.
                </p>
              )}

          </div>

          {/* CATEGORY */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Category *
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            >

              <option value="">
                Select Category
              </option>

              {categories.map(
                (cat: any) => (
                  <option
                    key={
                      cat.id
                    }
                    value={
                      cat.id
                    }
                  >
                    {cat.icon}{" "}
                    {cat.name}
                  </option>
                )
              )}

            </select>

          </div>

          {/* STOCK */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Stock
            </label>

            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

          </div>

          {/* DESCRIPTION */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Description
            </label>

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

          </div>

          {/* IMAGE */}

          <div className="mb-4">

            <label className="mb-2 block text-xs font-bold text-zinc-400">
              Product Image *
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                uploadImage
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />

          </div>

          {/* UPLOADING */}

          {uploading && (
            <p className="mb-4 font-bold text-yellow-400">
              Uploading Image...
            </p>
          )}

          {/* IMAGE PREVIEW */}

          {image && (
            <div className="mb-5">

              <p className="mb-2 text-xs font-bold text-zinc-400">
                Image Preview
              </p>

              <img
                src={image}
                alt="Preview"
                className="h-40 w-40 rounded-xl bg-white object-contain p-2"
              />

            </div>
          )}

          {/* SELECTED BRAND PREVIEW */}

          {brandName && (
            <div className="mb-5 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3">

              <p className="text-[10px] font-bold text-zinc-500">
                SELECTED BRAND
              </p>

              <p className="mt-1 font-black text-yellow-400">
                {brandName}
              </p>

            </div>
          )}

          {/* SAVE */}

          <button
            type="button"
            onClick={
              saveProduct
            }
            disabled={
              uploading
            }
            className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {editingId
              ? "Update Product"
              : "Save Product"}
          </button>

          {/* CANCEL EDIT */}

          {editingId && (
            <button
              type="button"
              onClick={
                clearForm
              }
              className="mt-3 w-full rounded-xl bg-zinc-800 py-3 font-bold hover:bg-zinc-700"
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* =====================================
            PRODUCT LIST
        ====================================== */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-black">
                Products
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
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
              placeholder="Search product or brand..."
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-yellow-400 md:w-80"
            />

          </div>

          {/* PRODUCT CARDS */}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (item: any) => (

                <div
                  key={
                    item.id
                  }
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                >

                  {/* IMAGE */}

                  <div className="flex h-40 items-center justify-center bg-white">

                    <img
                      src={
                        item.image ||
                        "/no-image.png"
                      }
                      alt={
                        item.name ||
                        "Product"
                      }
                      className="h-full w-full object-contain p-2"
                    />

                  </div>

                  {/* CONTENT */}

                  <div className="p-3">

                    <h3 className="line-clamp-2 min-h-10 font-bold">
                      {item.name}
                    </h3>

                    {/* BRAND */}

                    {item.brandName && (
                      <p className="mt-1 truncate text-xs font-bold text-yellow-400">
                        🏷️{" "}
                        {
                          item.brandName
                        }
                      </p>
                    )}

                    {/* PRICE */}

                    <p className="mt-2 text-lg font-black text-yellow-400">
                      ₹
                      {
                        item.price
                      }
                    </p>

                    {/* STOCK */}

                    <p className="mt-1 text-sm text-zinc-400">
                      Stock:{" "}
                      {
                        item.stock ||
                        0
                      }
                    </p>

                    {/* CATEGORY */}

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      Category:{" "}
                      {
                        item.category ||
                        "-"
                      }
                    </p>

                    {/* ACTIONS */}

                    <div className="mt-3 flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          editProduct(
                            item
                          )
                        }
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold hover:bg-blue-500"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(
                            item.id
                          )
                        }
                        className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold hover:bg-red-500"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

          {filteredProducts.length ===
            0 && (
            <div className="py-10 text-center text-zinc-400">
              No Products Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}