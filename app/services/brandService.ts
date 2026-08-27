import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export interface Brand {
  id: string;
  name: string;
  nameLower?: string;
  slug?: string;
  logo?: string;
  banner?: string;
  description?: string;
  active: boolean;
  topBrand: boolean;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface BrandPage {
  brands: Brand[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

const COLLECTION = "brands";

/* ======================================================
   BRAND CACHE
====================================================== */

const BRAND_CACHE_TTL = 15_000;

let brandsCache:
  | {
      data: Brand[];
      expiresAt: number;
    }
  | null = null;

let brandsRequest:
  | Promise<Brand[]>
  | null = null;

const clearBrandsCache = () => {
  brandsCache = null;
};

/* ======================================================
   HELPERS
====================================================== */

const clean = (
  value: unknown
) =>
  String(
    value ?? ""
  ).trim();

const normalize = (
  value: unknown
) =>
  clean(value).toLowerCase();

const slugify = (
  value: string
) =>
  normalize(value)
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

const mapBrand = (
  id: string,
  data: DocumentData
): Brand => ({
  id,

  ...data,

  name:
    clean(data?.name),

  nameLower:
    normalize(
      data?.name
    ),

  slug:
    clean(data?.slug) ||
    slugify(
      clean(data?.name)
    ),

  logo:
    clean(data?.logo),

  active:
    data?.active !== false,

  topBrand:
    data?.topBrand === true,

  featured:
    data?.featured === true,

  sortOrder:
    Number(
      data?.sortOrder ?? 0
    ),
});

/* ======================================================
   GET ALL BRANDS
   Cached + request deduplication
====================================================== */

export const getBrands =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<Brand[]> => {
    const forceRefresh =
      options?.forceRefresh === true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      brandsCache &&
      brandsCache.expiresAt > now
    ) {
      return brandsCache.data;
    }

    if (
      !forceRefresh &&
      brandsRequest
    ) {
      return brandsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            query(
              collection(
                db,
                COLLECTION
              ),
              orderBy(
                "nameLower"
              )
            )
          );

        const result =
          snapshot.docs
            .map(
              (item) =>
                mapBrand(
                  item.id,
                  item.data()
                )
            )
            .filter(
              (brand) =>
                Boolean(
                  brand.name
                )
            );

        brandsCache = {
          data: result,
          expiresAt:
            Date.now() +
            BRAND_CACHE_TTL,
        };

        return result;
      })();

    brandsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        brandsRequest ===
        request
      ) {
        brandsRequest = null;
      }
    }
  };

/* ======================================================
   PAGINATED BRANDS
====================================================== */

export const getBrandsPage =
  async ({
    pageSize = 50,
    lastDoc = null,
    activeOnly = false,
  }: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
    activeOnly?: boolean;
  } = {}): Promise<BrandPage> => {
    const safeSize =
      Math.min(
        100,
        Math.max(
          1,
          Math.floor(
            Number(
              pageSize
            ) || 50
          )
        )
      );

    const constraints: any[] = [];

    if (activeOnly) {
      constraints.push(
        where(
          "active",
          "==",
          true
        )
      );
    }

    constraints.push(
      orderBy(
        "nameLower"
      )
    );

    if (lastDoc) {
      constraints.push(
        startAfter(
          lastDoc
        )
      );
    }

    constraints.push(
      limit(
        safeSize + 1
      )
    );

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          ...constraints
        )
      );

    const hasMore =
      snapshot.docs.length >
      safeSize;

    const visible =
      hasMore
        ? snapshot.docs.slice(
            0,
            safeSize
          )
        : snapshot.docs;

    return {
      brands:
        visible.map(
          (item) =>
            mapBrand(
              item.id,
              item.data()
            )
        ),

      hasMore,

      lastDoc:
        visible.length
          ? visible[
              visible.length - 1
            ]
          : null,
    };
  };

/* ======================================================
   ADD BRAND
====================================================== */

export const addBrand =
  async (
    name: string,
    logo = "",
    active = true,
    topBrand = false
  ) => {
    const cleanName =
      clean(name);

    const cleanLogo =
      clean(logo);

    if (!cleanName) {
      throw new Error(
        "Brand name required"
      );
    }

    const nameLower =
      normalize(
        cleanName
      );

    const duplicate =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          where(
            "nameLower",
            "==",
            nameLower
          ),
          limit(1)
        )
      );

    if (!duplicate.empty) {
      throw new Error(
        "Brand already exists"
      );
    }

    const result =
      await addDoc(
        collection(
          db,
          COLLECTION
        ),
        {
          name:
            cleanName,

          nameLower,

          slug:
            slugify(
              cleanName
            ),

          logo:
            cleanLogo,

          active:
            active !== false,

          topBrand:
            topBrand === true,

          featured:
            false,

          sortOrder:
            0,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    clearBrandsCache();

    return result;
  };

/* ======================================================
   UPDATE BRAND
====================================================== */

export const updateBrand =
  async (
    id: string,
    brand: {
      name: string;
      logo?: string;
      active?: boolean;
      topBrand?: boolean;
      featured?: boolean;
      banner?: string;
      description?: string;
      sortOrder?: number;
    }
  ) => {
    const cleanName =
      clean(
        brand.name
      );

    const cleanLogo =
      clean(
        brand.logo
      );

    if (!cleanName) {
      throw new Error(
        "Brand name required"
      );
    }

    const nameLower =
      normalize(
        cleanName
      );

    const duplicate =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          where(
            "nameLower",
            "==",
            nameLower
          ),
          limit(5)
        )
      );

    const duplicateExists =
      duplicate.docs.some(
        (item) =>
          item.id !== id
      );

    if (duplicateExists) {
      throw new Error(
        "Brand already exists"
      );
    }

    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        name:
          cleanName,

        nameLower,

        slug:
          slugify(
            cleanName
          ),

        logo:
          cleanLogo,

        active:
          brand.active !== false,

        topBrand:
          brand.topBrand === true,

        ...(brand.featured !==
        undefined
          ? {
              featured:
                brand.featured ===
                true,
            }
          : {}),

        ...(brand.banner !==
        undefined
          ? {
              banner:
                clean(
                  brand.banner
                ),
            }
          : {}),

        ...(brand.description !==
        undefined
          ? {
              description:
                clean(
                  brand.description
                ),
            }
          : {}),

        ...(brand.sortOrder !==
        undefined
          ? {
              sortOrder:
                Number(
                  brand.sortOrder ||
                    0
                ),
            }
          : {}),

        updatedAt:
          new Date(),
      }
    );

    clearBrandsCache();
  };

/* ======================================================
   TOGGLE BRAND ACTIVE
====================================================== */

export const toggleBrand =
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
        active:
          active === true,

        updatedAt:
          new Date(),
      }
    );

    clearBrandsCache();
  };

/* ======================================================
   TOGGLE TOP BRAND
====================================================== */

export const toggleTopBrand =
  async (
    id: string,
    topBrand: boolean
  ) => {
    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        topBrand:
          topBrand === true,

        updatedAt:
          new Date(),
      }
    );

    clearBrandsCache();
  };

/* ======================================================
   DELETE BRAND
====================================================== */

export const deleteBrand =
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

    clearBrandsCache();
  };