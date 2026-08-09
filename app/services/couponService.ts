import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";


// ==============================
// GET COUPONS
// ==============================

export const getCoupons = async () => {
  const snapshot = await getDocs(
    collection(db, "coupons")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};


// ==============================
// ADD COUPON
// ==============================

export const addCoupon = async (
  coupon: any
) => {
  const code =
    String(coupon.code || "")
      .trim()
      .toUpperCase();

  if (!code) {
    throw new Error(
      "Coupon code is required"
    );
  }

  const discount = Number(
    coupon.discount || 0
  );

  if (
    discount <= 0 ||
    discount > 100
  ) {
    throw new Error(
      "Discount must be between 1 and 100"
    );
  }

  const existing =
    await getCoupons();

  const duplicate =
    existing.find(
      (item: any) =>
        String(item.code || "")
          .toUpperCase() === code
    );

  if (duplicate) {
    throw new Error(
      "Coupon code already exists"
    );
  }

  return await addDoc(
    collection(db, "coupons"),
    {
      code,

      discount,

      minOrder: Number(
        coupon.minOrder || 0
      ),

      expiresAt:
        coupon.expiresAt || "",

      active:
        coupon.active !== false,

      createdAt: new Date(),

      updatedAt: new Date(),
    }
  );
};


// ==============================
// UPDATE COUPON
// ==============================

export const updateCoupon = async (
  id: string,
  coupon: any
) => {
  const code =
    String(coupon.code || "")
      .trim()
      .toUpperCase();

  const discount = Number(
    coupon.discount || 0
  );

  if (!code) {
    throw new Error(
      "Coupon code is required"
    );
  }

  if (
    discount <= 0 ||
    discount > 100
  ) {
    throw new Error(
      "Discount must be between 1 and 100"
    );
  }

  await updateDoc(
    doc(db, "coupons", id),
    {
      code,

      discount,

      minOrder: Number(
        coupon.minOrder || 0
      ),

      expiresAt:
        coupon.expiresAt || "",

      active:
        coupon.active !== false,

      updatedAt: new Date(),
    }
  );
};


// ==============================
// TOGGLE COUPON
// ==============================

export const toggleCoupon = async (
  id: string,
  active: boolean
) => {
  await updateDoc(
    doc(db, "coupons", id),
    {
      active,
      updatedAt: new Date(),
    }
  );
};


// ==============================
// DELETE COUPON
// ==============================

export const deleteCoupon = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "coupons", id)
  );
};