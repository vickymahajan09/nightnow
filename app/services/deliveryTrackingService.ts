"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  signInAnonymously,
} from "firebase/auth";

import { db, auth } from "../lib/firebase";

export type PartnerLocation = {
  lat: number;
  lng: number;
  updatedAt?: any;
  accuracy?: number;
};

export type TrackingDoc = {
  orderId: string;
  partnerName?: string;
  partnerPhone?: string;
  dropAddress?: string;
  active?: boolean;
  location?: PartnerLocation;
  createdAt?: any;
};

// Generates a random, hard-to-guess token used as the tracking
// document id. Knowing this token is what authorizes access —
// there is no separate login for delivery partners.
function generateToken(length = 28) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let out = "";

  const cryptoObj =
    typeof window !== "undefined" ? window.crypto : undefined;

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint32Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      out += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return out;
}

// ADMIN ONLY — creates a deliveryTracking/{token} doc and links it
// back onto the order. Returns the token and a ready-to-share URL.
export const createTrackingLink = async (
  orderId: string,
  opts: {
    partnerName?: string;
    partnerPhone?: string;
    dropAddress?: string;
  } = {}
) => {
  if (!orderId?.trim()) {
    throw new Error("Order ID is required.");
  }

  const token = generateToken();

  await setDoc(doc(db, "deliveryTracking", token), {
    orderId,
    partnerName: opts.partnerName?.trim() || "",
    partnerPhone: opts.partnerPhone?.trim() || "",
    dropAddress: opts.dropAddress?.trim() || "",
    active: true,
    location: null,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "orders", orderId), {
    trackingToken: token,
    partnerName: opts.partnerName?.trim() || "",
    partnerPhone: opts.partnerPhone?.trim() || "",
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return {
    token,
    url: `${origin}/deliver/${token}`,
  };
};

// PARTNER SIDE — fetch once to validate the link and show order info.
export const getTrackingDoc = async (
  token: string
): Promise<TrackingDoc | null> => {
  if (!token?.trim()) return null;

  const snap = await getDoc(doc(db, "deliveryTracking", token));

  if (!snap.exists()) return null;

  return snap.data() as TrackingDoc;
};

// PARTNER SIDE — signs the partner in anonymously (Firestore rules
// require an authenticated request) and starts watching their
// position, pushing throttled updates to the tracking doc.
export const startSharingLocation = (
  token: string,
  onUpdate: (loc: PartnerLocation) => void,
  onError: (message: string) => void
): (() => void) => {
  let watchId: number | null = null;
  let lastSentAt = 0;
  const MIN_INTERVAL_MS = 6000;
  let cancelled = false;

  (async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      if (cancelled) return;

      if (!navigator.geolocation) {
        onError("Is device par location supported nahi hai.");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const loc: PartnerLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          onUpdate(loc);

          const now = Date.now();
          if (now - lastSentAt < MIN_INTERVAL_MS) return;
          lastSentAt = now;

          try {
            await updateDoc(doc(db, "deliveryTracking", token), {
              location: {
                lat: loc.lat,
                lng: loc.lng,
                accuracy: loc.accuracy || null,
                updatedAt: serverTimestamp(),
              },
              active: true,
            });
          } catch {
            // Network hiccup — next watchPosition tick will retry.
          }
        },
        (err) => {
          onError(
            err.message ||
              "Location fetch nahi ho payi. Please permission allow karo."
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 20000,
        }
      );
    } catch (err: any) {
      onError(err?.message || "Location sharing start nahi ho payi.");
    }
  })();

  return () => {
    cancelled = true;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
};

// PARTNER SIDE — call when the drop is done / partner stops sharing.
export const stopSharingLocation = async (token: string) => {
  if (!token?.trim()) return;

  try {
    await updateDoc(doc(db, "deliveryTracking", token), {
      active: false,
    });
  } catch {
    // Best-effort only.
  }
};

// CUSTOMER SIDE — live map subscription by token.
export const subscribeToPartnerLocation = (
  token: string,
  callback: (data: TrackingDoc | null) => void
) => {
  if (!token?.trim()) {
    callback(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, "deliveryTracking", token),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as TrackingDoc);
    },
    () => callback(null)
  );
};
