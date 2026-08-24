import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  name?: string;
  price?: number;
  mrp?: number;
  image?: string;
  createdAt?: any;
};

export const addWishlist = async (
  data: Omit<WishlistItem, "id">
) => {
  const existingQuery = query(
    collection(db, "wishlist"),
    where("userId", "==", data.userId),
    where("productId", "==", data.productId)
  );

  const existing =
    await getDocs(existingQuery);

  if (!existing.empty) {
    return existing.docs[0];
  }

  return await addDoc(
    collection(db, "wishlist"),
    {
      ...data,
      createdAt: new Date(),
    }
  );
};

export const getWishlist = async (
  userId: string
): Promise<WishlistItem[]> => {
  if (!userId) return [];

  const q = query(
    collection(db, "wishlist"),
    where("userId", "==", userId)
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data(),
    }) as WishlistItem
  );
};

export const deleteWishlist = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "wishlist", id)
  );
};