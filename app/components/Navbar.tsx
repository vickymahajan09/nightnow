"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { useCart } from "../context/CartContext";

interface LocationData {
  name: string;
  address: string;
  lat?: number;
  lon?: number;
}

export default function Navbar() {
  const { cart } = useCart();

  const [user, setUser] = useState<any>(null);

  const [showLocation, setShowLocation] =
    useState(false);

  const [location, setLocation] =
    useState<LocationData | null>(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] =
    useState<any[]>([]);

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );
  }, []);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "nightnow-location"
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed?.address) {
          setLocation(parsed);
        }
      }
    } catch {}
  }, []);

  const cartCount = cart.reduce(
    (total: number, item: any) =>
      total + Number(item.quantity || 1),
    0
  );

  const saveLocation = (
    data: LocationData
  ) => {
    setLocation(data);

    localStorage.setItem(
      "nightnow-location",
      JSON.stringify(data)
    );

    setSearch("");
    setSuggestions([]);
    setLocationError("");
    setShowLocation(false);

    window.dispatchEvent(
      new Event("nightnow-location-change")
    );
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported."
      );
      return;
    }

    setLoadingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        try {
          const response =
            await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`,
              {
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          const address =
            data?.address || {};

          const area =
            address.suburb ||
            address.neighbourhood ||
            address.village ||
            address.town ||
            address.city ||
            "Current Location";

          saveLocation({
            name: area,
            address:
              data?.display_name ||
              area,
            lat,
            lon,
          });
        } catch {
          saveLocation({
            name: "Current Location",
            address: `${lat}, ${lon}`,
            lat,
            lon,
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setLocationError(
            "Please allow location permission."
          );
        } else {
          setLocationError(
            "Unable to get your location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const searchLocation = async (
    value: string
  ) => {
    setSearch(value);
    setLocationError("");

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);

    try {
      const query =
        `${value.trim()}, India`;

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const data =
        await response.json();

      setSuggestions(
        Array.isArray(data)
          ? data
          : []
      );
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (
    item: any
  ) => {
    const address =
      item.address || {};

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
      address:
        item.display_name || name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    });
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0"
          >
            <h1 className="text-xl font-black text-black sm:text-2xl">
              Night
              <span className="text-yellow-400">
                Now
              </span>
            </h1>

            <p className="text-[8px] font-bold text-zinc-500">
              FAST DELIVERY
            </p>
          </Link>

          {/* LOCATION */}
          <button
            type="button"
            onClick={() =>
              setShowLocation(true)
            }
            className="min-w-0 flex-1 px-2 text-left"
          >
            <p className="text-[8px] font-semibold text-zinc-500">
              DELIVER TO
            </p>

            <p className="truncate text-[11px] font-black text-black sm:text-xs">
              📍{" "}
              {location?.address ||
                location?.name ||
                "Select Location"}
            </p>
          </button>

          {/* CART */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-white"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-black text-black">
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>

          {/* PROFILE */}
          <Link
            href={
              user
                ? "/profile"
                : "/login"
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-lg"
          >
            👤
          </Link>
        </div>
      </nav>

      {/* LOCATION MODAL */}
      {showLocation && (
        <div className="fixed inset-0 z-[9999] bg-black/60 px-3 pt-16 backdrop-blur-sm">
          <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-black">
                  Select Location
                </h2>

                <p className="text-xs text-zinc-500">
                  Choose where we should deliver
                </p>
              </div>

              <button
                onClick={() =>
                  setShowLocation(false)
                }
                className="h-9 w-9 rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="p-4">

              <button
                type="button"
                onClick={
                  useCurrentLocation
                }
                disabled={loadingLocation}
                className="flex w-full items-center gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-left"
              >
                <span className="text-2xl">
                  📍
                </span>

                <span className="flex-1">
                  <span className="block font-black">
                    {loadingLocation
                      ? "Getting location..."
                      : "Use Current Location"}
                  </span>

                  <span className="block text-xs text-zinc-500">
                    Automatically detect your current address
                  </span>
                </span>

                <span>→</span>
              </button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs text-zinc-400">
                  OR SEARCH
                </span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3">
                <input
                  value={search}
                  onChange={(e) =>
                    searchLocation(
                      e.target.value
                    )
                  }
                  placeholder="B-601 Abhinav Heights, Dindoli..."
                  className="h-12 w-full bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              {searching && (
                <p className="mt-3 text-center text-xs text-zinc-500">
                  Searching address...
                </p>
              )}

              {locationError && (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {locationError}
                </p>
              )}

              <div className="mt-3 max-h-72 overflow-y-auto">
                {suggestions.map(
                  (item: any, index) => (
                    <button
                      key={`${item.place_id}-${index}`}
                      type="button"
                      onClick={() =>
                        selectLocation(item)
                      }
                      className="mb-2 w-full rounded-xl border border-zinc-100 bg-white p-3 text-left hover:bg-yellow-50"
                    >
                      <p className="text-sm font-black text-black">
                        📍{" "}
                        {item.address?.suburb ||
                          item.address?.neighbourhood ||
                          item.address?.city ||
                          item.display_name?.split(
                            ","
                          )[0]}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.display_name}
                      </p>
                    </button>
                  )
                )}
              </div>

              {location && (
                <div className="mt-4 rounded-xl bg-zinc-100 p-3">
                  <p className="text-xs font-bold text-zinc-500">
                    SAVED LOCATION
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {location.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}