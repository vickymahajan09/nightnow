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

  [key: string]: any;
};

type CartContextType = {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;

  addToCart: (item: CartItem) => void;

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
  createContext<CartContextType | undefined>(
    undefined
  );

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

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  // ==========================================
  // LOAD CART
  // ==========================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setCart(parsed);
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

  // ==========================================
  // SAVE CART
  // ==========================================

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
  }, [cart, loaded]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = (
    item: CartItem
  ) => {
    if (!item?.id) {
      console.warn(
        "Product ID missing"
      );
      return;
    }

    setCart((currentCart) => {
      const itemKey =
        getItemKey(item);

      const existingIndex =
        currentCart.findIndex(
          (cartItem) =>
            getItemKey(cartItem) ===
            itemKey
        );

      // NEW ITEM
      if (existingIndex === -1) {
        const stock =
          Number(item.stock || 0);

        const quantity =
          Math.max(
            1,
            Number(item.quantity || 1)
          );

        return [
          ...currentCart,
          {
            ...item,
            quantity:
              stock > 0
                ? Math.min(
                    quantity,
                    stock
                  )
                : quantity,
          },
        ];
      }

      // EXISTING ITEM
      const updated = [
        ...currentCart,
      ];

      const existing =
        updated[existingIndex];

      const currentQuantity =
        Number(
          existing.quantity || 1
        );

      const stock =
        Number(
          existing.stock || 0
        );

      if (
        stock > 0 &&
        currentQuantity >= stock
      ) {
        return currentCart;
      }

      updated[existingIndex] = {
        ...existing,
        quantity:
          currentQuantity + 1,
      };

      return updated;
    });
  };

  // ==========================================
  // REMOVE ONE
  // ==========================================

  const removeFromCart = (
    id: string,
    variantId?: string
  ) => {
    setCart((currentCart) => {
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
          item.quantity || 1
        );

      // Quantity 1 -> remove item
      if (quantity <= 1) {
        updated.splice(
          index,
          1
        );

        return updated;
      }

      updated[index] = {
        ...item,
        quantity:
          quantity - 1,
      };

      return updated;
    });
  };

  // ==========================================
  // DELETE COMPLETE ITEM
  // ==========================================

  const deleteFromCart = (
    id: string,
    variantId?: string
  ) => {
    setCart((currentCart) =>
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

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCart = () => {
    setCart([]);
  };

  // ==========================================
  // CHECK ITEM
  // ==========================================

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

  // ==========================================
  // GET QUANTITY
  // ==========================================

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

  // ==========================================
  // CART TOTAL
  // ==========================================

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        const price =
          Number(
            item.price || 0
          );

        const quantity =
          Number(
            item.quantity || 1
          );

        return (
          total +
          price * quantity
        );
      },
      0
    );
  }, [cart]);

  // ==========================================
  // CART COUNT
  // ==========================================

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );
  }, [cart]);

  // ==========================================
  // PROVIDER
  // ==========================================

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

// ==========================================
// USE CART
// ==========================================

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}