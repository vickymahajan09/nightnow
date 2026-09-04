"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/wishlistService";

type WishlistContextValue = {
  ids: Set<string>;
  loading: boolean;
  isWished: (productId: string) => boolean;
  // Returns the NEW wished state (true = now in wishlist).
  // Throws if the user isn't logged in — callers should catch
  // and show a "please log in" message.
  toggle: (productId: string, product?: any) => Promise<boolean>;
  removeLocally: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load (or clear) the wishlist whenever auth state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIds(new Set());
        return;
      }

      try {
        setLoading(true);
        const items = await getWishlist();
        setIds(new Set(items.map((item: any) => String(item.id))));
      } catch (error) {
        console.error("Wishlist load error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isWished = (productId: string) => ids.has(productId);

  const toggle = async (productId: string, product: any = {}) => {
    if (!productId) return false;

    if (!auth.currentUser) {
      throw new Error("Please log in to use the wishlist.");
    }

    const wasWished = ids.has(productId);

    // Optimistic update so the heart flips instantly.
    setIds((prev) => {
      const next = new Set(prev);
      if (wasWished) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      if (wasWished) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId, product);
      }
      return !wasWished;
    } catch (error) {
      // Revert on failure so the UI never lies about the real state.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWished) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
      throw error;
    }
  };

  const removeLocally = (productId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const value = useMemo(
    () => ({ ids, loading, isWished, toggle, removeLocally }),
    [ids, loading]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
