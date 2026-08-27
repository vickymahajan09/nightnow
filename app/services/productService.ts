import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export interface Product {
  id: string;

  name: string;
  nameLower?: string;

  brandId?: string;
  brandName?: string;

  category?: string;
  categoryId?: string;
  subcategory?: string;
  subcategoryId?: string;

  sku?: string;
  skuLower?: string;

  barcode?: string;
  barcodeLower?: string;

  hsn?: string;
  gst?: number;

  mrp: number;
  price: number;
  discount?: number;

  unit?: string;
  packSize?: string;
  weight?: string;

  stock: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold?: number;

  active: boolean;

  image?: string;
  images?: string[];

  video?: string;

  description?: string;
  shortDescription?: string;

  specifications?: Record<string, any>;
  ingredients?: string;

  variants?: any[];

  tags?: string[];
  keywords?: string[];

  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  recommended?: boolean;

  createdAt?: any;
  updatedAt?: any;

  [key: string]: any;
}

export interface ProductPage {
  products: Product[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

const PRODUCTS_COLLECTION = "products";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/* ======================================================
   PRODUCT CACHE

   Short cache prevents repeated Firebase reads while
   keeping product/admin changes fresh very quickly.
====================================================== */

const PRODUCTS_CACHE_TTL = 15_000;

let productsCache:
  | {
      data: Product[];
      expiresAt: number;
    }
  | null = null;

let productsRequest:
  | Promise<Product[]>
  | null = null;

const clearProductsCache = () => {
  productsCache = null;
};

const cleanString = (value: unknown) =>
  String(value ?? "").trim();

const normalize = (value: unknown) =>
  cleanString(value).toLowerCase();

const safeNumber = (
  value: unknown,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const calculateDiscount = (
  mrp: number,
  price: number
) => {
  if (
    mrp <= 0 ||
    price <= 0 ||
    price >= mrp
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      ((mrp - price) / mrp) * 100
    )
  );
};

const normalizeProductForSave = (
  product: any
) => {
  const name =
    cleanString(product?.name);

  const mrp =
    Math.max(
      0,
      safeNumber(
        product?.mrp ??
          product?.MRP
      )
    );

  const price =
    Math.max(
      0,
      safeNumber(
        product?.price ??
          product?.salePrice
      )
    );

  if (!name) {
    throw new Error(
      "Product name is required"
    );
  }

  if (price <= 0) {
    throw new Error(
      "Selling price must be greater than 0"
    );
  }

  if (
    mrp > 0 &&
    price > mrp
  ) {
    throw new Error(
      "Selling price cannot be greater than MRP"
    );
  }

  const stock =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          product?.stock
        )
      )
    );

  const reservedStock =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          product?.reservedStock
        )
      )
    );

  const availableStock =
    Math.max(
      0,
      stock -
        reservedStock
    );

  return {
    ...product,

    name,

    nameLower:
      normalize(name),

    mrp,

    price,

    discount:
      calculateDiscount(
        mrp,
        price
      ),

    stock,

    reservedStock,

    availableStock,

    sku:
      cleanString(
        product?.sku
      ),

    skuLower:
      normalize(
        product?.sku
      ),

    barcode:
      cleanString(
        product?.barcode
      ),

    barcodeLower:
      normalize(
        product?.barcode
      ),

    category:
      cleanString(
        product?.category
      ),

    categoryId:
      cleanString(
        product?.categoryId
      ),

    subcategory:
      cleanString(
        product?.subcategory
      ),

    subcategoryId:
      cleanString(
        product?.subcategoryId
      ),

    brandId:
      cleanString(
        product?.brandId
      ),

    brandName:
      cleanString(
        product?.brandName
      ),

    active:
      product?.active !== false,
  };
};

const assertUniqueProductIdentifiers =
  async (
    product: any,
    excludeId?: string
  ) => {
    const skuLower =
      normalize(
        product?.sku
      );

    const barcodeLower =
      normalize(
        product?.barcode
      );

    if (skuLower) {
      const skuSnapshot =
        await getDocs(
          query(
            collection(
              db,
              PRODUCTS_COLLECTION
            ),
            where(
              "skuLower",
              "==",
              skuLower
            ),
            limit(5)
          )
        );

      const duplicate =
        skuSnapshot.docs.find(
          (item) =>
            item.id !==
            excludeId
        );

      if (duplicate) {
        throw new Error(
          `SKU already exists: ${cleanString(
            product?.sku
          )}`
        );
      }
    }

    if (barcodeLower) {
      const barcodeSnapshot =
        await getDocs(
          query(
            collection(
              db,
              PRODUCTS_COLLECTION
            ),
            where(
              "barcodeLower",
              "==",
              barcodeLower
            ),
            limit(5)
          )
        );

      const duplicate =
        barcodeSnapshot.docs.find(
          (item) =>
            item.id !==
            excludeId
        );

      if (duplicate) {
        throw new Error(
          `Barcode already exists: ${cleanString(
            product?.barcode
          )}`
        );
      }
    }
  };

const mapProduct = (
  id: string,
  data: DocumentData
): Product => {
  const stock =
    Math.max(
      0,
      safeNumber(
        data?.stock
      )
    );

  const reservedStock =
    Math.max(
      0,
      safeNumber(
        data?.reservedStock
      )
    );

  const mrp =
    Math.max(
      0,
      safeNumber(
        data?.mrp ??
          data?.MRP
      )
    );

  const price =
    Math.max(
      0,
      safeNumber(
        data?.price
      )
    );

  return {
    id,

    ...data,

    name:
      cleanString(
        data?.name
      ),

    nameLower:
      normalize(
        data?.name
      ),

    mrp,

    price,

    discount:
      data?.discount != null
        ? safeNumber(
            data.discount
          )
        : calculateDiscount(
            mrp,
            price
          ),

    stock,

    reservedStock,

    availableStock:
      Math.max(
        0,
        stock -
          reservedStock
      ),

    active:
      data?.active !== false,

    sku:
      cleanString(
        data?.sku
      ),

    barcode:
      cleanString(
        data?.barcode
      ),
  } as Product;
};

// ======================================================
// ADD PRODUCT
// ======================================================

export const addProduct =
  async (
    product: any
  ) => {
    const cleanProduct =
      normalizeProductForSave(
        product
      );

    await assertUniqueProductIdentifiers(
      cleanProduct
    );

    const result =
      await addDoc(
        collection(
          db,
          PRODUCTS_COLLECTION
        ),
        {
          ...cleanProduct,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    clearProductsCache();

    return result;
  };

// ======================================================
// GET ALL PRODUCTS
// Cached + request deduplication
// ======================================================

export const getProducts =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<Product[]> => {
    const forceRefresh =
      options?.forceRefresh ===
      true;

    const now =
      Date.now();

    // Return valid cached data
    if (
      !forceRefresh &&
      productsCache &&
      productsCache.expiresAt >
        now
    ) {
      return productsCache.data;
    }

    // If another request is already loading
    // the exact same collection, reuse it.
    if (
      !forceRefresh &&
      productsRequest
    ) {
      return productsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            collection(
              db,
              PRODUCTS_COLLECTION
            )
          );

        const products =
          snapshot.docs.map(
            (item) =>
              mapProduct(
                item.id,
                item.data()
              )
          );

        productsCache = {
          data: products,
          expiresAt:
            Date.now() +
            PRODUCTS_CACHE_TTL,
        };

        return products;
      })();

    productsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        productsRequest ===
        request
      ) {
        productsRequest =
          null;
      }
    }
  };

// ======================================================
// PAGINATED PRODUCTS
// ======================================================

export const getProductsPage =
  async ({
    pageSize = DEFAULT_PAGE_SIZE,
    lastDoc = null,
    activeOnly = false,
  }: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
    activeOnly?: boolean;
  } = {}): Promise<ProductPage> => {
    const safePageSize =
      Math.min(
        MAX_PAGE_SIZE,
        Math.max(
          1,
          Math.floor(
            safeNumber(
              pageSize,
              DEFAULT_PAGE_SIZE
            )
          )
        )
      );

    const constraints: any[] =
      [
        orderBy(
          "__name__"
        ),
        limit(
          safePageSize + 1
        ),
      ];

    if (activeOnly) {
      constraints.unshift(
        where(
          "active",
          "==",
          true
        )
      );
    }

    if (lastDoc) {
      constraints.splice(
        constraints.length - 1,
        0,
        startAfter(
          lastDoc
        )
      );
    }

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            PRODUCTS_COLLECTION
          ),
          ...constraints
        )
      );

    const hasMore =
      snapshot.docs.length >
      safePageSize;

    const visibleDocs =
      hasMore
        ? snapshot.docs.slice(
            0,
            safePageSize
          )
        : snapshot.docs;

    return {
      products:
        visibleDocs.map(
          (item) =>
            mapProduct(
              item.id,
              item.data()
            )
        ),

      hasMore,

      lastDoc:
        visibleDocs.length
          ? visibleDocs[
              visibleDocs.length -
                1
            ]
          : null,
    };
  };

// ======================================================
// GET PRODUCT BY ID
// Always reads live data
// ======================================================

export const getProductById =
  async (
    id: string
  ): Promise<Product | null> => {
    const productRef =
      doc(
        db,
        PRODUCTS_COLLECTION,
        id
      );

    const snapshot =
      await getDoc(
        productRef
      );

    if (
      !snapshot.exists()
    ) {
      return null;
    }

    return mapProduct(
      snapshot.id,
      snapshot.data()
    );
  };

// ======================================================
// UPDATE PRODUCT
// ======================================================

export const updateProduct =
  async (
    id: string,
    product: any
  ) => {
    const existing =
      await getProductById(
        id
      );

    if (!existing) {
      throw new Error(
        "Product not found"
      );
    }

    const merged =
      normalizeProductForSave({
        ...existing,
        ...product,
      });

    await assertUniqueProductIdentifiers(
      merged,
      id
    );

    await updateDoc(
      doc(
        db,
        PRODUCTS_COLLECTION,
        id
      ),
      {
        ...merged,

        updatedAt:
          new Date(),
      }
    );

    clearProductsCache();
  };

// ======================================================
// ATOMIC STOCK ADJUSTMENT
// ======================================================

export const adjustProductStockAtomic =
  async (
    id: string,
    quantityChange: number,
    reason =
      "manual_adjustment",
    metadata: Record<
      string,
      any
    > = {}
  ) => {
    const change =
      Math.trunc(
        safeNumber(
          quantityChange
        )
      );

    if (change === 0) {
      throw new Error(
        "Stock change cannot be zero"
      );
    }

    const productRef =
      doc(
        db,
        PRODUCTS_COLLECTION,
        id
      );

    const result =
      await runTransaction(
        db,
        async (
          transaction
        ) => {
          const snapshot =
            await transaction.get(
              productRef
            );

          if (
            !snapshot.exists()
          ) {
            throw new Error(
              "Product not found"
            );
          }

          const data =
            snapshot.data();

          const currentStock =
            Math.max(
              0,
              Math.floor(
                safeNumber(
                  data?.stock
                )
              )
            );

          const reservedStock =
            Math.max(
              0,
              Math.floor(
                safeNumber(
                  data?.reservedStock
                )
              )
            );

          const nextStock =
            currentStock +
            change;

          if (
            nextStock < 0
          ) {
            throw new Error(
              `Insufficient stock for ${cleanString(
                data?.name
              )}`
            );
          }

          const availableStock =
            Math.max(
              0,
              nextStock -
                reservedStock
            );

          transaction.update(
            productRef,
            {
              stock:
                nextStock,

              availableStock,

              updatedAt:
                new Date(),
            }
          );

          return {
            productName:
              cleanString(
                data?.name
              ),

            previousStock:
              currentStock,

            newStock:
              nextStock,

            change,
          };
        }
      );

    await addDoc(
      collection(
        productRef,
        "stockHistory"
      ),
      {
        ...result,

        reason,

        metadata,

        createdAt:
          new Date(),
      }
    );

    clearProductsCache();

    return result;
  };

// ======================================================
// UPDATE PRODUCT STOCK
// ======================================================

export const updateProductStock =
  async (
    id: string,
    newStock: number
  ) => {
    const safeStock =
      Math.max(
        0,
        Math.floor(
          safeNumber(
            newStock
          )
        )
      );

    const product =
      await getProductById(
        id
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    const difference =
      safeStock -
      Number(
        product.stock || 0
      );

    if (
      difference === 0
    ) {
      return safeStock;
    }

    const result =
      await adjustProductStockAtomic(
        id,
        difference,
        "stock_update"
      );

    return result.newStock;
  };

// ======================================================
// VALIDATE LIVE STOCK
// ======================================================

export const validateProductStock =
  async (
    id: string,
    quantity: number
  ) => {
    const product =
      await getProductById(
        id
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    const qty =
      Math.floor(
        safeNumber(
          quantity
        )
      );

    if (qty <= 0) {
      throw new Error(
        "Invalid quantity"
      );
    }

    if (
      product.active ===
      false
    ) {
      throw new Error(
        `${product.name} is currently unavailable`
      );
    }

    const availableStock =
      Math.max(
        0,
        safeNumber(
          product.availableStock ??
            product.stock
        )
      );

    if (
      availableStock <
      qty
    ) {
      throw new Error(
        `${product.name} has only ${availableStock} item(s) in stock`
      );
    }

    return {
      product,

      stock:
        availableStock,

      remainingStock:
        availableStock -
        qty,
    };
  };

// ======================================================
// ATOMIC DECREASE STOCK
// ======================================================

export const decreaseProductStock =
  async (
    id: string,
    quantity: number
  ) => {
    const qty =
      Math.floor(
        safeNumber(
          quantity
        )
      );

    if (qty <= 0) {
      throw new Error(
        "Invalid quantity"
      );
    }

    const result =
      await adjustProductStockAtomic(
        id,
        -qty,
        "order_stock_decrease",
        {
          quantity: qty,
        }
      );

    return result.newStock;
  };

// ======================================================
// DELETE PRODUCT
// ======================================================

export const deleteProduct =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        PRODUCTS_COLLECTION,
        id
      )
    );

    clearProductsCache();
  };