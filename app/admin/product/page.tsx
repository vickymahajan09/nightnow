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

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [editingId, setEditingId] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // ==============================
  // LOAD PRODUCTS
  // ==============================

  const loadProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load products");
    }
  };

  // ==============================
  // LOAD CATEGORIES
  // ==============================

  const loadCategories = async () => {
    try {
      const data = await getCategories();

      setCategories(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // REFRESH
  // ==============================

  const refreshProducts = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // ==============================
  // IMAGE UPLOAD
  // ==============================

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    const data = new FormData();

    data.append("file", file);
    data.append("upload_preset", "nightnow");

    setUploading(true);

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
        data
      );

      setImage(res.data.secure_url);

      alert("Image Uploaded Successfully");
    } catch (error) {
      console.error(error);
      alert("Image Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  // ==============================
  // CLEAR FORM
  // ==============================

  const clearForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setStock("");
    setDescription("");
    setImage("");
    setEditingId("");
  };

  // ==============================
  // SAVE PRODUCT
  // ==============================

  const saveProduct = async () => {
    if (
      !name.trim() ||
      !price ||
      !category ||
      !image
    ) {
      alert("Please fill all required fields");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock || 0);

    if (numericPrice <= 0) {
      alert("Enter a valid price");
      return;
    }

    if (numericStock < 0) {
      alert("Stock cannot be negative");
      return;
    }

    setSaving(true);

    try {
      const product = {
        name: name.trim(),
        price: numericPrice,
        category,
        stock: numericStock,
        description: description.trim(),
        image,
        active: true,
      };

      if (editingId) {
        await updateProduct(
          editingId,
          product
        );

        alert("Product Updated Successfully");
      } else {
        await addProduct(product);

        alert("Product Added Successfully");
      }

      clearForm();

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to Save Product");
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // DELETE PRODUCT
  // ==============================

  const removeProduct = async (
    id: string
  ) => {
    if (!confirm("Delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);

      setProducts((old) =>
        old.filter(
          (item) => item.id !== id
        )
      );

      if (editingId === id) {
        clearForm();
      }

      alert("Product Deleted");
    } catch (error) {
      console.error(error);
      alert("Failed to delete product");
    }
  };

  // ==============================
  // EDIT PRODUCT
  // ==============================

  const editProduct = (item: any) => {
    setEditingId(item.id);

    setName(item.name || "");
    setPrice(String(item.price || ""));
    setCategory(item.category || "");
    setStock(String(item.stock || ""));
    setDescription(
      item.description || ""
    );
    setImage(item.image || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==============================
  // TOGGLE ACTIVE / INACTIVE
  // ==============================

  const toggleProduct = async (
    item: any
  ) => {
    const newActive =
      item.active === false;

    try {
      await updateProduct(
        item.id,
        {
          active: newActive,
        }
      );

      setProducts((old) =>
        old.map((product) =>
          product.id === item.id
            ? {
                ...product,
                active: newActive,
              }
            : product
        )
      );
    } catch (error) {
      console.error(error);
      alert(
        "Failed to update product status"
      );
    }
  };

  // ==============================
  // CATEGORY NAME
  // ==============================

  const getCategoryName = (
    categoryId: string
  ) => {
    const categoryItem =
      categories.find(
        (cat: any) =>
          cat.id === categoryId
      );

    if (!categoryItem) {
      return categoryId || "Uncategorized";
    }

    return `${categoryItem.icon || ""} ${
      categoryItem.name || ""
    }`;
  };

  // ==============================
  // STOCK STATUS
  // ==============================

  const getStockStatus = (
    stockValue: number
  ) => {
    if (stockValue <= 0) {
      return {
        text: "Out of Stock",
        className:
          "bg-red-500/15 text-red-400",
      };
    }

    if (stockValue <= 5) {
      return {
        text: "Low Stock",
        className:
          "bg-yellow-400/15 text-yellow-400",
      };
    }

    return {
      text: "In Stock",
      className:
        "bg-green-500/15 text-green-400",
    };
  };

  // ==============================
  // FILTER PRODUCTS
  // ==============================

  const filteredProducts =
    products.filter((item: any) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        searchText === "" ||
        item.name
          ?.toLowerCase()
          .includes(searchText) ||
        item.description
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        categoryFilter === "all" ||
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  // ==============================
  // COUNTS
  // ==============================

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (item) => item.active !== false
    ).length;

  const inactiveProducts =
    products.filter(
      (item) => item.active === false
    ).length;

  const lowStockProducts =
    products.filter(
      (item) =>
        Number(item.stock || 0) > 0 &&
        Number(item.stock || 0) <= 5
    ).length;

  const outOfStockProducts =
    products.filter(
      (item) =>
        Number(item.stock || 0) <= 0
    ).length;

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ==============================
            HEADER
        ============================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold text-zinc-500">
              Night Now Admin
            </p>

            <h1 className="mt-1 text-3xl font-black text-yellow-400 md:text-4xl">
              {editingId
                ? "Edit Product"
                : "Products"}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your store inventory
            </p>
          </div>

          <button
            type="button"
            onClick={refreshProducts}
            disabled={refreshing}
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold hover:bg-zinc-700 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* ==============================
            STATISTICS
        ============================== */}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">

          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-black">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">
              Active
            </p>

            <p className="mt-1 text-2xl font-black text-green-400">
              {activeProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">
              Inactive
            </p>

            <p className="mt-1 text-2xl font-black text-zinc-400">
              {inactiveProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">
              Low Stock
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-400">
              {lowStockProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">
              Out of Stock
            </p>

            <p className="mt-1 text-2xl font-black text-red-400">
              {outOfStockProducts}
            </p>
          </div>

        </div>

        {/* ==============================
            ADD / EDIT FORM
        ============================== */}

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:p-6">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                {editingId
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Required fields: name, price,
                category and image
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
              >
                Cancel
              </button>
            )}

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Product Name *
              </label>

              <input
                placeholder="e.g. Maggi 70g"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* PRICE */}

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Price *
              </label>

              <input
                type="number"
                min="0"
                placeholder="Price"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Category *
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
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
                      {cat.icon || ""}{" "}
                      {cat.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* STOCK */}

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Stock
              </label>

              <input
                type="number"
                min="0"
                placeholder="Stock quantity"
                value={stock}
                onChange={(e) =>
                  setStock(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Description
            </label>

            <textarea
              placeholder="Product description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={4}
              className="w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* IMAGE */}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Product Image *
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
              className="w-full rounded-xl bg-zinc-800 p-3 text-sm"
            />

            {uploading && (
              <p className="mt-3 text-sm font-bold text-yellow-400">
                ⏳ Uploading Image...
              </p>
            )}

            {image && (
              <div className="mt-4 flex items-start gap-4">

                <img
                  src={image}
                  alt="Product Preview"
                  className="h-32 w-32 rounded-xl object-cover"
                />

                <button
                  type="button"
                  onClick={() =>
                    setImage("")
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold"
                >
                  Remove Image
                </button>

              </div>
            )}
          </div>

          {/* SAVE */}

          <button
            type="button"
            onClick={saveProduct}
            disabled={
              uploading || saving
            }
            className="mt-5 w-full rounded-xl bg-yellow-400 py-4 font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Product"
              : "Save Product"}
          </button>

        </div>

        {/* ==============================
            PRODUCT LIST HEADER
        ============================== */}

        <div className="mt-10">

          <div className="mb-5">

            <h2 className="text-2xl font-black">
              Product Inventory
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Showing {filteredProducts.length} of{" "}
              {products.length} products
            </p>

          </div>

          {/* FILTERS */}

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="🔎 Search product..."
              className="rounded-xl bg-zinc-900 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value
                )
              }
              className="rounded-xl bg-zinc-900 p-4 outline-none"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map(
                (cat: any) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                  >
                    {cat.name}
                  </option>
                )
              )}
            </select>

          </div>

        </div>

        {/* ==============================
            PRODUCTS
        ============================== */}

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">

          {filteredProducts.map(
            (item: any) => {
              const stockValue =
                Number(item.stock || 0);

              const stockStatus =
                getStockStatus(
                  stockValue
                );

              const isActive =
                item.active !== false;

              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border bg-zinc-900 ${
                    isActive
                      ? "border-zinc-800"
                      : "border-zinc-700 opacity-70"
                  }`}
                >

                  {/* IMAGE */}

                  <div className="relative">

                    <img
                      src={
                        item.image ||
                        "/no-image.png"
                      }
                      alt={item.name}
                      className="h-40 w-full object-cover"
                    />

                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-black ${stockStatus.className}`}
                    >
                      {stockStatus.text}
                    </span>

                  </div>

                  {/* CONTENT */}

                  <div className="p-3">

                    <h3 className="line-clamp-2 min-h-10 text-sm font-black">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      {getCategoryName(
                        item.category
                      )}
                    </p>

                    <p className="mt-2 text-xl font-black text-yellow-400">
                      ₹{item.price}
                    </p>

                    <div className="mt-1 flex items-center justify-between">

                      <p className="text-sm text-zinc-400">
                        Stock:{" "}
                        <span className="font-bold text-white">
                          {stockValue}
                        </span>
                      </p>

                      <span
                        className={`text-xs font-bold ${
                          isActive
                            ? "text-green-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {isActive
                          ? "● Active"
                          : "● Inactive"}
                      </span>

                    </div>

                    {/* ACTIVE TOGGLE */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleProduct(
                          item
                        )
                      }
                      className={`mt-3 w-full rounded-lg py-2 text-xs font-black ${
                        isActive
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    >
                      {isActive
                        ? "✓ Active — Disable"
                        : "○ Inactive — Enable"}
                    </button>

                    {/* EDIT DELETE */}

                    <div className="mt-2 flex gap-2">

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
              );
            }
          )}

        </div>

        {/* EMPTY */}

        {filteredProducts.length === 0 && (
          <div className="mt-5 rounded-2xl bg-zinc-900 py-16 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <p className="mt-4 text-xl font-bold">
              No Products Found
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Try another product name or
              category.
            </p>

          </div>
        )}

      </div>
    </main>
  );
}