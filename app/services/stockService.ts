import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

/* =====================================================
   TYPES
===================================================== */

export type StockCheckItem = {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
};

export type StockCheckResult = {
  productId: string;
  variantId?: string;

  requestedQuantity: number;

  availableStock: number;

  available: boolean;

  message?: string;
};

/* =====================================================
   HELPERS
===================================================== */

const toStockNumber = (
  value: any
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return Math.floor(number);
};

/* =====================================================
   GET PRODUCT
===================================================== */

export const getProductById =
  async (
    productId: string
  ) => {
    if (!productId) {
      return null;
    }

    const snapshot =
      await getDoc(
        doc(
          db,
          "products",
          productId
        )
      );

    if (
      !snapshot.exists()
    ) {
      return null;
    }

    return {
      id:
        snapshot.id,
      ...snapshot.data(),
    };
  };

/* =====================================================
   GET PRODUCT STOCK
===================================================== */

export const getProductStock =
  async (
    productId: string,
    variantId?: string
  ) => {
    const product =
      await getProductById(
        productId
      );

    if (!product) {
      return 0;
    }

    const variants =
      Array.isArray(
        (product as any)
          .variants
      )
        ? (product as any)
            .variants
        : Array.isArray(
            (product as any)
              .sizes
          )
          ? (product as any)
              .sizes
          : [];

    if (
      variantId &&
      variants.length > 0
    ) {
      const variant =
        variants.find(
          (item: any) =>
            String(
              item?.id || ""
            ) ===
              String(
                variantId
              ) ||
            String(
              item?.name || ""
            ) ===
              String(
                variantId
              )
        );

      if (variant) {
        return toStockNumber(
          variant.stock
        );
      }
    }

    return toStockNumber(
      (product as any).stock
    );
  };

/* =====================================================
   VALIDATE ONE ITEM
===================================================== */

export const validateProductStock =
  async (
    item: StockCheckItem
  ): Promise<StockCheckResult> => {
    const requested =
      Math.max(
        1,
        Math.floor(
          Number(
            item.requestedQuantity ||
              1
          )
        )
      );

    const stock =
      await getProductStock(
        item.productId,
        item.variantId
      );

    const available =
      stock >= requested;

    return {
      productId:
        item.productId,

      variantId:
        item.variantId,

      requestedQuantity:
        requested,

      availableStock:
        stock,

      available,

      message: available
        ? undefined
        : stock <= 0
          ? "Product is out of stock."
          : `Only ${stock} item${
              stock === 1
                ? ""
                : "s"
            } available.`,
    };
  };

/* =====================================================
   VALIDATE CART
===================================================== */

export const validateCartStock =
  async (
    cart: any[]
  ) => {
    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return {
        valid: true,
        results:
          [] as StockCheckResult[],
      };
    }

    const results =
      await Promise.all(
        cart.map(
          (item) =>
            validateProductStock(
              {
                productId:
                  String(
                    item?.id ||
                      ""
                  ),

                variantId:
                  item?.variantId
                    ? String(
                        item.variantId
                      )
                    : undefined,

                requestedQuantity:
                  Number(
                    item?.quantity ||
                      1
                  ),
              }
            )
        )
      );

    return {
      valid:
        results.every(
          (item) =>
            item.available
        ),

      results,
    };
  };

/* =====================================================
   GET ALL OUT OF STOCK PRODUCTS
===================================================== */

export const getOutOfStockProductIds =
  async () => {
    const snapshot =
      await getDocs(
        collection(
          db,
          "products"
        )
      );

    return snapshot.docs
      .filter(
        (item) =>
          toStockNumber(
            item.data()
              ?.stock
          ) <= 0
      )
      .map(
        (item) =>
          item.id
      );
  };