"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getProductById } from "../../services/productService";
import { useCart } from "../../context/CartContext";

export default function ProductPage() {
  const params = useParams();

  const { addToCart, removeFromCart, cart } =
    useCart();

  const [product, setProduct] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [selectedImage, setSelectedImage] =
    useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const id = String(params.id);

        const data =
          await getProductById(id);

        setProduct(data);

        const firstImage =
          Array.isArray(data?.images) && data.images.length > 0
            ? data.images[0]
            : data?.image || "";

        setSelectedImage(firstImage);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-96 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <div className="text-6xl">🔍</div>

          <h1 className="mt-5 text-2xl font-black">
            Product Not Found
          </h1>

          <Link href="/">
            <button className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-black">
              Back to Store
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const stock = Number(
    product.stock || 0
  );

  const cartItem = cart.find(
    (item: any) =>
      item.id === product.id
  );

  const quantity = Number(
    cartItem?.quantity || 0
  );

  const price = Number(
    product.price || 0
  );

  const mrp = Number(
    product.mrp || price
  );

  const discount =
    mrp > price
      ? Math.round(
          ((mrp - price) / mrp) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-28 text-black">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Back to Store
        </Link>

        <div className="mt-5 grid gap-6 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-2 md:p-7">

          {/* IMAGE */}

          <div>
            <div className="relative overflow-hidden rounded-2xl bg-zinc-100">

              {discount > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white">
                  {discount}% OFF
                </span>
              )}

              <img
                src={selectedImage || product.image || "/no-image.png"}
                alt={product.name || "Product"}
                className="h-[360px] w-full object-contain p-5 md:h-[480px]"
              />
            </div>

            {Array.isArray(product.images) && product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.slice(0, 5).map((image: string, index: number) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 ${selectedImage === image ? "border-yellow-400" : "border-zinc-200"}`}
                  >
                    <img src={image} alt={`${product.name || "Product"} ${index + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="flex flex-col justify-center">

            <p className="text-xs font-bold uppercase text-yellow-600">
              {product.category ||
                "Daily Essential"}
            </p>

            <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
              {product.name}
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              {product.pack ||
                product.quantityLabel ||
                "1 pack"}
            </p>

            <div className="mt-5 flex items-center gap-3">

              <span className="text-3xl font-black">
                ₹{price}
              </span>

              {mrp > price && (
                <span className="text-lg text-zinc-400 line-through">
                  ₹{mrp}
                </span>
              )}

              {discount > 0 && (
                <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                  {discount}% OFF
                </span>
              )}

            </div>

            {product.description && (
              <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
                <h2 className="font-black">
                  Product Details
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-6">

              {stock <= 0 ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-zinc-200 py-4 font-black text-zinc-500"
                >
                  OUT OF STOCK
                </button>
              ) : quantity === 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      ...product,
                      quantity: 1,
                    })
                  }
                  className="w-full rounded-xl bg-yellow-400 py-4 text-lg font-black hover:bg-yellow-300"
                >
                  ADD TO CART
                </button>
              ) : (
                <div className="flex h-14 overflow-hidden rounded-xl bg-yellow-400">

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(
                        product.id
                      )
                    }
                    className="w-16 bg-black text-2xl font-black text-white"
                  >
                    −
                  </button>

                  <div className="flex flex-1 items-center justify-center text-xl font-black">
                    {quantity}
                  </div>

                  <button
                    type="button"
                    disabled={
                      quantity >= stock
                    }
                    onClick={() =>
                      addToCart({
                        ...product,
                        quantity: 1,
                      })
                    }
                    className="w-16 bg-black text-2xl font-black text-white disabled:opacity-40"
                  >
                    +
                  </button>

                </div>
              )}

            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">

              <div className="rounded-xl bg-zinc-50 p-3">
                ⚡
                <p className="mt-1 font-bold">
                  Fast Delivery
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3">
                🔒
                <p className="mt-1 font-bold">
                  Secure Payment
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3">
                📦
                <p className="mt-1 font-bold">
                  Easy Ordering
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}