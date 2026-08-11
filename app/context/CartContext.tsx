"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext<any>(null);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("nightnow-cart");

      if (saved) {
        const parsed = JSON.parse(saved);

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
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "nightnow-cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Cart saving failed:",
        error
      );
    }
  }, [cart]);

  // ==============================
  // ADD TO CART
  // ==============================

  const addToCart = (product: any) => {
    const stock = Number(
      product.stock || 0
    );

    if (stock <= 0) {
      alert("Product is out of stock");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id
      );

      const addQuantity = Math.max(
        1,
        Number(product.quantity || 1)
      );

      // Existing product
      if (existing) {
        const currentQuantity =
          Number(
            existing.quantity || 0
          );

        const newQuantity =
          currentQuantity +
          addQuantity;

        if (newQuantity > stock) {
          alert(
            `Only ${stock} item${
              stock > 1 ? "s" : ""
            } available in stock.`
          );

          return prev;
        }

        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                stock: stock,
              }
            : item
        );
      }

      // New product
      if (addQuantity > stock) {
        alert(
          `Only ${stock} item${
            stock > 1 ? "s" : ""
          } available in stock.`
        );

        return prev;
      }

      return [
        ...prev,
        {
          ...product,
          quantity: addQuantity,
          stock: stock,
        },
      ];
    });
  };

  // ==============================
  // REMOVE ONE
  // ==============================

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  Number(
                    item.quantity || 1
                  ) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(
              item.quantity || 0
            ) > 0
        )
    );
  };

  // ==============================
  // DELETE PRODUCT
  // ==============================

  const deleteFromCart = (
    id: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  // ==============================
  // CLEAR CART
  // ==============================

  const clearCart = () => {
    setCart([]);
  };

  // ==============================
  // CART COUNT
  // ==============================

  const cartCount = cart.reduce(
    (sum, item) =>
      sum +
      Number(
        item.quantity || 1
      ),
    0
  );

  // ==============================
  // CART TOTAL
  // ==============================

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(
          item.quantity || 1
        ),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(
    CartContext
  );
};