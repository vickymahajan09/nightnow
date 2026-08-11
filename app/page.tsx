"use client";

import { useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SearchBar from "./components/SearchBar";
import OfferBanner from "./components/OfferBanner";
import Categories from "./components/Categories";
import ProductCard from "./components/ProductCard";
import CartPopup from "./components/CartPopup";
import Footer from "./components/Footer";

export default function Home() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  return (
    <main className="min-h-screen bg-white text-black">

      <Navbar />

      <Hero />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <OfferBanner />

      <Categories
        selectedCategory={
          selectedCategory
        }
        onSelectCategory={
          setSelectedCategory
        }
      />

      <ProductCard
        selectedCategory={
          selectedCategory
        }
        search={search}
      />

      <CartPopup />

      <Footer />

    </main>
  );
}