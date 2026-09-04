"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export type DeliveryPartnerProfile = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  currentOrderId?: string | null;
  totalEarnings?: number;
  unpaidEarnings?: number;
  totalDeliveries?: number;
};

export type EarningEntry = {
  id: string;
  orderId: string;
  amount: number;
  base?: number;
  distanceBonus?: number;
  nightBonus?: number;
  paid?: boolean;
  createdAt?: any;
};

const PARTNERS_COLLECTION = "deliveryPartners";

// Orders in these states are finished - riders should never see them
// in the available list, and they do not count as a "current job".
const CLOSED_STATUSES = ["Delivered", "Cancelled"];

/* =====================================================
   AUTH
===================================================== */

export const registerDeliveryPartner = async (
  name: string,
  phone: string,
  email: string,
  password: string
): Promise<DeliveryPartnerProfile> => {
  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanPhone || !cleanEmail || !password) {
    throw new Error("Please fill all fields.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const profile: DeliveryPartnerProfile = {
    uid: credential.user.uid,
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    active: true,
    currentOrderId: null,
    totalEarnings: 0,
    unpaidEarnings: 0,
    totalDeliveries: 0,
  };

  await setDoc(doc(db, PARTNERS_COLLECTION, credential.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
};

export const loginDeliveryPartner = async (
  email: string,
  password: string
) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error("Please enter email and password.");
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const snap = await getDoc(
    doc(db, PARTNERS_COLLECTION, credential.user.uid)
  );

  if (!snap.exists()) {
    await signOut(auth);
    throw new Error(
      "This account is not registered as a delivery partner."
    );
  }

  return { uid: credential.user.uid, ...(snap.data() as any) };
};

export const logoutDeliveryPartner = () => signOut(auth);

// Live profile subscription - so the earnings counter on the
// dashboard updates the instant a delivery is completed.
export const subscribeToDeliveryPartnerAuth = (
  callback: (profile: DeliveryPartnerProfile | null) => void
) => {
  let unsubProfile: (() => void) | null = null;

  const unsubAuth = onAuthStateChanged(auth, (user) => {
    unsubProfile?.();
    unsubProfile = null;

    if (!user) {
      callback(null);
      return;
    }

    unsubProfile = onSnapshot(
      doc(db, PARTNERS_COLLECTION, user.uid),
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        callback({ uid: user.uid, ...(snap.data() as any) });
      },
      () => callback(null)
    );
  });

  return () => {
    unsubProfile?.();
    unsubAuth();
  };
};

/* =====================================================
   AVAILABLE ORDERS

   Riders no longer wait for the admin to mark an order "Packed".
   A brand new order shows up instantly, so the rider can head to
   the shop while it is still being packed - the two now happen in
   parallel instead of one after the other.

   Queried without a `where` clause on purpose: mixing `where` and
   `orderBy` on different fields would need a composite Firestore
   index, which is pointless setup at this volume. We take the 40
   newest orders and filter in memory.
===================================================== */

export const subscribeToAvailableOrders = (
  callback: (orders: any[]) => void
) => {
  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(40)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter(
          (o: any) =>
            !o.assignedPartnerId && !CLOSED_STATUSES.includes(o.status)
        );

      callback(orders);
    },
    (error) => {
      console.error("Available orders error:", error);
      callback([]);
    }
  );
};

/* =====================================================
   MY CURRENT JOB
   Covers both phases: "heading to shop" and "out for delivery".
===================================================== */

export const subscribeToMyCurrentOrder = (
  partnerId: string,
  callback: (order: any | null) => void
) => {
  const ordersQuery = query(
    collection(db, "orders"),
    where("assignedPartnerId", "==", partnerId)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const open = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((o: any) => !CLOSED_STATUSES.includes(o.status));

      callback(open[0] || null);
    },
    (error) => {
      console.error("Current order error:", error);
      callback(null);
    }
  );
};

/* =====================================================
   MY EARNINGS (recent entries)
===================================================== */

export const subscribeToMyEarnings = (
  partnerId: string,
  callback: (entries: EarningEntry[]) => void
) => {
  const earningsQuery = query(
    collection(db, PARTNERS_COLLECTION, partnerId, "earnings"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    earningsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    },
    (error) => {
      console.error("Earnings error:", error);
      callback([]);
    }
  );
};

/* =====================================================
   ACCEPT AN ORDER

   Claiming an order no longer changes its status. The admin keeps
   full control of Pending -> Confirmed -> Preparing -> Packed; the
   rider just reserves the job so nobody else takes it. The
   transaction still guarantees only one rider can win.
===================================================== */

export const acceptOrder = async (
  orderId: string,
  partner: DeliveryPartnerProfile
) => {
  const orderRef = doc(db, "orders", orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);

    if (!snap.exists()) {
      throw new Error("This order no longer exists.");
    }

    const data = snap.data() as any;

    if (data.assignedPartnerId) {
      throw new Error("Someone already accepted this order.");
    }

    if (CLOSED_STATUSES.includes(data.status)) {
      throw new Error("This order is no longer available.");
    }

    transaction.update(orderRef, {
      assignedPartnerId: partner.uid,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      trackingToken: orderId,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    });
  });

  await updateDoc(doc(db, PARTNERS_COLLECTION, partner.uid), {
    currentOrderId: orderId,
  });
};

/* =====================================================
   PICKED UP FROM SHOP

   This is the moment the rider actually has the bag, so this - not
   "accept" - is when the order goes Out for Delivery and live GPS
   starts. Previously the customer could watch a moving dot before
   the rider had even reached the shop.
===================================================== */

export const markOrderPickedUp = async (
  orderId: string,
  partner: DeliveryPartnerProfile
) => {
  const orderRef = doc(db, "orders", orderId);
  const trackingRef = doc(db, "deliveryTracking", orderId);

  await updateDoc(orderRef, {
    status: "Out for Delivery",
    pickedUpAt: new Date(),
    updatedAt: new Date(),
  });

  await setDoc(
    trackingRef,
    {
      orderId,
      partnerId: partner.uid,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      active: true,
      location: null,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/* =====================================================
   COMPLETE DELIVERY + CREDIT EARNING

   Runs server-side on purpose. The payout is calculated from admin
   settings using the Admin SDK, so a rider cannot inflate their own
   earnings from the browser console.
===================================================== */

export const completeDelivery = async (
  orderId: string
): Promise<{ earning: number }> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Session expired. Please log in again.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch("/api/delivery/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  // Read as text first - if the server returns an HTML error page
  // this surfaces the real problem instead of a JSON parse crash.
  const raw = await response.text();

  let data: any = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // Not JSON at all - almost always a missing route or a server
    // crash before the handler ran. A wall of HTML helps nobody, so
    // translate the status code into something actionable.
    if (response.status === 404) {
      throw new Error(
        "API route /api/delivery/complete nahi mila (404). Dev server restart karo, ya live site pe naya code deploy karo."
      );
    }

    if (response.status === 500) {
      throw new Error(
        "Server error (500) - sabse aam wajah: FIREBASE_SERVICE_ACCOUNT_BASE64 env variable set nahi hai. Terminal / Vercel logs me exact error dikhega."
      );
    }

    throw new Error(
      `Server ne JSON nahi bheja (HTTP ${response.status}). Logs check karo.`
    );
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || `Delivery update failed (HTTP ${response.status}).`);
  }

  return { earning: Number(data.earning || 0) };
};

/* =====================================================
   NOTIFY ALL RIDERS ABOUT A NEW ORDER

   Called right after an order is created. Must never block the
   customer's checkout, so it swallows its own errors.
===================================================== */

export const notifyRidersOfNewOrder = async (orderId: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !orderId) return;

    const idToken = await user.getIdToken();

    await fetch("/api/delivery/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ orderId }),
    });
  } catch (error) {
    console.error("Rider notification failed:", error);
  }
};
