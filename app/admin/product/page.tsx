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

  // 5 PRODUCT IMAGES
  const [images, setImages] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [uploadingImage, setUploadingImage] =
    useState<number | null>(null);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  // =====================================
  // LOAD DATA
  // =====================================

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
        "Products loading error:",
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
        "Categories loading error:",
        error
      );
    }
  };

  // =====================================
  // UPLOAD ONE OF 5 IMAGES
  // =====================================

  const uploadImage = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) {
      return;
    }

    const file = e.target.files[0];

    const data = new FormData();

    data.append("file", file);
    data.append(
      "upload_preset",
      "nightnow"
    );

    setUploadingImage(index);

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
        data
      );

      const uploadedUrl =
        res.data.secure_url;

      setImages((previous) => {
        const next = [...previous];

        next[index] = uploadedUrl;

        return next;
      });

      alert(
        `Image ${index + 1} Uploaded Successfully`
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      alert(
        `Image ${index + 1} Upload Failed`
      );
    } finally {
      setUploadingImage(null);

      // Allow selecting same file again
      e.target.value = "";
    }
  };

  // =====================================
  // REMOVE IMAGE
  // =====================================

  const removeImage = (
    index: number
  ) => {
    setImages((previous) => {
      const next = [...previous];

      next[index] = "";

      return next;
    });
  };

  // =====================================
  // CLEAR FORM
  // =====================================

  const clearForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setStock("");
    setDescription("");

    setImages([
      "",
      "",
      "",
      "",
      "",
    ]);

    setEditingId("");
    setUploadingImage(null);
  };

  // =====================================
  // SAVE / UPDATE PRODUCT
  // =====================================

  const saveProduct = async () => {
    const validImages =
      images.filter(
        (item) =>
          item &&
          item.trim() !== ""
      );

    if (
      !name.trim() ||
      !price ||
      !category ||
      validImages.length === 0
    ) {
      alert(
        "Please fill Product Name, Price, Category and add at least 1 image."
      );

      return;
    }

    try {
      const product = {
        name: name.trim(),

        price: Number(price),

        category,

        stock: Number(
          stock || 0
        ),

        description:
          description.trim(),

        // MAIN IMAGE
        image:
          validImages[0],

        // ALL IMAGES
        images: validImages,
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

  // =====================================
  // DELETE PRODUCT
  // =====================================

  const removeProduct = async (
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
      await deleteProduct(id);

      await loadProducts();

      alert(
        "Product Deleted Successfully"
      );
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      alert(
        "Failed to Delete Product"
      );
    }
  };

  // =====================================
  // EDIT PRODUCT
  // =====================================

  const editProduct = (
    item: any
  ) => {
    setEditingId(item.id);

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

    setStock(
      String(
        item.stock || ""
      )
    );

    setDescription(
      item.description || ""
    );

    // Support old products
    // that only have "image"
    let productImages: string[] =
      [];

    if (
      Array.isArray(
        item.images
      )
    ) {
      productImages =
        item.images.filter(
          (img: any) =>
            typeof img ===
              "string" &&
            img.trim() !== ""
        );
    }

    // Old product compatibility
    if (
      productImages.length ===
        0 &&
      item.image
    ) {
      productImages = [
        item.image,
      ];
    }

    // Always keep exactly 5 slots
    const fiveImages = [
      ...productImages,
      "",
      "",
      "",
      "",
      "",
    ].slice(0, 5);

    setImages(
      fiveImages
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // SEARCH
  // =====================================

  const filteredProducts =
    products.filter(
      (item: any) =>
        String(
          item.name || ""
        )
          .toLowerCase()
          .includes(
            search
              .toLowerCase()
          )
    );

  // =====================================
  // UI
  // =====================================

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-xs font-bold text-zinc-500">
            ADMIN PANEL
          </p>

          <h1 className="mt-1 text-3xl font-black text-yellow-400 md:text-4xl">
            {editingId
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Add and manage your products.
          </p>

        </div>

        {/* =================================
            PRODUCT FORM
        ================================== */}

        <div className="max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <div className="space-y-4">

            {/* PRODUCT NAME */}

            <input
              placeholder="Product Name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

            {/* PRICE */}

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
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
                    {cat.icon
                      ? `${cat.icon} `
                      : ""}
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
                setStock(
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
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
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-800 p-3 outline-none focus:border-yellow-400"
            />

            {/* =================================
                5 IMAGE UPLOADS
            ================================== */}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <div className="mb-4">

                <h2 className="text-lg font-black text-yellow-400">
                  Product Images
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  You can upload up to 5 images.
                </p>

              </div>

              <div className="space-y-3">

                {images.map(
                  (
                    imageUrl,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-xs font-black">
                          Image{" "}
                          {index + 1}
                        </span>

                        {imageUrl && (
                          <span className="rounded-full bg-green-500/10 px-2 py-1 text-[9px] font-black text-green-400">
                            UPLOADED
                          </span>
                        )}

                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(
                          e
                        ) =>
                          uploadImage(
                            index,
                            e
                          )
                        }
                        disabled={
                          uploadingImage !==
                            null
                        }
                        className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-xl file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
                      />

                      {uploadingImage ===
                        index && (
                        <p className="mt-2 text-xs font-bold text-yellow-400">
                          Uploading Image{" "}
                          {index +
                            1}
                          ...
                        </p>
                      )}

                      {imageUrl && (
                        <div className="mt-3 flex items-center gap-3">

                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white">

                            <img
                              src={
                                imageUrl
                              }
                              alt={`Product image ${
                                index +
                                1
                              }`}
                              className="h-full w-full object-contain"
                            />

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black"
                          >
                            Remove
                          </button>

                        </div>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>

            {/* SAVE */}

            <button
              onClick={
                saveProduct
              }
              disabled={
                uploadingImage !==
                null
              }
              className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId
                ? "Update Product"
                : "Save Product"}
            </button>

            {/* CANCEL */}

            {editingId && (
              <button
                type="button"
                onClick={
                  clearForm
                }
                className="w-full rounded-2xl bg-zinc-800 py-4 font-black"
              >
                Cancel Edit
              </button>
            )}

          </div>

        </div>

        {/* =================================
            PRODUCTS
        ================================== */}

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-black">
                Products
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Edit or delete existing products.
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
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-sm outline-none focus:border-yellow-400 md:w-80"
            />

          </div>

          {/* PRODUCT GRID */}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (item: any) => {

                const productImage =
                  item.image ||
                  (Array.isArray(
                    item.images
                  )
                    ? item.images[0]
                    : "") ||
                  "/no-image.png";

                return (
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
                          productImage
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-full w-full object-contain"
                      />

                    </div>

                    <div className="p-3">

                      <h3 className="line-clamp-2 min-h-10 text-sm font-black">
                        {
                          item.name
                        }
                      </h3>

                      <p className="mt-2 text-lg font-black text-yellow-400">
                        ₹
                        {
                          item.price
                        }
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Stock:{" "}
                        {
                          item.stock ||
                          0
                        }
                      </p>

                      {/* IMAGE COUNT */}

                      {Array.isArray(
                        item.images
                      ) &&
                        item.images
                          .length >
                          1 && (
                          <p className="mt-1 text-[10px] font-bold text-zinc-500">
                            📷{" "}
                            {
                              item
                                .images
                                .length
                            } images
                          </p>
                        )}

                      {/* BUTTONS */}

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <button
                          onClick={() =>
                            editProduct(
                              item
                            )
                          }
                          className="rounded-xl bg-blue-600 py-2 text-xs font-black"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            removeProduct(
                              item.id
                            )
                          }
                          className="rounded-xl bg-red-600 py-2 text-xs font-black"
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

          {/* NO PRODUCTS */}

          {filteredProducts.length ===
            0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-500">
              No Products Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}