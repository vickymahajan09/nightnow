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

  // OLD + NEW IMAGE SYSTEM
  const [images, setImages] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [editingId, setEditingId] = useState("");

  const [search, setSearch] = useState("");

  // ==============================
  // LOAD DATA
  // ==============================

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // UPLOAD MULTIPLE IMAGES
  // ==============================

  const uploadImages = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const remainingSlots = 5 - images.length;

    if (remainingSlots <= 0) {
      alert("Maximum 5 images allowed.");
      e.target.value = "";
      return;
    }

    const selectedFiles = files.slice(
      0,
      remainingSlots
    );

    if (files.length > remainingSlots) {
      alert(
        `Only ${remainingSlots} more image${
          remainingSlots > 1 ? "s" : ""
        } can be added. Maximum 5 images allowed.`
      );
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();

        formData.append("file", file);

        formData.append(
          "upload_preset",
          "nightnow"
        );

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
          formData
        );

        if (response.data?.secure_url) {
          uploadedUrls.push(
            response.data.secure_url
          );
        }
      }

      setImages((prev) => [
        ...prev,
        ...uploadedUrls,
      ]);

      if (uploadedUrls.length > 0) {
        alert(
          `${uploadedUrls.length} image${
            uploadedUrls.length > 1 ? "s" : ""
          } uploaded successfully`
        );
      }
    } catch (error) {
      console.error(
        "Multiple image upload error:",
        error
      );

      alert(
        "Image upload failed. Please try again."
      );
    } finally {
      setUploading(false);

      // Allow selecting same file again
      e.target.value = "";
    }
  };

  // ==============================
  // REMOVE IMAGE
  // ==============================

  const removeImage = (index: number) => {
    setImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
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
    setImages([]);
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
      images.length === 0
    ) {
      alert(
        "Please fill all required fields and upload at least 1 image."
      );
      return;
    }

    if (images.length > 5) {
      alert("Maximum 5 images allowed.");
      return;
    }

    try {
      const product = {
        name: name.trim(),

        price: Number(price),

        category,

        stock: Number(stock || 0),

        description: description.trim(),

        // NEW IMAGE ARRAY
        images,

        // MAIN IMAGE
        // Keeps compatibility with existing product cards
        image: images[0],
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
        await addProduct(product);

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

  // ==============================
  // DELETE PRODUCT
  // ==============================

  const removeProduct = async (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this product?"
      )
    ) {
      return;
    }

    try {
      await deleteProduct(id);

      await loadProducts();

      alert(
        "Product Deleted Successfully"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete product"
      );
    }
  };

  // ==============================
  // EDIT PRODUCT
  // ==============================

  const editProduct = (
    item: any
  ) => {
    setEditingId(item.id);

    setName(item.name || "");

    setPrice(
      String(item.price || "")
    );

    setCategory(
      item.category || ""
    );

    setStock(
      String(item.stock || "")
    );

    setDescription(
      item.description || ""
    );

    // SUPPORT BOTH:
    // new products -> images[]
    // old products -> image

    let existingImages: string[] = [];

    if (
      Array.isArray(item.images)
    ) {
      existingImages =
        item.images.filter(
          (url: any) =>
            typeof url === "string" &&
            url.trim()
        );
    }

    if (
      existingImages.length === 0 &&
      item.image
    ) {
      existingImages = [
        item.image,
      ];
    }

    setImages(
      existingImages.slice(0, 5)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==============================
  // SEARCH PRODUCTS
  // ==============================

  const filteredProducts =
    products.filter(
      (item: any) =>
        item.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  // ==============================
  // PAGE
  // ==============================

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* ============================== */}
        {/* TITLE */}
        {/* ============================== */}

        <h1 className="text-4xl font-bold text-yellow-400">
          {editingId
            ? "Edit Product"
            : "Add Product"}
        </h1>

        <p className="mt-2 text-zinc-500">
          Add up to 5 images for each product.
        </p>

        {/* ============================== */}
        {/* PRODUCT FORM */}
        {/* ============================== */}

        <div className="mt-8 max-w-xl rounded-2xl bg-zinc-900 p-5">

          {/* PRODUCT NAME */}

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* PRICE */}

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
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
                  {cat.icon}{" "}
                  {cat.name}
                </option>
              )
            )}
          </select>

          {/* STOCK */}

          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* DESCRIPTION */}

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows={4}
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* ============================== */}
          {/* MULTIPLE IMAGE UPLOAD */}
          {/* ============================== */}

          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-800/50 p-4">

            <div className="flex items-center justify-between">

              <div>
                <p className="font-bold">
                  Product Images
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Upload maximum 5 images
                </p>
              </div>

              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                {images.length}/5
              </span>

            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              disabled={
                uploading ||
                images.length >= 5
              }
              onChange={uploadImages}
              className="mt-4 w-full cursor-pointer rounded-lg bg-zinc-800 p-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />

            {uploading && (
              <p className="mt-3 font-semibold text-yellow-400">
                Uploading images...
              </p>
            )}

            {/* IMAGE PREVIEW */}

            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900"
                    >

                      <img
                        src={image}
                        alt={`Product image ${
                          index + 1
                        }`}
                        className="h-32 w-full object-cover"
                      />

                      {/* MAIN IMAGE LABEL */}

                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded-md bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                          MAIN
                        </div>
                      )}

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 font-black text-white shadow-lg hover:bg-red-500"
                      >
                        ×
                      </button>

                      <div className="p-2 text-center text-xs text-zinc-400">
                        Image{" "}
                        {index + 1}
                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* ============================== */}
          {/* SAVE */}
          {/* ============================== */}

          <button
            type="button"
            onClick={saveProduct}
            disabled={
              uploading
            }
            className="mt-5 w-full rounded-lg bg-yellow-400 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : editingId
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
              className="mt-3 w-full rounded-lg bg-zinc-800 py-3 font-bold hover:bg-zinc-700"
            >
              Cancel Edit
            </button>
          )}

        </div>

        {/* ============================== */}
        {/* PRODUCT LIST */}
        {/* ============================== */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Products
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {products.length} total products
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
              className="rounded-lg bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400 md:w-80"
            />

          </div>

          {/* PRODUCT GRID */}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (item: any) => {

                const productImages =
                  Array.isArray(
                    item.images
                  ) &&
                  item.images.length > 0
                    ? item.images
                    : item.image
                    ? [item.image]
                    : [];

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl bg-zinc-900"
                  >

                    {/* IMAGE */}

                    <div className="relative">

                      <img
                        src={
                          productImages[0] ||
                          "/no-image.png"
                        }
                        alt={item.name}
                        className="h-40 w-full object-cover"
                      />

                      {/* IMAGE COUNT */}

                      {productImages.length >
                        1 && (
                        <div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-1 text-xs font-bold text-white">
                          📷{" "}
                          {
                            productImages.length
                          }
                        </div>
                      )}

                    </div>

                    <div className="p-3">

                      <h3 className="line-clamp-2 min-h-10 font-bold">
                        {item.name}
                      </h3>

                      <p className="mt-2 text-lg font-bold text-yellow-400">
                        ₹{item.price}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        Stock:{" "}
                        {item.stock ||
                          0}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {productImages.length}{" "}
                        image
                        {productImages.length !==
                        1
                          ? "s"
                          : ""}
                      </p>

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
                );
              }
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