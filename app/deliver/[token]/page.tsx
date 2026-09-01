"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getTrackingDoc,
  startSharingLocation,
  stopSharingLocation,
  type PartnerLocation,
  type TrackingDoc,
} from "../../services/deliveryTrackingService";

export default function DeliverPartnerPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [trackingDoc, setTrackingDoc] =
    useState<TrackingDoc | null>(null);

  const [sharing, setSharing] = useState(false);
  const [lastLocation, setLastLocation] =
    useState<PartnerLocation | null>(null);
  const [error, setError] = useState("");
  const [stopFn, setStopFn] =
    useState<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const data = await getTrackingDoc(token);

      if (!mounted) return;

      if (!data) {
        setNotFound(true);
      } else {
        setTrackingDoc(data);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleStart = () => {
    setError("");

    const stop = startSharingLocation(
      token,
      (loc) => {
        setLastLocation(loc);
        setSharing(true);
      },
      (message) => {
        setError(message);
        setSharing(false);
      }
    );

    setStopFn(() => stop);
  };

  const handleStop = async () => {
    stopFn?.();
    setStopFn(null);
    setSharing(false);
    await stopSharingLocation(token);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-sm font-semibold text-zinc-400">
          Loading...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center text-white">
        <p className="text-3xl">🚫</p>
        <p className="text-lg font-black">
          Link invalid ya expired hai
        </p>
        <p className="text-sm text-zinc-400">
          Please dobara link admin se maango.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-2xl">🌙</p>

        <h1 className="mt-2 text-xl font-black">
          NightNow Delivery Partner
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          Order #{trackingDoc?.orderId?.slice(0, 8)}
        </p>

        {trackingDoc?.partnerName && (
          <p className="mt-1 text-xs text-zinc-500">
            {trackingDoc.partnerName}
          </p>
        )}

        {trackingDoc?.dropAddress && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs font-bold text-zinc-400">
              📍 Drop Location
            </p>
            <p className="mt-1 text-sm font-semibold">
              {trackingDoc.dropAddress}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          {!sharing ? (
            <>
              <p className="text-sm text-zinc-300">
                Jab aap delivery ke liye nikle, neeche button
                dabao — customer ko aapka live location dikhna
                shuru ho jayega.
              </p>

              <button
                onClick={handleStart}
                className="mt-4 w-full rounded-2xl bg-yellow-400 py-3 text-sm font-black text-black active:scale-[0.98]"
              >
                ▶️ Start Sharing Location
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                <p className="text-sm font-black text-green-400">
                  Location live share ho rahi hai
                </p>
              </div>

              {lastLocation && (
                <p className="mt-2 text-xs text-zinc-500">
                  Last update: {lastLocation.lat.toFixed(5)},{" "}
                  {lastLocation.lng.toFixed(5)}
                </p>
              )}

              <p className="mt-3 text-xs text-zinc-400">
                Delivery ho jaane ke baad "Stop" dabao. Order
                status admin panel se update hoga.
              </p>

              <button
                onClick={handleStop}
                className="mt-4 w-full rounded-2xl bg-red-500 py-3 text-sm font-black text-white active:scale-[0.98]"
              >
                ⏹ Stop Sharing
              </button>
            </>
          )}

          {error && (
            <p className="mt-3 rounded-xl bg-red-950 p-3 text-xs font-semibold text-red-300">
              ⚠️ {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-zinc-600">
          Yeh link sirf isi delivery ke liye kaam karta hai. Kisi
          aur ke saath share mat karo.
        </p>
      </div>
    </div>
  );
}
