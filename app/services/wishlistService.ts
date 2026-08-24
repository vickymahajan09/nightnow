import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

const getUserId = () => {
  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "Please login first."
    );
  }

  return uid;
};

const wishlistCollection = () =>
  collection(
    db,
    "users",
    getUserId(),
    "wishlist"
  );

export const getWishlist =
  async () => {
    const snapshot =
      await getDocs(
        wishlistCollection()
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      })
    );
  };

export const isInWishlist =
  async (
    productId: string
  ) => {
    if (!productId) {
      return false;
    }

    const snapshot =
      await getDocs(
        wishlistCollection()
      );

    return snapshot.docs.some(
      (item) =>
        item.id === productId
    );
  };

export const addToWishlist =
  async (
    productId: string,
    product: any = {}
  ) => {
    if (!productId) {
      throw new Error(
        "Product ID is required."
      );
    }

    await setDoc(
      doc(
        db,
        "users",
        getUserId(),
        "wishlist",
        productId
      ),
      {
        productId,

        productName:
          product.productName ||
          product.name ||
          "",

        image:
          product.image ||
          product.images?.[0] ||
          "",

        price:
          Number(
            product.price || 0
          ),

        mrp:
          Number(
            product.mrp || 0
          ),

        variantId:
          product.variantId ||
          "",

        variantName:
          product.variantName ||
          "",

        addedAt:
          new Date(),

        updatedAt:
          new Date(),
      },
      {
        merge: true,
      }
    );
  };

export const removeFromWishlist =
  async (
    productId: string
  ) => {
    if (!productId) {
      return;
    }

    await deleteDoc(
      doc(
        db,
        "users",
        getUserId(),
        "wishlist",
        productId
      )
    );
  };

export const toggleWishlist =
  async (
    productId: string,
    product: any = {}
  ) => {
    const exists =
      await isInWishlist(
        productId
      );

    if (exists) {
      await removeFromWishlist(
        productId
      );

      return false;
    }

    await addToWishlist(
      productId,
      product
    );

    return true;
  };