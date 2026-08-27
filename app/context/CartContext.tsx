"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  ReactNode,
} from "react";

export type CartItem = {
  id: string;

  name?: string;
  image?: string;
  images?: string[];

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

  offerSaving?: number;

  [key: string]: any;
};

/* =====================================================
   CART CONTEXT TYPE
===================================================== */

type CartContextType = {
  cart: CartItem[];

  cartTotal: number;

  cartCount: number;

  offerSavings: number;

  addToCart: (
    item: CartItem
  ) => void;

  removeFromCart: (
    id: string,
    variantId?: string,
    offerId?: string
  ) => void;

  deleteFromCart: (
    id: string,
    variantId?: string,
    offerId?: string
  ) => void;

  clearCart: () => void;

  isInCart: (
    id: string,
    variantId?: string,
    offerId?: string
  ) => boolean;

  getItemQuantity: (
    id: string,
    variantId?: string,
    offerId?: string
  ) => number;

  /* CART POPUP */

  cartPopupVisible: boolean;

  cartPopupItem: CartItem | null;

  hideCartPopup: () => void;
};

/* =====================================================
   CONTEXT
===================================================== */

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

/* =====================================================
   STORAGE
===================================================== */

const CART_STORAGE_KEY =
  "nightnow_cart";

/* =====================================================
   ITEM KEY
===================================================== */

const getItemKey = (
  item: CartItem
) => {
  const variant =
    item.variantId ||
    item.variantName ||
    item.size ||
    item.weight ||
    item.volume ||
    item.pack ||
    "default";

  const offer =
    item.offerId ||
    "normal";

  return `${item.id}__${variant}__${offer}`;
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

  const safePaidQuantity =
    Math.max(
      1,
      Number(
        paidQuantity || 1
      )
    );

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

  /* BUY 1 GET 1 */

  if (
    type ===
    "BUY_1_GET_1"
  ) {
    const freeQuantity =
      safePaidQuantity;

    return {
      freeQuantity,

      totalQuantity:
        safePaidQuantity +
        freeQuantity,
    };
  }

  /* BUY 1 GET 2 */

  if (
    type ===
    "BUY_1_GET_2"
  ) {
    const freeQuantity =
      safePaidQuantity * 2;

    return {
      freeQuantity,

      totalQuantity:
        safePaidQuantity +
        freeQuantity,
    };
  }

  /* BUY X GET Y */

  if (
    type ===
    "BUY_X_GET_Y"
  ) {
    const completedSets =
      Math.floor(
        safePaidQuantity /
          buyQuantity
      );

    const freeQuantity =
      completedSets *
      configuredFree;

    return {
      freeQuantity,

      totalQuantity:
        safePaidQuantity +
        freeQuantity,
    };
  }

  /* NORMAL PRODUCT */

  return {
    freeQuantity: 0,

    totalQuantity:
      safePaidQuantity,
  };
};

/* =====================================================
   NORMALIZE CART ITEM
===================================================== */

const normalizeCartItem = (
  item: CartItem,
  quantity: number
): CartItem => {
  const paidQuantity =
    Math.max(
      1,
      Number(
        quantity || 1
      )
    );

  const offer =
    calculateOffer(
      item,
      paidQuantity
    );

  const price =
    Math.max(
      0,
      Number(
        item.price || 0
      )
    );

  const offerSaving =
    price *
    offer.freeQuantity;

  let offerBuyQuantity =
    0;

  let offerFreeQuantity =
    0;

  /* NORMALIZE OFFER TYPE */

  if (
    item.offerType ===
    "BUY_1_GET_1"
  ) {
    offerBuyQuantity = 1;

    offerFreeQuantity = 1;
  }

  if (
    item.offerType ===
    "BUY_1_GET_2"
  ) {
    offerBuyQuantity = 1;

    offerFreeQuantity = 2;
  }

  if (
    item.offerType ===
    "BUY_X_GET_Y"
  ) {
    offerBuyQuantity =
      Math.max(
        1,
        Number(
          item.offerBuyQuantity ||
            1
        )
      );

    offerFreeQuantity =
      Math.max(
        0,
        Number(
          item.offerFreeQuantity ||
            0
        )
      );
  }

  return {
    ...item,

    quantity:
      paidQuantity,

    offerBuyQuantity,

    offerFreeQuantity,

    freeQuantity:
      offer.freeQuantity,

    totalQuantity:
      offer.totalQuantity,

    offerSaving,
  };
};

/* =====================================================
   CART PROVIDER
===================================================== */

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  /* CART POPUP */

  const [
    cartPopupVisible,
    setCartPopupVisible,
  ] = useState(false);

  const [
    cartPopupItem,
    setCartPopupItem,
  ] = useState<CartItem | null>(
    null
  );

  const popupTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  /* CLEAN TIMER */

  useEffect(() => {
    return () => {
      if (
        popupTimerRef.current
      ) {
        clearTimeout(
          popupTimerRef.current
        );
      }
    };
  }, []);

  /* ===================================================
     LOAD CART
  =================================================== */

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
          Array.isArray(parsed)
        ) {
          setCart(
            parsed.map(
              (
                item: CartItem
              ) =>
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

  /* ===================================================
     SAVE CART
  =================================================== */

  useEffect(() => {
    if (!loaded) {
      return;
    }

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

  /* ===================================================
     ADD TO CART
  =================================================== */

  const addToCart = (
    item: CartItem
  ) => {
    if (!item?.id) {
      console.warn(
        "Product ID missing"
      );

      return;
    }

    const itemKey =
      getItemKey(item);

    const existingItem =
      cart.find(
        (
          cartItem
        ) =>
          getItemKey(
            cartItem
          ) === itemKey
      );

    const currentQuantity =
      Number(
        existingItem?.quantity ||
          0
      );

    const stock =
      Number(
        item.stock ||
          existingItem?.stock ||
          0
      );

    /* STOCK LIMIT */

    if (
      stock > 0 &&
      currentQuantity >=
        stock
    ) {
      return;
    }

    const popupQuantity =
      Math.max(
        1,
        currentQuantity + 1
      );

    /* POPUP ITEM */

    setCartPopupItem(
      normalizeCartItem(
        existingItem ||
          item,
        popupQuantity
      )
    );

    setCartPopupVisible(true);

    /* RESET TIMER */

    if (
      popupTimerRef.current
    ) {
      clearTimeout(
        popupTimerRef.current
      );
    }

    popupTimerRef.current =
      setTimeout(() => {
        setCartPopupVisible(
          false
        );
      }, 5000);

    /* UPDATE CART */

    setCart(
      (
        currentCart
      ) => {
        const existingIndex =
          currentCart.findIndex(
            (
              cartItem
            ) =>
              getItemKey(
                cartItem
              ) === itemKey
          );

        /* NEW ITEM */

        if (
          existingIndex ===
          -1
        ) {
          const itemStock =
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
            itemStock > 0
              ? Math.min(
                  quantity,
                  itemStock
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

        /* EXISTING ITEM */

        const updated = [
          ...currentCart,
        ];

        const existing =
          updated[
            existingIndex
          ];

        const existingQuantity =
          Number(
            existing.quantity ||
              1
          );

        const existingStock =
          Number(
            existing.stock ||
              0
          );

        if (
          existingStock > 0 &&
          existingQuantity >=
            existingStock
        ) {
          return currentCart;
        }

        const newQuantity =
          existingQuantity +
          1;

        updated[
          existingIndex
        ] =
          normalizeCartItem(
            existing,
            newQuantity
          );

        return updated;
      }
    );
  };

  /* ===================================================
     HIDE CART POPUP
  =================================================== */

  const hideCartPopup = () => {
    setCartPopupVisible(
      false
    );

    if (
      popupTimerRef.current
    ) {
      clearTimeout(
        popupTimerRef.current
      );

      popupTimerRef.current =
        null;
    }
  };

  /* ===================================================
     REMOVE ONE
  =================================================== */

  const removeFromCart = (
    id: string,
    variantId?: string,
    offerId?: string
  ) => {
    setCart(
      (
        currentCart
      ) => {
        const targetOfferId =
          offerId ||
          "normal";

        const index =
          currentCart.findIndex(
            (
              item
            ) =>
              item.id ===
                id &&

              (
                variantId
                  ? (
                      item.variantId ||
                      "default"
                    ) ===
                    variantId
                  : true
              ) &&

              (
                item.offerId ||
                "normal"
              ) ===
                targetOfferId
          );

        if (
          index === -1
        ) {
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

        /* REMOVE COMPLETE ITEM */

        if (
          quantity <= 1
        ) {
          updated.splice(
            index,
            1
          );

          return updated;
        }

        /* DECREASE */

        updated[
          index
        ] =
          normalizeCartItem(
            item,
            quantity - 1
          );

        return updated;
      }
    );
  };

  /* ===================================================
     DELETE COMPLETE ITEM
  =================================================== */

  const deleteFromCart = (
    id: string,
    variantId?: string,
    offerId?: string
  ) => {
    const targetOfferId =
      offerId ||
      "normal";

    setCart(
      (
        currentCart
      ) =>
        currentCart.filter(
          (
            item
          ) =>
            !(
              item.id ===
                id &&

              (
                variantId
                  ? (
                      item.variantId ||
                      "default"
                    ) ===
                    variantId
                  : true
              ) &&

              (
                item.offerId ||
                "normal"
              ) ===
                targetOfferId
            )
        )
    );
  };

  /* ===================================================
     CLEAR CART
  =================================================== */

  const clearCart = () => {
    setCart([]);

    setCartPopupVisible(
      false
    );

    setCartPopupItem(null);

    if (
      popupTimerRef.current
    ) {
      clearTimeout(
        popupTimerRef.current
      );

      popupTimerRef.current =
        null;
    }
  };

  /* ===================================================
     CHECK ITEM
  =================================================== */

  const isInCart = (
    id: string,
    variantId?: string,
    offerId?: string
  ) => {
    const targetOfferId =
      offerId ||
      "normal";

    return cart.some(
      (
        item
      ) =>
        item.id ===
          id &&

        (
          variantId
            ? (
                item.variantId ||
                "default"
              ) ===
              variantId
            : true
        ) &&

        (
          item.offerId ||
          "normal"
        ) ===
          targetOfferId
    );
  };

  /* ===================================================
     GET ITEM QUANTITY
  =================================================== */

  const getItemQuantity = (
    id: string,
    variantId?: string,
    offerId?: string
  ) => {
    const targetOfferId =
      offerId ||
      "normal";

    const item =
      cart.find(
        (
          cartItem
        ) =>
          cartItem.id ===
            id &&

          (
            variantId
              ? (
                  cartItem.variantId ||
                  "default"
                ) ===
                variantId
              : true
          ) &&

          (
            cartItem.offerId ||
            "normal"
          ) ===
            targetOfferId
      );

    return Number(
      item?.quantity ||
        0
    );
  };

  /* ===================================================
     CART TOTAL
     
     Only PAID quantity is charged.
  =================================================== */

  const cartTotal =
    useMemo(() => {
      return cart.reduce(
        (
          total,
          item
        ) => {
          const price =
            Number(
              item.price ||
                0
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

  /* ===================================================
     OFFER SAVINGS
  =================================================== */

  const offerSavings =
    useMemo(() => {
      return cart.reduce(
        (
          total,
          item
        ) => {
          const saving =
            Number(
              item.offerSaving ||
                0
            );

          return (
            total +
            saving
          );
        },
        0
      );
    }, [cart]);

  /* ===================================================
     CART COUNT
     
     Paid + Free quantity
  =================================================== */

  const cartCount =
    useMemo(() => {
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

  /* ===================================================
     PROVIDER
  =================================================== */

  return (
    <CartContext.Provider
      value={{
        cart,

        cartTotal,

        cartCount,

        offerSavings,

        addToCart,

        removeFromCart,

        deleteFromCart,

        clearCart,

        isInCart,

        getItemQuantity,

        /* POPUP */

        cartPopupVisible,

        cartPopupItem,

        hideCartPopup,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =====================================================
   USE CART
===================================================== */

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