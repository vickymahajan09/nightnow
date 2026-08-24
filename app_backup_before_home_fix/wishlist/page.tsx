"use client";

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

type WishlistProduct = {
  id: string;
  productId: string;
  productName: string;
  image: string;
  price: number;
  mrp: number;
};

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setProducts([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const wishlistCollection = collection(
            db,
            "users",
            currentUser.uid,
            "wishlist"
          );

          const snapshot = await getDocs(
            wishlistCollection
          );

          const items: WishlistProduct[] =
            snapshot.docs.map((wishlistDoc) => {
              const data = wishlistDoc.data();

              return {
                id: wishlistDoc.id,
                productId:
                  String(
                    data.productId ||
                      wishlistDoc.id
                  ),
                productName:
                  String(
                    data.productName ||
                      "Product"
                  ),
                image:
                  String(
                    data.image || ""
                  ),
                price:
                  Number(
                    data.price || 0
                  ),
                mrp:
                  Number(
                    data.mrp || 0
                  ),
              };
            });

          setProducts(items);

          // Local cache bhi update rakho
          try {
            localStorage.setItem(
              "nightnow_wishlist_products",
              JSON.stringify(items)
            );

            localStorage.setItem(
              "nightnow_wishlist",
              JSON.stringify(
                items.map(
                  (item) =>
                    item.productId
                )
              )
            );
          } catch {
            // Ignore localStorage errors
          }
        } catch (error) {
          console.error(
            "Wishlist loading error:",
            error
          );

          setProducts([]);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const remove = async (
    productId: string
  ) => {
    if (!user) {
      return;
    }

    try {
      setRemovingId(productId);

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "wishlist",
          productId
        )
      );

      const updated =
        products.filter(
          (item) =>
            item.productId !==
            productId
        );

      setProducts(updated);

      try {
        localStorage.setItem(
          "nightnow_wishlist_products",
          JSON.stringify(updated)
        );

        localStorage.setItem(
          "nightnow_wishlist",
          JSON.stringify(
            updated.map(
              (item) =>
                item.productId
            )
          )
        );
      } catch {
        // Ignore localStorage errors
      }
    } catch (error) {
      console.error(
        "Wishlist remove error:",
        error
      );

      alert(
        "Wishlist se product remove nahi hua."
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-bold text-zinc-500"
          >
            ← Home
          </Link>

          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">
            <div className="text-5xl">
              ⏳
            </div>

            <p className="mt-4 font-black">
              Loading wishlist...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-bold text-zinc-500"
          >
            ← Home
          </Link>

          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">
            <div className="text-6xl">
              🔐
            </div>

            <h2 className="mt-4 text-xl font-black">
              Login required
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Wishlist dekhne ke liye
              login karein.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Home
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-black">
            Your Wishlist ❤️
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Products you saved for later.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">

            <div className="text-6xl">
              ❤️
            </div>

            <h2 className="mt-4 text-xl font-black">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Like a product and it will
              appear here.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Start Shopping
            </Link>

          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {products.map((product) => {
              const price =
                Number(
                  product.price || 0
                );

              const mrp =
                Number(
                  product.mrp || 0
                );

              const discount =
                mrp > price &&
                mrp > 0
                  ? Math.round(
                      ((mrp - price) /
                        mrp) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={product.productId}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
                >

                  <Link
                    href={`/product/${product.productId}`}
                  >
                    <div className="relative flex h-40 items-center justify-center bg-zinc-100 dark:bg-zinc-800">

                      {discount > 0 && (
                        <span className="absolute left-2 top-2 z-10 rounded-md bg-green-600 px-2 py-1 text-[10px] font-black text-white">
                          {discount}% OFF
                        </span>
                      )}

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={
                            product.productName
                          }
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-4xl">
                          📦
                        </span>
                      )}

                    </div>
                  </Link>

                  <div className="p-3">

                    <Link
                      href={`/product/${product.productId}`}
                    >
                      <p className="line-clamp-2 text-sm font-black">
                        {
                          product.productName
                        }
                      </p>
                    </Link>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="font-black">
                        ₹{price}
                      </span>

                      {mrp > price &&
                        mrp > 0 && (
                          <span className="text-xs text-zinc-400 line-through">
                            ₹{mrp}
                          </span>
                        )}

                    </div>

                    <button
                      type="button"
                      disabled={
                        removingId ===
                        product.productId
                      }
                      onClick={() =>
                        remove(
                          product.productId
                        )
                      }
                      className="mt-3 w-full rounded-lg bg-red-50 py-2 text-xs font-black text-red-600 disabled:opacity-50 dark:bg-red-950 dark:text-red-400"
                    >
                      {removingId ===
                      product.productId
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>
    </main>
  );
}