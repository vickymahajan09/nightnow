import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type Need = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  keywords: string[];
  brandIds: string[];
  productIds: string[];
  active: boolean;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
};

const needsRef =
  collection(db, "needs");

/* ======================================================
   CACHE
====================================================== */

const NEEDS_CACHE_TTL =
  15_000;

let needsCache:
  | {
      data: Need[];
      expiresAt: number;
    }
  | null = null;

let needsRequest:
  | Promise<Need[]>
  | null = null;

const clearNeedsCache = () => {
  needsCache = null;
};

/* ======================================================
   NORMALIZE
====================================================== */

const normalize = (
  data: any,
  id: string
): Need => ({
  id,

  icon: String(
    data.icon || "✨"
  ),

  title: String(
    data.title || ""
  ),

  description: String(
    data.description || ""
  ),

  keywords:
    Array.isArray(
      data.keywords
    )
      ? data.keywords.map(
          String
        )
      : [],

  brandIds:
    Array.isArray(
      data.brandIds
    )
      ? data.brandIds.map(
          String
        )
      : [],

  productIds:
    Array.isArray(
      data.productIds
    )
      ? data.productIds.map(
          String
        )
      : [],

  active:
    data.active !== false,

  sortOrder:
    Number(
      data.sortOrder || 0
    ),

  ...data,
});

/* ======================================================
   GET NEEDS
   Cached + request deduplication
====================================================== */

export const getNeeds =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<Need[]> => {
    const forceRefresh =
      options?.forceRefresh ===
      true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      needsCache &&
      needsCache.expiresAt >
        now
    ) {
      return needsCache.data;
    }

    if (
      !forceRefresh &&
      needsRequest
    ) {
      return needsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            needsRef
          );

        const result =
          snapshot.docs
            .map((item) =>
              normalize(
                item.data(),
                item.id
              )
            )
            .sort(
              (a, b) =>
                a.sortOrder -
                b.sortOrder
            );

        needsCache = {
          data: result,
          expiresAt:
            Date.now() +
            NEEDS_CACHE_TTL,
        };

        return result;
      })();

    needsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        needsRequest ===
        request
      ) {
        needsRequest =
          null;
      }
    }
  };

/* ======================================================
   CLEAN NEED
====================================================== */

const cleanNeed = (
  data: {
    icon: string;
    title: string;
    description?: string;
    keywords?: string[];
    brandIds?: string[];
    productIds?: string[];
    active?: boolean;
    sortOrder?: number;
  }
) => {
  const title =
    data.title.trim();

  if (!title) {
    throw new Error(
      "Need title is required"
    );
  }

  return {
    icon:
      data.icon.trim() ||
      "✨",

    title,

    description:
      String(
        data.description || ""
      ).trim(),

    keywords:
      Array.from(
        new Set(
          (
            data.keywords ||
            []
          )
            .map((x) =>
              x.trim()
            )
            .filter(Boolean)
        )
      ),

    brandIds:
      Array.from(
        new Set(
          data.brandIds ||
            []
        )
      ),

    productIds:
      Array.from(
        new Set(
          data.productIds ||
            []
        )
      ),

    active:
      data.active !== false,

    sortOrder:
      Number(
        data.sortOrder || 0
      ),

    updatedAt:
      new Date(),
  };
};

/* ======================================================
   ADD NEED
====================================================== */

export const addNeed =
  async (
    data: Parameters<
      typeof cleanNeed
    >[0]
  ) => {
    const result =
      await addDoc(
        needsRef,
        {
          ...cleanNeed(
            data
          ),

          createdAt:
            new Date(),
        }
      );

    clearNeedsCache();

    return result;
  };

/* ======================================================
   UPDATE NEED
====================================================== */

export const updateNeed =
  async (
    id: string,
    data: Parameters<
      typeof cleanNeed
    >[0]
  ) => {
    await updateDoc(
      doc(
        db,
        "needs",
        id
      ),
      cleanNeed(data)
    );

    clearNeedsCache();
  };

/* ======================================================
   TOGGLE NEED
====================================================== */

export const toggleNeed =
  async (
    id: string,
    active: boolean
  ) => {
    await updateDoc(
      doc(
        db,
        "needs",
        id
      ),
      {
        active,

        updatedAt:
          new Date(),
      }
    );

    clearNeedsCache();
  };

/* ======================================================
   DELETE NEED
====================================================== */

export const deleteNeed =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        "needs",
        id
      )
    );

    clearNeedsCache();
  };