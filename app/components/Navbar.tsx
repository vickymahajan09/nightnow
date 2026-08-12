"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

interface LocationData {
  name: string;
  address: string;
  lat?: number;
  lon?: number;
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nightnow-location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) setLocation(parsed);
      }
    } catch (error) {
      console.error("Location loading failed:", error);
    }
  }, []);

  const saveLocation = (data: LocationData) => {
    setLocation(data);
    try {
      localStorage.setItem("nightnow-location", JSON.stringify(data));
    } catch (error) {
      console.error("Location saving failed:", error);
    }
    setShowLocation(false);
    setSearch("");
    setSuggestions([]);
    setLocationError("");
  };

  const useCurrentLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`,
            { headers: { Accept: "application/json" } }
          );
          if (!response.ok) throw new Error("Reverse location failed");
          const data = await response.json();
          const address = data?.address || {};
          const area =
            address.suburb ||
            address.neighbourhood ||
            address.village ||
            address.town ||
            address.city ||
            "Current Location";
          saveLocation({
            name: area,
            address: data?.display_name || `${lat}, ${lon}`,
            lat,
            lon,
          });
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          saveLocation({
            name: "Current Location",
            address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            lat,
            lon,
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow location access.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Your location could not be found.");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("Location request timed out. Please try again.");
        } else {
          setLocationError("Unable to get your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const searchLocation = (value: string) => {
    setSearch(value);
    setLocationError("");
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(value.trim())}`;
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Location search failed");
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Location search failed:", error);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const selectLocation = (item: any) => {
    const address = item.address || {};
    const name =
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.town ||
      address.city ||
      item.display_name?.split(",")[0] ||
      "Selected Location";
    saveLocation({
      name,
      address: item.display_name || name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    });
  };

  const clearLocation = () => {
    setLocation(null);
    try { localStorage.removeItem("nightnow-location"); } catch {}
    setShowLocation(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="shrink-0">
            <div>
              <h1 className="text-2xl font-black text-black">
                Night<span className="text-yellow-400">Now</span>
              </h1>
              <p className="text-[10px] font-semibold text-zinc-500">15 MIN DELIVERY</p>
            </div>
          </Link>

          <button type="button" onClick={() => setShowLocation(true)} className="hidden max-w-[260px] items-center px-4 text-left md:flex">
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-zinc-500">DELIVER TO</p>
              <p className="truncate text-xs font-bold text-black">📍 {location?.name || "Your Location"} ▼</p>
            </div>
          </button>

          <button type="button" onClick={() => setShowLocation(true)} className="ml-2 flex max-w-[130px] items-center md:hidden">
            <span className="truncate text-xs font-bold text-black">📍 {location?.name || "Location"}</span>
          </button>

          <div className="flex items-center gap-2">
            <Link href="/orders" className="hidden rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold text-black sm:block">📦 Orders</Link>
            <Link href="/cart" className="rounded-lg bg-black px-3 py-2 text-sm font-bold text-white">🛒 Cart</Link>
            {user ? (
              <Link href="/profile" className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black">👤 Profile</Link>
            ) : (
              <Link href="/login" className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black">Login</Link>
            )}
          </div>
        </div>
      </nav>

      {showLocation && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-visible rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <div>
                <h2 className="text-xl font-black text-black">Select Location</h2>
                <p className="mt-1 text-xs text-zinc-500">Where should we deliver?</p>
              </div>
              <button type="button" onClick={() => setShowLocation(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-black">×</button>
            </div>

            <div className="p-4">
              <button type="button" onClick={useCurrentLocation} disabled={loadingLocation} className="flex w-full items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-left disabled:opacity-60">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl">📍</div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-black">{loadingLocation ? "Getting your location..." : "Use Current Location"}</p>
                  <p className="mt-1 text-xs text-zinc-500">Use your phone/browser GPS</p>
                </div>
                {!loadingLocation && <span className="text-xl">→</span>}
              </button>

              {locationError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{locationError}</div>}

              <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-zinc-200" /><span className="text-xs text-zinc-400">OR</span><div className="h-px flex-1 bg-zinc-200" /></div>

              <div className="relative">
                <div className="flex items-center rounded-xl border border-zinc-300 bg-zinc-50 px-3">
                  <span className="text-lg">🔎</span>
                  <input value={search} onChange={(e) => searchLocation(e.target.value)} placeholder="Search area, city, pincode..." className="w-full bg-transparent p-3 text-sm text-black outline-none" autoComplete="off" />
                  {searching && <span className="text-xs text-zinc-400">Searching...</span>}
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl">
                    {suggestions.map((item: any, index: number) => (
                      <button type="button" key={`${item.place_id || "place"}-${index}`} onClick={() => selectLocation(item)} className="flex w-full items-start gap-3 border-b border-zinc-100 p-3 text-left last:border-0 hover:bg-zinc-50">
                        <span className="mt-1">📍</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-black">{item.display_name?.split(",").slice(0, 2).join(",")}</span>
                          <span className="mt-1 block text-xs text-zinc-500">{item.display_name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {location && (
                <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-400">Selected Location</p>
                  <p className="mt-2 font-black text-black">📍 {location.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{location.address}</p>
                  <button type="button" onClick={clearLocation} className="mt-3 text-xs font-bold text-red-500">Remove Location</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
