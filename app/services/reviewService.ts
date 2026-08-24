import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

/* =====================================================
   TYPES
===================================================== */

export type Review = {
  id?: string;

  productId: string;

  userId: string;

  userName: string;

  rating: number;

  comment: string;

  createdAt?: any;

  updatedAt?: any;
};

/* =====================================================
   AUTH
===================================================== */

const getCurrentUid = () => {
  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "Please login first."
    );
  }

  return uid;
};

/* =====================================================
   GET PRODUCT REVIEWS
===================================================== */

export const getProductReviews =
  async (
    productId: string
  ): Promise<Review[]> => {
    if (!productId) {
      return [];
    }

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "reviews"
          ),
          where(
            "productId",
            "==",
            productId
          )
        )
      );

    const reviews =
      snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as Review
      );

    reviews.sort(
      (a: any, b: any) => {
        const getTime =
          (value: any) => {
            if (
              typeof value?.toMillis ===
              "function"
            ) {
              return value.toMillis();
            }

            if (
              typeof value?.seconds ===
              "number"
            ) {
              return (
                value.seconds * 1000
              );
            }

            const time =
              new Date(
                value || 0
              ).getTime();

            return Number.isNaN(
              time
            )
              ? 0
              : time;
          };

        return (
          getTime(
            b.createdAt
          ) -
          getTime(
            a.createdAt
          )
        );
      }
    );

    return reviews;
  };

/* =====================================================
   GET ALL REVIEWS - ADMIN
===================================================== */

export const getAllReviews =
  async (): Promise<Review[]> => {
    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "reviews"
          )
        )
      );

    const reviews =
      snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as Review
      );

    reviews.sort(
      (a: any, b: any) => {
        const getTime =
          (value: any) => {
            if (
              typeof value?.toMillis ===
              "function"
            ) {
              return value.toMillis();
            }

            if (
              typeof value?.seconds ===
              "number"
            ) {
              return (
                value.seconds * 1000
              );
            }

            const time =
              new Date(
                value || 0
              ).getTime();

            return Number.isNaN(
              time
            )
              ? 0
              : time;
          };

        return (
          getTime(
            b.createdAt
          ) -
          getTime(
            a.createdAt
          )
        );
      }
    );

    return reviews;
  };

/* =====================================================
   ADD REVIEW
=====================================================

   Supports BOTH:

   1) New/current format:
      addReview(
        productId,
        userId,
        userName,
        rating,
        comment
      )

   2) Older format:
      addReview(
        productId,
        rating,
        comment,
        userName
      )

   Firebase Auth UID is always taken from
   auth.currentUser for security.
===================================================== */

export function addReview(
  productId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<string>;

export function addReview(
  productId: string,
  rating: number,
  comment: string,
  userName?: string
): Promise<string>;

export async function addReview(
  productId: string,
  arg2: string | number,
  arg3: string,
  arg4?: number | string,
  arg5?: string
): Promise<string> {
  const authenticatedUid =
    getCurrentUid();

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  let userName = "Customer";
  let rating = 5;
  let comment = "";

  /*
   * 5-argument format:
   *
   * productId,
   * userId,
   * userName,
   * rating,
   * comment
   */
  if (
    typeof arg2 === "string" &&
    typeof arg4 === "number"
  ) {
    userName =
      String(arg3 || "")
        .trim() ||
      "Customer";

    rating =
      Number(arg4);

    comment =
      String(arg5 || "")
        .trim();

  } else {
    /*
     * 4-argument format:
     *
     * productId,
     * rating,
     * comment,
     * userName
     */
    rating =
      Number(arg2);

    comment =
      String(arg3 || "")
        .trim();

    if (
      typeof arg4 === "string"
    ) {
      userName =
        arg4.trim() ||
        "Customer";
    }
  }

  const cleanRating =
    Math.max(
      1,
      Math.min(
        5,
        Number.isFinite(
          rating
        )
          ? rating
          : 5
      )
    );

  if (!comment) {
    throw new Error(
      "Review comment is required."
    );
  }

  const ref =
    await addDoc(
      collection(
        db,
        "reviews"
      ),
      {
        productId,

        /*
         * Always trust Firebase Auth,
         * never a frontend-supplied UID.
         */
        userId:
          authenticatedUid,

        userName,

        rating:
          cleanRating,

        comment,

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );

  return ref.id;
}

/* =====================================================
   UPDATE REVIEW
===================================================== */

export const updateReview =
  async (
    id: string,
    rating: number,
    comment: string
  ) => {
    if (!id) {
      throw new Error(
        "Review ID is required."
      );
    }

    getCurrentUid();

    const cleanComment =
      comment.trim();

    if (!cleanComment) {
      throw new Error(
        "Review comment is required."
      );
    }

    await updateDoc(
      doc(
        db,
        "reviews",
        id
      ),
      {
        rating:
          Math.max(
            1,
            Math.min(
              5,
              Number(rating)
            )
          ),

        comment:
          cleanComment,

        updatedAt:
          new Date(),
      }
    );
  };

/* =====================================================
   DELETE REVIEW
===================================================== */

export const deleteReview =
  async (
    id: string
  ) => {
    if (!id) {
      return;
    }

    await deleteDoc(
      doc(
        db,
        "reviews",
        id
      )
    );
  };