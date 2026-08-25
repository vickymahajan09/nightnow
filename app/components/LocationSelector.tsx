"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  onSelect: (
    location: SavedLocation
  ) => void;
}

function normalizeResult(
  item: any
): SavedLocation {
  const address =
    item?.address || {};

  const name =
    item?.namedetails?.name ||
    address?.building ||
    address?.amenity ||
    address?.shop ||
    address?.road ||
    address?.suburb ||
    address?.neighbourhood ||
    address?.city ||
    "Selected Location";

  return {
    name: String(name),
    address: String(
      item?.display_name ||
        name
    ),
    lat: Number.isFinite(
      Number(item?.lat)
    )
      ? Number(item.lat)
      : undefined,
    lon: Number.isFinite(
      Number(item?.lon)
    )
      ? Number(item.lon)
      : undefined,
  };
}

export default function LocationSelector({
  open,
  onClose,
  location,
  onSelect,
}: Props) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const controllerRef =
    useRef<AbortController | null>(
      null
    );

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setResults([]);
    setLoading(false);
    setError("");

    controllerRef.current?.abort();
    controllerRef.current = null;
  }, [open]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const clean =
      query.trim();

    if (clean.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      controllerRef.current?.abort();
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          controllerRef.current?.abort();

          const controller =
            new AbortController();

          controllerRef.current =
            controller;

          const requestId =
            ++requestIdRef.current;

          setLoading(true);
          setError("");

          try {
            const response =
              await fetch(
                `/api/location/search?q=${encodeURIComponent(
                  clean
                )}`,
                {
                  method: "GET",
                  cache: "no-store",
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => ({
                    results: [],
                  })
                );

            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            if (!response.ok) {
              throw new Error(
                data?.error ||
                  "Location search failed"
              );
            }

            const nextResults =
              Array.isArray(
                data?.results
              )
                ? data.results
                : [];

            setResults(
              nextResults
            );

            if (
              nextResults.length ===
              0
            ) {
              setError(
                "Exact location nahi mili. Building/society + area/city ke saath try karein."
              );
            }
          } catch (err: any) {
            if (
              err?.name ===
              "AbortError"
            ) {
              return;
            }

            console.error(
              "Location search error:",
              err
            );

            setResults([]);
            setError(
              "Location search nahi ho payi. Dobara try karein."
            );
          } finally {
            if (
              requestId ===
              requestIdRef.current
            ) {
              setLoading(false);
            }
          }
        },
        500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [query]);

  const selectLocation =
    (item: any) => {
      const selected =
        normalizeResult(item);

      onSelect(selected);
      onClose();
    };

  const useCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setError(
          "Aapke browser me location support nahi hai."
        );
        return;
      }

      setLoading(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat =
            position.coords.latitude;

          const lon =
            position.coords.longitude;

          try {
            const response =
              await fetch(
                `/api/location/reverse?lat=${encodeURIComponent(
                  lat
                )}&lon=${encodeURIComponent(
                  lon
                )}`,
                {
                  cache:
                    "no-store",
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (!response.ok) {
              throw new Error(
                "Reverse lookup failed"
              );
            }

            const selected =
              normalizeResult(
                data
              );

            onSelect({
              ...selected,
              lat,
              lon,
            });

            onClose();
          } catch (error) {
            console.error(
              "Current location reverse lookup error:",
              error
            );

            onSelect({
              name:
                "Current Location",
              address:
                `${lat.toFixed(
                  6
                )}, ${lon.toFixed(
                  6
                )}`,
              lat,
              lon,
            });

            onClose();
          } finally {
            setLoading(false);
          }
        },
        (geoError) => {
          setLoading(false);

          if (
            geoError.code ===
            geoError.PERMISSION_DENIED
          ) {
            setError(
              "Location permission allow karein, phir dobara try karein."
            );
          } else if (
            geoError.code ===
            geoError.TIMEOUT
          ) {
            setError(
              "Location detect hone me time lag raha hai. Dobara try karein."
            );
          } else {
            setError(
              "Current location detect nahi ho payi."
            );
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
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <div>
            <h2 className="text-lg font-black text-zinc-900">
              Select Location
            </h2>

            <p className="text-xs text-zinc-500">
              Delivery address select karein
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-zinc-100 text-xl font-black text-zinc-900"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(88vh-74px)] overflow-y-auto p-4">
          <button
            type="button"
            onClick={
              useCurrentLocation
            }
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-left disabled:opacity-60"
          >
            <span className="text-2xl">
              📍
            </span>

            <span className="flex-1">
              <span className="block font-black text-zinc-900">
                {loading
                  ? "Getting location..."
                  : "Use Current Location"}
              </span>

              <span className="mt-1 block text-xs text-zinc-500">
                GPS se current delivery address detect karein
              </span>
            </span>

            <span className="font-black text-zinc-700">
              →
            </span>
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs font-bold text-zinc-400">
              OR SEARCH
            </span>

            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search building, society, area, road, city..."
              className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-yellow-400"
            />

            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                ⏳
              </span>
            )}

            {query.trim().length >=
              2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[55vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl">
                {results.length >
                0 ? (
                  <div className="space-y-1">
                    {results.map(
                      (item) => {
                        const place =
                          normalizeResult(
                            item
                          );

                        return (
                          <button
                            key={`${item?.place_id || "place"}-${item?.lat || ""}-${item?.lon || ""}`}
                            type="button"
                            onClick={() =>
                              selectLocation(
                                item
                              )
                            }
                            className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-yellow-50 active:bg-yellow-100"
                          >
                            <span className="mt-0.5 shrink-0 text-lg">
                              📍
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-black text-zinc-900">
                                {
                                  place.name
                                }
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                                {
                                  place.address
                                }
                              </span>
                            </span>

                            <span className="pt-1 text-base font-black text-zinc-400">
                              ›
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                ) : loading ? (
                  <div className="p-4 text-center text-xs font-semibold text-zinc-500">
                    Location search ho rahi hai...
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs font-semibold text-zinc-600">
                      {error ||
                        "Building ya society ka naam type karein."}
                    </p>

                    <p className="mt-2 text-[10px] leading-4 text-zinc-400">
                      Example: Abhinav Heights Dindoli Surat
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-2 px-1 text-[10px] leading-4 text-zinc-400">
            India ke kisi bhi building, society,
            apartment, area, road ya city ka naam
            type karein.
          </p>

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