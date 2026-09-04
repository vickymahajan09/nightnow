"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
  collection,
  getDocs,
  query,
  where,
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

// ======================================================
// DELIVERY PARTNERS — saved once, reused forever.
//
// Instead of generating a brand-new link for every single order,
// admin adds each partner ONE TIME (name + phone). That partner gets
// a permanent link they bookmark. Assigning a new order to them is
// then just picking their name from a dropdown — no new link to
// generate, copy, or re-send via WhatsApp.
// ======================================================

export type DeliveryPartner = {
  id: string;
  name: string;
  phone: string;
  active?: boolean;
  currentOrderId?: string | null;
  currentOrderToken?: string | null;
};

const PARTNERS_COLLECTION = "deliveryPartners";

// ADMIN ONLY — one-time setup for a new delivery partner. Returns the
// permanent link to send them via WhatsApp (only once, ever).
export const addDeliveryPartner = async (
  name: string,
  phone: string
): Promise<{ partnerId: string; url: string }> => {
  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  if (!cleanName || !cleanPhone) {
    throw new Error("Partner name and phone are required.");
  }

  const docRef = await addDoc(collection(db, PARTNERS_COLLECTION), {
    name: cleanName,
    phone: cleanPhone,
    active: true,
    currentOrderId: null,
    currentOrderToken: null,
    createdAt: serverTimestamp(),
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return {
    partnerId: docRef.id,
    url: `${origin}/deliver/partner/${docRef.id}`,
  };
};

// ADMIN ONLY — list of saved partners, for the assignment dropdown.
export const getDeliveryPartners = async (): Promise<DeliveryPartner[]> => {
  const snap = await getDocs(
    query(collection(db, PARTNERS_COLLECTION), where("active", "==", true))
  );

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
};

// ADMIN ONLY — assigns an order to an already-saved partner. Generates
// a fresh tracking token behind the scenes (reusing the existing
// per-order tracking mechanism) but the ADMIN never sees or handles
// it — the partner's permanent link picks it up automatically.
export const assignOrderToPartner = async (
  orderId: string,
  partner: DeliveryPartner,
  dropAddress?: string
) => {
  const { token } = await createTrackingLink(orderId, {
    partnerName: partner.name,
    partnerPhone: partner.phone,
    dropAddress,
  });

  await updateDoc(doc(db, PARTNERS_COLLECTION, partner.id), {
    currentOrderId: orderId,
    currentOrderToken: token,
  });

  return { token };
};

// PARTNER SIDE — their permanent link resolves to whatever order
// they're currently assigned to (or null if nothing active right now).
export const getPartnerCurrentJob = async (
  partnerId: string
): Promise<{ token: string; orderId: string; partnerName: string } | null> => {
  if (!partnerId?.trim()) return null;

  const snap = await getDoc(doc(db, PARTNERS_COLLECTION, partnerId));
  if (!snap.exists()) return null;

  const data = snap.data() as DeliveryPartner;
  if (!data.currentOrderToken || !data.currentOrderId) return null;

  return {
    token: data.currentOrderToken,
    orderId: data.currentOrderId,
    partnerName: data.name,
  };
};


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
