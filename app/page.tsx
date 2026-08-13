"use client";

import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import OfferBanner from "./components/OfferBanner";
import Categories from "./components/Categories";
import ProductCard from "./components/ProductCard";
import SmartNeeds from "./components/SmartNeeds";
import Footer from "./components/Footer";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem(
        "nightnow_first_order_popup"
      );

      if (!shown) {
        setShowPopup(true);
        sessionStorage.setItem(
          "nightnow_first_order_popup",
          "true"
        );
      }
    } catch {}
  }, []);

  const isSearching =
    search.trim().length > 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-zinc-900">

      {/* NAVBAR */}
      <Navbar />

      {/* SEARCH */}
      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {isSearching ? (
        <section className="min-h-[70vh] bg-[#f7f8fa] py-5">
          <ProductCard
            selectedCategory=""
            search={search}
          />
        </section>
      ) : (
        <>
          {/* HERO - simple built-in version */}
          <section className="bg-gradient-to-br from-yellow-50 via-white to-blue-50 px-4 py-8">
            <div className="mx-auto max-w-7xl">

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 md:p-10">

                <p className="text-sm font-black uppercase tracking-widest text-yellow-600">
                  Night Now
                </p>

                <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-zinc-900 md:text-5xl">
                  आपकी जरूरत,
                  <br />
                  हमारी जिम्मेदारी.
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500 md:text-base">
                  Groceries, snacks, beverages,
                  personal care और daily essentials
                  एक ही जगह।
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <a
                    href="#products"
                    className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black shadow-sm hover:bg-yellow-300"
                  >
                    Shop Now →
                  </a>

                  <a
                    href="#needs"
                    className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-700"
                  >
                    आपकी जरूरत 🧠
                  </a>

                </div>

              </div>

            </div>
          </section>

          {/* OFFERS */}
         
          {/* SMART NEEDS */}
          <section id="needs">
            <SmartNeeds />
          </section>

          {/* CATEGORIES */}
          <Categories
            selectedCategory={selectedCategory}
            onSelectCategory={
              setSelectedCategory
            }
          />

          {/* PRODUCTS */}
          <section id="products">
            <ProductCard
              selectedCategory={
                selectedCategory
              }
              search=""
            />
          </section>
        </>
      )}

      {/* FOOTER */}
      <Footer />

      {/* FIRST ORDER POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">

          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">

            <button
              type="button"
              onClick={() =>
                setShowPopup(false)
              }
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl text-zinc-600"
            >
              ×
            </button>

            <div className="text-6xl">
              🎁
            </div>

            <h2 className="mt-5 text-2xl font-black">
              Welcome to Night Now!
            </h2>

            <p className="mt-3 text-lg font-black text-green-600">
              First Order Delivery FREE 🚀
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              आपका पहला ऑर्डर FREE DELIVERY
              के साथ।
            </p>

            <button
              type="button"
              onClick={() =>
                setShowPopup(false)
              }
              className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-black text-black"
            >
              Start Shopping 🛒
            </button>

          </div>

        </div>
      )}

    </main>
  );
}