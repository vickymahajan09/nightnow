import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export const addReview = async (
  productId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
) => {
  return await addDoc(
    collection(db, "reviews"),
    {
      productId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date(),
    }
  );
};

export const getProductReviews = async (
  productId: string
) => {
  const reviewQuery = query(
    collection(db, "reviews"),
    where("productId", "==", productId)
  );

  const snapshot = await getDocs(reviewQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const deleteReview = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "reviews", id)
  );
};
export const getAllReviews = async () => {
  const snapshot = await getDocs(
    collection(db, "reviews")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};