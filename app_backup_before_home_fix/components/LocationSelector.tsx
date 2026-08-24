"use client";

import { useEffect, useRef, useState } from "react";

export interface SavedLocation {
  name: string;
  address: string;
  lat?: number;
  lon?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  location: SavedLocation | null;
  onSelect: (location: SavedLocation) => void;
}

function normalizeResult(item: any): SavedLocation {
  const address = item?.address || {};

  const name =
    address.road ||
    address.suburb ||
    address.neighbourhood ||
    address.residential ||
    address.village ||
    address.town ||
    address.city_district ||
    address.city ||
    address.state_district ||
    item?.display_name?.split(",")[0] ||
    "Selected Location";

  return {
    name: String(name),
    address: String(item?.display_name || name),
    lat: Number.isFinite(Number(item?.lat)) ? Number(item.lat) : undefined,
    lon: Number.isFinite(Number(item?.lon)) ? Number(item.lon) : undefined,
  };
}

export default function LocationSelector({
  open,
  onClose,
  location,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setResults([]);
    setError("");
    setLoadingSearch(false);
    setLoadingCurrent(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const searchAddress = (value: string) => {
    setQuery(value);
    setError("");

    if (searchTimer.current) clearTimeout(searchTimer.current);

    const cleanValue = value.trim();

    if (cleanValue.length < 3) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    const id = ++requestId.current;
    setLoadingSearch(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/location/search?q=${encodeURIComponent(cleanValue)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = await response.json().catch(() => ({ results: [] }));

        if (id !== requestId.current) return;

        if (!response.ok) {
          throw new Error(payload?.error || "Search failed");
        }

        setResults(Array.isArray(payload?.results) ? payload.results : []);
      } catch (searchError) {
        console.error("Location search error:", searchError);

        if (id === requestId.current) {
          setResults([]);
          setError("Location search nahi ho payi. Dobara try karein.");
        }
      } finally {
        if (id === requestId.current) setLoadingSearch(false);
      }
    }, 450);
  };

  const selectLocation = (item: any) => {
    const place = normalizeResult(item);
    onSelect(place);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Aapke browser me location support nahi hai.");
      return;
    }

    setLoadingCurrent(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch(
            `/api/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) throw new Error("Reverse geocode failed");

          onSelect({
            ...normalizeResult(data),
            lat,
            lon,
          });
        } catch (reverseError) {
          console.error("Current location reverse lookup error:", reverseError);

          onSelect({
            name: "Current Location",
            address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            lat,
            lon,
          });
        } finally {
          setLoadingCurrent(false);
        }
      },
      (geoError) => {
        setLoadingCurrent(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission allow karein, phir dobara try karein.");
        } else if (geoError.code === geoError.TIMEOUT) {
          setError("Location detect hone me time lag raha hai. Dobara try karein.");
        } else {
          setError("Current location detect nahi ho payi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 px-3 pt-16 backdrop-blur-sm">
      <div className="mx-auto max-h-[88vh] max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-black">Select Location</h2>
            <p className="text-xs text-zinc-500">
              Delivery address select karein
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-zinc-100 text-xl font-black"
            aria-label="Close location selector"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-4">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loadingCurrent}
            className="flex w-full items-center gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-left disabled:opacity-60"
          >
            <span className="text-2xl">📍</span>

            <span className="flex-1">
              <span className="block font-black">
                {loadingCurrent
                  ? "Getting location..."
                  : "Use Current Location"}
              </span>

              <span className="block text-xs text-zinc-500">
                GPS se current delivery address detect karein
              </span>
            </span>

            <span className="font-black">→</span>
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-bold text-zinc-400">OR SEARCH</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 focus-within:border-yellow-400 focus-within:bg-white">
            <input
              autoFocus
              value={query}
              onChange={(event) => searchAddress(event.target.value)}
              placeholder="Enter area, society, road, city..."
              className="h-12 w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>

          <p className="mt-2 px-1 text-[10px] text-zinc-400">
            Example: Dindoli, Kharwasa, Ring Road, society name...
          </p>

          {loadingSearch && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-xs font-semibold text-zinc-500">
              <span className="animate-pulse">📍</span>
              Address search ho raha hai...
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loadingSearch && query.trim().length >= 3 && results.length === 0 && !error && (
            <div className="py-8 text-center">
              <div className="text-3xl">📍</div>
              <p className="mt-2 text-sm font-bold text-zinc-500">
                Location nahi mili. Thoda different address try karein.
              </p>
            </div>
          )}

          <div className="mt-3 space-y-2">
            {results.map((item) => {
              const place = normalizeResult(item);

              return (
                <button
                  key={`${item.place_id}-${item.lat}-${item.lon}`}
                  type="button"
                  onClick={() => selectLocation(item)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-left transition hover:border-yellow-300 hover:bg-yellow-50"
                >
                  <span className="mt-0.5 text-lg">📍</span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-zinc-900">
                      {place.name}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-zinc-500">
                      {place.address}
                    </span>
                  </span>

                  <span className="pt-1 text-sm font-black text-zinc-400">›</span>
                </button>
              );
            })}
          </div>

          {location?.address && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                Selected delivery location
              </p>
              <p className="mt-1 text-sm font-black text-emerald-950">
                {location.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                {location.address}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}