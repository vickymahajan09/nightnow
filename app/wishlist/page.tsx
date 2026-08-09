"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { checkUser } from "../services/authService";
import {
  getWishlist,
  deleteWishlist,
} from "../services/wishlistService";

import { useCart } from "../context/CartContext";

export default function WishlistPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return checkUser(async (currentUser: any) => {
      setUser(currentUser);

      if (currentUser?.email) {
        const data = await getWishlist(currentUser.email);
        setWishlist(data);
      }

      setLoading(false);
    });
  }, []);

  const removeItem = async (id: string) => {
    await deleteWishlist(id);

    const data = await getWishlist(user.email);

    setWishlist(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">

      <h1 className="mb-8 text-4xl font-bold text-yellow-400">
        ❤️ My Wishlist
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        {wishlist.map((item: any) => (

          <div
            key={item.id}
            className="overflow-hidden rounded-xl bg-white shadow-lg"
          >

            <img
              src={item.image}
              className="h-52 w-full object-cover"
            />

            <div className="p-4">

              <h2 className="font-bold text-black">
                {item.name}
              </h2>

              <p className="mt-2 text-xl font-bold text-green-600">
                ₹ {item.price}
              </p>

              <button
                onClick={() => addToCart(item)}
                className="mt-4 w-full rounded-lg bg-yellow-400 py-2 font-bold text-black"
              >
                Add To Cart
              </button>

              <button
                onClick={() => removeItem(item.id)}
                className="mt-3 w-full rounded-lg bg-red-600 py-2 font-bold"
              >
                Remove
              </button>

            </div>

          </div>

        ))}

      </div>

      {wishlist.length === 0 && (
        <div className="mt-16 text-center text-xl text-zinc-400">
          Wishlist Empty
        </div>
      )}

    </main>
  );
}