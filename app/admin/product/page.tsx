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
  const [description, setDescription] =
    useState("");
  const [image, setImage] = useState("");

  const [uploading, setUploading] =
    useState(false);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

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

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    const data = new FormData();

    data.append("file", file);
    data.append(
      "upload_preset",
      "nightnow"
    );

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

  const clearForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setStock("");
    setDescription("");
    setImage("");
    setEditingId("");
  };

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

    try {
      const product = {
        name: name.trim(),
        price: Number(price),
        category,
        stock: Number(stock || 0),
        description,
        image,
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
    }
  };

  const removeProduct = async (
    id: string
  ) => {
    if (!confirm("Delete Product?")) {
      return;
    }

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to delete product");
    }
  };

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

  const filteredProducts =
    products.filter((item: any) =>
      item.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-7xl">

        <h1 className="text-4xl font-bold text-yellow-400">
          {editingId
            ? "Edit Product"
            : "Add Product"}
        </h1>

        <div className="mt-8 max-w-xl rounded-2xl bg-zinc-900 p-5">

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
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
                  {cat.icon} {cat.name}
                </option>
              )
            )}
          </select>

          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows={4}
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
          />

          <input
            type="file"
            accept="image/*"
            onChange={uploadImage}
            className="mb-4 w-full rounded-lg bg-zinc-800 p-3"
          />

          {uploading && (
            <p className="mb-4 font-semibold text-yellow-400">
              Uploading Image...
            </p>
          )}

          {image && (
            <img
              src={image}
              alt="Preview"
              className="mb-5 h-40 w-40 rounded-lg object-cover"
            />
          )}

          <button
            onClick={saveProduct}
            disabled={uploading}
            className="w-full rounded-lg bg-yellow-400 py-3 font-bold text-black disabled:opacity-50"
          >
            {editingId
              ? "Update Product"
              : "Save Product"}
          </button>

          {editingId && (
            <button
              onClick={clearForm}
              className="mt-3 w-full rounded-lg bg-zinc-800 py-3 font-bold"
            >
              Cancel Edit
            </button>
          )}

        </div>

        <div className="mt-10">

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <h2 className="text-2xl font-bold">
              Products
            </h2>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products..."
              className="rounded-lg bg-zinc-900 p-3 outline-none md:w-80"
            />

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (item: any) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl bg-zinc-900"
                >

                  <img
                    src={
                      item.image ||
                      "/no-image.png"
                    }
                    alt={item.name}
                    className="h-40 w-full object-cover"
                  />

                  <div className="p-3">

                    <h3 className="line-clamp-2 min-h-10 font-bold">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-lg font-bold text-yellow-400">
                      ₹{item.price}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      Stock: {item.stock || 0}
                    </p>

                    <div className="mt-3 flex gap-2">

                      <button
                        onClick={() =>
                          editProduct(item)
                        }
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          removeProduct(
                            item.id
                          )
                        }
                        className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-zinc-400">
              No Products Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}