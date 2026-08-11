"use client";

import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SearchBar from "./components/SearchBar";
import OfferBanner from "./components/OfferBanner";
import Categories from "./components/Categories";
import ProductCard from "./components/ProductCard";
import CartPopup from "./components/CartPopup";
import QuickActions from "./components/QuickActions";
import DeliveryStrip from "./components/DeliveryStrip";
import TrustBar from "./components/TrustBar";
import Footer from "./components/Footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [search, setSearch] = useState("");

  const [showPopup, setShowPopup] =
    useState(false);

  useEffect(() => {
    const alreadyShown =
      sessionStorage.getItem(
        "nightnow_first_order_popup"
      );

    if (!alreadyShown) {
      setShowPopup(true);

      sessionStorage.setItem(
        "nightnow_first_order_popup",
        "true"
      );
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* FIRST ORDER POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-400/30 bg-zinc-900 p-7 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xl"
            >
              ×
            </button>

            <div className="text-6xl">
              🎁
            </div>

            <h2 className="mt-5 text-3xl font-black text-yellow-400">
              Welcome to Night Now!
            </h2>

            <p className="mt-3 text-xl font-bold">
              First Order Delivery FREE 🚀
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              आपका पहला ऑर्डर Night Now पर{" "}
              <span className="font-bold text-green-400">
                FREE DELIVERY
              </span>{" "}
              के साथ।
            </p>

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black text-black"
            >
              Start Shopping 🛒
            </button>
          </div>
        </div>
      )}

      <Hero />

      <DeliveryStrip />

      <QuickActions />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <OfferBanner />

      <Categories
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ProductCard
        selectedCategory={selectedCategory}
        search={search}
      />

      <TrustBar />

      <CartPopup />

      <Footer />
    </main>
  );
}