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

export const addWishlist = async (data: any) => {
  return await addDoc(collection(db, "wishlist"), data);
};

export const getWishlist = async (email: string) => {
  const q = query(
    collection(db, "wishlist"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const deleteWishlist = async (id: string) => {
  await deleteDoc(doc(db, "wishlist", id));
};