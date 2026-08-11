"use client";

import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SearchBar from "./components/SearchBar";
import OfferBanner from "./components/OfferBanner";
import Categories from "./components/Categories";
import CartPopup from "./components/CartPopup";
import ProductCard from "./components/ProductCard";
import Footer from "./components/Footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showPopup, setShowPopup] =
    useState(false);

  // ==============================
  // FIRST ORDER POPUP
  // ==============================

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error(
        "Popup storage error:",
        error
      );
    }
  }, []);

  const isSearching =
    search.trim().length > 0;

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ============================== */}
      {/* NAVBAR */}
      {/* ============================== */}

      <Navbar />

      {/* ============================== */}
      {/* SEARCH BAR — ALWAYS TOP */}
      {/* ============================== */}

      <div className="relative z-40 bg-white">
        <SearchBar
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* ============================== */}
      {/* SEARCH RESULTS */}
      {/* ============================== */}

      {isSearching ? (

        <div className="min-h-[60vh] bg-black">

          <ProductCard
            selectedCategory=""
            search={search}
          />

        </div>

      ) : (

        <>
          {/* ============================== */}
          {/* FIRST ORDER POPUP */}
          {/* ============================== */}

          {showPopup && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

              <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-yellow-400/30 bg-zinc-900 p-7 text-center shadow-2xl">

                <button
                  type="button"
                  onClick={() =>
                    setShowPopup(false)
                  }
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xl text-zinc-300 hover:bg-zinc-700"
                >
                  ×
                </button>

                <div className="text-6xl">
                  🎁
                </div>

                <h2 className="mt-5 text-3xl font-black text-yellow-400">
                  Welcome to Night Now!
                </h2>

                <p className="mt-3 text-xl font-bold text-white">
                  First Order Delivery FREE 🚀
                </p>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  आपका पहला ऑर्डर Night Now पर
                  <span className="font-bold text-green-400">
                    {" "}FREE DELIVERY
                  </span>{" "}
                  के साथ।
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowPopup(false)
                  }
                  className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black text-black transition hover:bg-yellow-300"
                >
                  Start Shopping 🛒
                </button>

                <p className="mt-4 text-xs text-zinc-500">
                  आपकी जरूरत, हमारी जिम्मेदारी।
                </p>

              </div>

            </div>
          )}

          {/* ============================== */}
          {/* HERO */}
          {/* ============================== */}

          <Hero />

          {/* ============================== */}
          {/* OFFERS */}
          {/* ============================== */}

          <OfferBanner />

          {/* ============================== */}
          {/* CATEGORIES */}
          {/* ============================== */}

          <Categories
            selectedCategory={
              selectedCategory
            }
            onSelectCategory={
              setSelectedCategory
            }
          />

          {/* ============================== */}
          {/* PRODUCTS */}
          {/* ============================== */}

          <ProductCard
            selectedCategory={
              selectedCategory
            }
            search=""
          />
        </>
      )}

      {/* ============================== */}
      {/* CART POPUP */}
      {/* ============================== */}

      <CartPopup />

      {/* ============================== */}
      {/* FOOTER */}
      {/* ============================== */}

      <Footer />

    </main>
  );
}