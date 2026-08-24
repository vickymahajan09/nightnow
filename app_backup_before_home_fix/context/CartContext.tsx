"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  id: string;

  name?: string;
  image?: string;

  price?: number;
  mrp?: number;

  quantity?: number;
  stock?: number;

  category?: string;

  variantId?: string;
  variantName?: string;

  size?: string;
  weight?: string;
  volume?: string;
  pack?: string;

  quantityLabel?: string;

  /* =========================
     OFFER FIELDS
  ========================= */

  offerId?: string | null;

  offerType?:
    | "NONE"
    | "BUY_1_GET_1"
    | "BUY_1_GET_2"
    | "BUY_X_GET_Y";

  offerLabel?: string;

  offerBuyQuantity?: number;

  offerFreeQuantity?: number;

  offerDescription?: string;

  freeQuantity?: number;

  totalQuantity?: number;

  /* ========================= */

  [key: string]: any;
};

type CartContextType = {
  cart: CartItem[];

  cartTotal: number;

  cartCount: number;

  addToCart: (
    item: CartItem
  ) => void;

  removeFromCart: (
    id: string,
    variantId?: string
  ) => void;

  deleteFromCart: (
    id: string,
    variantId?: string
  ) => void;

  clearCart: () => void;

  isInCart: (
    id: string,
    variantId?: string
  ) => boolean;

  getItemQuantity: (
    id: string,
    variantId?: string
  ) => number;
};

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

const CART_STORAGE_KEY =
  "nightnow_cart";

const getItemKey = (
  item: CartItem
) => {
  return `${item.id}__${
    item.variantId ||
    item.variantName ||
    item.size ||
    item.weight ||
    item.volume ||
    item.pack ||
    "default"
  }`;
};

/* =====================================================
   OFFER CALCULATOR
===================================================== */

const calculateOffer = (
  item: CartItem,
  paidQuantity: number
) => {
  const type =
    item.offerType ||
    "NONE";

  const buyQuantity =
    Math.max(
      1,
      Number(
        item.offerBuyQuantity ||
          1
      )
    );

  const configuredFree =
    Math.max(
      0,
      Number(
        item.offerFreeQuantity ||
          0
      )
    );

  if (
    type === "BUY_1_GET_1"
  ) {
    return {
      freeQuantity:
        paidQuantity,
      totalQuantity:
        paidQuantity * 2,
    };
  }

  if (
    type === "BUY_1_GET_2"
  ) {
    return {
      freeQuantity:
        paidQuantity * 2,
      totalQuantity:
        paidQuantity * 3,
    };
  }

  if (
    type === "BUY_X_GET_Y"
  ) {
    const completedSets =
      Math.floor(
        paidQuantity /
          buyQuantity
      );

    const freeQuantity =
      completedSets *
      configuredFree;

    return {
      freeQuantity,
      totalQuantity:
        paidQuantity +
        freeQuantity,
    };
  }

  return {
    freeQuantity: 0,
    totalQuantity:
      paidQuantity,
  };
};

/* =====================================================
   NORMALIZE ITEM
===================================================== */

const normalizeCartItem = (
  item: CartItem,
  quantity: number
): CartItem => {
  const paidQuantity =
    Math.max(
      1,
      Number(quantity || 1)
    );

  const offer =
    calculateOffer(
      item,
      paidQuantity
    );

  return {
    ...item,

    quantity:
      paidQuantity,

    offerBuyQuantity:
      item.offerType ===
      "BUY_X_GET_Y"
        ? Math.max(
            1,
            Number(
              item.offerBuyQuantity ||
                1
            )
          )
        : item.offerType ===
          "BUY_1_GET_1" ||
          item.offerType ===
          "BUY_1_GET_2"
        ? 1
        : 0,

    offerFreeQuantity:
      item.offerType ===
      "BUY_1_GET_1"
        ? 1
        : item.offerType ===
          "BUY_1_GET_2"
        ? 2
        : item.offerType ===
          "BUY_X_GET_Y"
        ? Math.max(
            0,
            Number(
              item.offerFreeQuantity ||
                0
            )
          )
        : 0,

    freeQuantity:
      offer.freeQuantity,

    totalQuantity:
      offer.totalQuantity,
  };
};

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  /* =====================================================
     LOAD CART
  ===================================================== */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(
            parsed
          )
        ) {
          setCart(
            parsed.map(
              (item) =>
                normalizeCartItem(
                  item,
                  Number(
                    item.quantity ||
                      1
                  )
                )
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "Cart loading failed:",
        error
      );
    }

    setLoaded(true);
  }, []);

  /* =====================================================
     SAVE CART
  ===================================================== */

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Cart saving failed:",
        error
      );
    }
  }, [
    cart,
    loaded,
  ]);

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = (
    item: CartItem
  ) => {
    if (!item?.id) {
      console.warn(
        "Product ID missing"
      );
      return;
    }

    setCart(
      (currentCart) => {
        const itemKey =
          getItemKey(item);

        const existingIndex =
          currentCart.findIndex(
            (cartItem) =>
              getItemKey(
                cartItem
              ) === itemKey
          );

        /* ==========================
           NEW ITEM
        ========================== */

        if (
          existingIndex === -1
        ) {
          const stock =
            Number(
              item.stock || 0
            );

          const quantity =
            Math.max(
              1,
              Number(
                item.quantity ||
                  1
              )
            );

          const finalQuantity =
            stock > 0
              ? Math.min(
                  quantity,
                  stock
                )
              : quantity;

          return [
            ...currentCart,
            normalizeCartItem(
              item,
              finalQuantity
            ),
          ];
        }

        /* ==========================
           EXISTING ITEM
        ========================== */

        const updated = [
          ...currentCart,
        ];

        const existing =
          updated[
            existingIndex
          ];

        const currentQuantity =
          Number(
            existing.quantity ||
              1
          );

        const stock =
          Number(
            existing.stock ||
              0
          );

        if (
          stock > 0 &&
          currentQuantity >=
            stock
        ) {
          return currentCart;
        }

        const newQuantity =
          currentQuantity +
          1;

        updated[
          existingIndex
        ] = normalizeCartItem(
          existing,
          newQuantity
        );

        return updated;
      }
    );
  };

  /* =====================================================
     REMOVE ONE
  ===================================================== */

  const removeFromCart = (
    id: string,
    variantId?: string
  ) => {
    setCart(
      (currentCart) => {
        const index =
          currentCart.findIndex(
            (item) =>
              item.id === id &&
              (
                variantId
                  ? item.variantId ===
                    variantId
                  : true
              )
          );

        if (index === -1) {
          return currentCart;
        }

        const updated = [
          ...currentCart,
        ];

        const item =
          updated[index];

        const quantity =
          Number(
            item.quantity ||
              1
          );

        if (
          quantity <= 1
        ) {
          updated.splice(
            index,
            1
          );

          return updated;
        }

        updated[
          index
        ] = normalizeCartItem(
          item,
          quantity - 1
        );

        return updated;
      }
    );
  };

  /* =====================================================
     DELETE ITEM
  ===================================================== */

  const deleteFromCart = (
    id: string,
    variantId?: string
  ) => {
    setCart(
      (currentCart) =>
        currentCart.filter(
          (item) =>
            !(
              item.id === id &&
              (
                variantId
                  ? item.variantId ===
                    variantId
                  : true
              )
            )
        )
    );
  };

  /* =====================================================
     CLEAR
  ===================================================== */

  const clearCart = () => {
    setCart([]);
  };

  /* =====================================================
     CHECK
  ===================================================== */

  const isInCart = (
    id: string,
    variantId?: string
  ) => {
    return cart.some(
      (item) =>
        item.id === id &&
        (
          variantId
            ? item.variantId ===
              variantId
            : true
        )
    );
  };

  /* =====================================================
     QUANTITY
  ===================================================== */

  const getItemQuantity = (
    id: string,
    variantId?: string
  ) => {
    const item =
      cart.find(
        (cartItem) =>
          cartItem.id === id &&
          (
            variantId
              ? cartItem.variantId ===
                variantId
              : true
          )
      );

    return Number(
      item?.quantity || 0
    );
  };

  /* =====================================================
     CART TOTAL
     
     IMPORTANT:
     quantity = paid quantity.
     freeQuantity is never charged.
  ===================================================== */

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (
        total,
        item
      ) => {
        const price =
          Number(
            item.price || 0
          );

        const quantity =
          Number(
            item.quantity ||
              1
          );

        return (
          total +
          price *
            quantity
        );
      },
      0
    );
  }, [cart]);

  /* =====================================================
     CART COUNT

     Total physical quantity:
     paid + free.
  ===================================================== */

  const cartCount = useMemo(() => {
    return cart.reduce(
      (
        total,
        item
      ) => {
        return (
          total +
          Number(
            item.totalQuantity ||
              item.quantity ||
              0
          )
        );
      },
      0
    );
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        cartCount,

        addToCart,

        removeFromCart,

        deleteFromCart,

        clearCart,

        isInCart,

        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}