import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

const COLLECTION =
  "coupons";

/* ======================================================
   CACHE
====================================================== */

const COUPONS_CACHE_TTL =
  15_000;

let couponsCache:
  | {
      data: any[];
      expiresAt: number;
    }
  | null = null;

let couponsRequest:
  | Promise<any[]>
  | null = null;

const clearCouponsCache = () => {
  couponsCache = null;
};

/* ======================================================
   GET COUPONS
   Cached + request deduplication
====================================================== */

export const getCoupons =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ) => {
    const forceRefresh =
      options?.forceRefresh === true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      couponsCache &&
      couponsCache.expiresAt >
        now
    ) {
      return couponsCache.data;
    }

    if (
      !forceRefresh &&
      couponsRequest
    ) {
      return couponsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            collection(
              db,
              COLLECTION
            )
          );

        const result =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data(),
            })
          );

        couponsCache = {
          data: result,
          expiresAt:
            Date.now() +
            COUPONS_CACHE_TTL,
        };

        return result;
      })();

    couponsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        couponsRequest ===
        request
      ) {
        couponsRequest = null;
      }
    }
  };

/* ======================================================
   ADD COUPON
====================================================== */

export const addCoupon =
  async (
    coupon: any
  ) => {
    const code =
      String(
        coupon.code || ""
      )
        .trim()
        .toUpperCase();

    if (!code) {
      throw new Error(
        "Coupon code is required"
      );
    }

    const discount =
      Number(
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

    /*
     * Use the cached coupon list when available.
     * This avoids an unnecessary second Firebase
     * read in normal cases.
     */
    const existing =
      await getCoupons();

    const duplicate =
      existing.find(
        (item: any) =>
          String(
            item.code || ""
          )
            .trim()
            .toUpperCase() ===
          code
      );

    if (duplicate) {
      throw new Error(
        "Coupon code already exists"
      );
    }

    const result =
      await addDoc(
        collection(
          db,
          COLLECTION
        ),
        {
          code,

          discount,

          minOrder:
            Number(
              coupon.minOrder ||
                0
            ),

          expiresAt:
            coupon.expiresAt ||
            "",

          active:
            coupon.active !==
            false,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    clearCouponsCache();

    return result;
  };

/* ======================================================
   UPDATE COUPON
====================================================== */

export const updateCoupon =
  async (
    id: string,
    coupon: any
  ) => {
    const code =
      String(
        coupon.code || ""
      )
        .trim()
        .toUpperCase();

    const discount =
      Number(
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
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        code,

        discount,

        minOrder:
          Number(
            coupon.minOrder ||
              0
          ),

        expiresAt:
          coupon.expiresAt ||
          "",

        active:
          coupon.active !==
          false,

        updatedAt:
          new Date(),
      }
    );

    clearCouponsCache();
  };

/* ======================================================
   TOGGLE COUPON
====================================================== */

export const toggleCoupon =
  async (
    id: string,
    active: boolean
  ) => {
    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        active,

        updatedAt:
          new Date(),
      }
    );

    clearCouponsCache();
  };

/* ======================================================
   DELETE COUPON
====================================================== */

export const deleteCoupon =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        COLLECTION,
        id
      )
    );

    clearCouponsCache();
  };