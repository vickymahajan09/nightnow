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
      const saved = localStorage.getItem("nightnow-cart");

      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "nightnow-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id
      );

      const addQuantity = Number(
        product.quantity || 1
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 1) +
                  addQuantity,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: addQuantity,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 1) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.quantity || 0) > 0
        )
    );
  };

  const deleteFromCart = (id: string) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 1),
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 1),
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
  return useContext(CartContext);
};