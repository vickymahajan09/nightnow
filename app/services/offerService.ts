import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../lib/firebase";

export type OfferType =
  | "NONE"
  | "BUY_1_GET_1"
  | "BUY_1_GET_2"
  | "BUY_X_GET_Y";

export type Offer = {
  id: string;
  title: string;
  description?: string;
  type: OfferType;
  buyQuantity: number;
  freeQuantity: number;
  brandIds: string[];
  productIds: string[];
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const offersRef =
  collection(db, "offers");

/* =====================================================
   CACHE
===================================================== */

const OFFERS_CACHE_TTL =
  15_000;

let offersCache:
  | {
      data: Offer[];
      expiresAt: number;
    }
  | null = null;

let offersRequest:
  | Promise<Offer[]>
  | null = null;

const clearOffersCache = () => {
  offersCache = null;
};

/* =====================================================
   ADMIN AUTH
===================================================== */

const requireAdmin = async () => {
  const user =
    await new Promise<any>(
      (resolve, reject) => {
        if (auth.currentUser) {
          resolve(
            auth.currentUser
          );
          return;
        }

        let finished = false;

        const unsubscribe =
          onAuthStateChanged(
            auth,
            (currentUser) => {
              if (finished) {
                return;
              }

              finished = true;
              unsubscribe();

              if (currentUser) {
                resolve(
                  currentUser
                );
              } else {
                reject(
                  new Error(
                    "Please login first."
                  )
                );
              }
            }
          );

        setTimeout(() => {
          if (finished) {
            return;
          }

          finished = true;
          unsubscribe();

          reject(
            new Error(
              "Login session not found. Please login again."
            )
          );
        }, 10_000);
      }
    );

  const email =
    user?.email
      ?.trim()
      .toLowerCase();

  if (
    email !==
    "mahajanvicky04@gmail.com"
  ) {
    throw new Error(
      "Admin account required."
    );
  }

  return user;
};

/* =====================================================
   NORMALIZE OFFER
===================================================== */

const normalizeOffer = (
  data: any,
  id: string
): Offer => {
  let type: OfferType =
    "NONE";

  if (
    data.type ===
      "BUY_1_GET_1" ||
    data.type ===
      "BUY_1_GET_2" ||
    data.type ===
      "BUY_X_GET_Y"
  ) {
    type = data.type;
  }

  let buyQuantity =
    Number(
      data.buyQuantity ?? 1
    );

  let freeQuantity =
    Number(
      data.freeQuantity ?? 0
    );

  if (
    type ===
    "BUY_1_GET_1"
  ) {
    buyQuantity = 1;
    freeQuantity = 1;
  }

  if (
    type ===
    "BUY_1_GET_2"
  ) {
    buyQuantity = 1;
    freeQuantity = 2;
  }

  if (
    type ===
    "BUY_X_GET_Y"
  ) {
    buyQuantity =
      Math.max(
        1,
        Math.floor(
          buyQuantity
        )
      );

    freeQuantity =
      Math.max(
        0,
        Math.floor(
          freeQuantity
        )
      );
  }

  if (
    type ===
    "NONE"
  ) {
    buyQuantity = 1;
    freeQuantity = 0;
  }

  return {
    id,

    title: String(
      data.title ||
        "Special Offer"
    ),

    description:
      String(
        data.description ||
          ""
      ),

    type,

    buyQuantity,

    freeQuantity,

    brandIds:
      Array.isArray(
        data.brandIds
      )
        ? data.brandIds.map(
            (value: any) =>
              String(value)
          )
        : [],

    productIds:
      Array.isArray(
        data.productIds
      )
        ? data.productIds.map(
            (value: any) =>
              String(value)
          )
        : [],

    active:
      data.active !== false,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
};

/* =====================================================
   GET OFFERS
   Cached + request deduplication
===================================================== */

export const getOffers =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<Offer[]> => {
    const forceRefresh =
      options?.forceRefresh ===
      true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      offersCache &&
      offersCache.expiresAt >
        now
    ) {
      return offersCache.data;
    }

    if (
      !forceRefresh &&
      offersRequest
    ) {
      return offersRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            offersRef
          );

        const result =
          snapshot.docs.map(
            (item) =>
              normalizeOffer(
                item.data(),
                item.id
              )
          );

        offersCache = {
          data: result,
          expiresAt:
            Date.now() +
            OFFERS_CACHE_TTL,
        };

        return result;
      })();

    offersRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        offersRequest ===
        request
      ) {
        offersRequest =
          null;
      }
    }
  };

/* =====================================================
   GET OFFER BY ID
   Direct document read
===================================================== */

export const getOfferById =
  async (
    id: string
  ): Promise<Offer | null> => {
    try {
      if (!id) {
        return null;
      }

      const offerRef =
        doc(
          db,
          "offers",
          id
        );

      const snapshot =
        await getDoc(
          offerRef
        );

      if (
        !snapshot.exists()
      ) {
        return null;
      }

      return normalizeOffer(
        snapshot.data(),
        snapshot.id
      );
    } catch (error) {
      console.error(
        "getOfferById error:",
        error
      );

      return null;
    }
  };

/* =====================================================
   ADD OFFER
===================================================== */

export const addOffer =
  async (data: {
    title: string;
    description?: string;
    type: OfferType;
    buyQuantity?: number;
    freeQuantity?: number;
    brandIds?: string[];
    productIds?: string[];
    active?: boolean;
  }) => {
    await requireAdmin();

    const title =
      data.title.trim();

    if (!title) {
      throw new Error(
        "Offer title is required"
      );
    }

    let buyQuantity =
      Number(
        data.buyQuantity ?? 1
      );

    let freeQuantity =
      Number(
        data.freeQuantity ?? 0
      );

    if (
      data.type ===
      "BUY_1_GET_1"
    ) {
      buyQuantity = 1;
      freeQuantity = 1;
    }

    if (
      data.type ===
      "BUY_1_GET_2"
    ) {
      buyQuantity = 1;
      freeQuantity = 2;
    }

    if (
      data.type ===
      "BUY_X_GET_Y"
    ) {
      buyQuantity =
        Math.max(
          1,
          Math.floor(
            buyQuantity
          )
        );

      freeQuantity =
        Math.max(
          0,
          Math.floor(
            freeQuantity
          )
        );

      if (
        freeQuantity <= 0
      ) {
        throw new Error(
          "Free quantity must be greater than 0."
        );
      }
    }

    if (
      data.type !==
        "NONE" &&
      (data.brandIds
        ?.length ?? 0) === 0 &&
      (data.productIds
        ?.length ?? 0) === 0
    ) {
      throw new Error(
        "Select at least one brand or product."
      );
    }

    const result =
      await addDoc(
        offersRef,
        {
          title,

          description:
            String(
              data.description ||
                ""
            ).trim(),

          type: data.type,

          buyQuantity,

          freeQuantity,

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

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    clearOffersCache();

    return result;
  };

/* =====================================================
   UPDATE OFFER
===================================================== */

export const updateOffer =
  async (
    id: string,
    data: {
      title: string;
      description?: string;
      type: OfferType;
      buyQuantity?: number;
      freeQuantity?: number;
      brandIds?: string[];
      productIds?: string[];
      active?: boolean;
    }
  ) => {
    await requireAdmin();

    const title =
      data.title.trim();

    if (!title) {
      throw new Error(
        "Offer title is required"
      );
    }

    let buyQuantity =
      Number(
        data.buyQuantity ?? 1
      );

    let freeQuantity =
      Number(
        data.freeQuantity ?? 0
      );

    if (
      data.type ===
      "BUY_1_GET_1"
    ) {
      buyQuantity = 1;
      freeQuantity = 1;
    }

    if (
      data.type ===
      "BUY_1_GET_2"
    ) {
      buyQuantity = 1;
      freeQuantity = 2;
    }

    if (
      data.type ===
      "BUY_X_GET_Y"
    ) {
      buyQuantity =
        Math.max(
          1,
          Math.floor(
            buyQuantity
          )
        );

      freeQuantity =
        Math.max(
          0,
          Math.floor(
            freeQuantity
          )
        );

      if (
        freeQuantity <= 0
      ) {
        throw new Error(
          "Free quantity must be greater than 0."
        );
      }
    }

    if (
      data.type !==
        "NONE" &&
      (data.brandIds
        ?.length ?? 0) === 0 &&
      (data.productIds
        ?.length ?? 0) === 0
    ) {
      throw new Error(
        "Select at least one brand or product."
      );
    }

    await updateDoc(
      doc(
        db,
        "offers",
        id
      ),
      {
        title,

        description:
          String(
            data.description ||
              ""
          ).trim(),

        type: data.type,

        buyQuantity,

        freeQuantity,

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

        updatedAt:
          new Date(),
      }
    );

    clearOffersCache();
  };

/* =====================================================
   TOGGLE OFFER
===================================================== */

export const toggleOffer =
  async (
    id: string,
    active: boolean
  ) => {
    await requireAdmin();

    await updateDoc(
      doc(
        db,
        "offers",
        id
      ),
      {
        active:
          active === true,

        updatedAt:
          new Date(),
      }
    );

    clearOffersCache();
  };

/* =====================================================
   DELETE OFFER
===================================================== */

export const deleteOffer =
  async (
    id: string
  ) => {
    await requireAdmin();

    await deleteDoc(
      doc(
        db,
        "offers",
        id
      )
    );

    clearOffersCache();
  };