import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type Buy1Get2Offer = {
  id: string;
  title: string;
  description?: string;
  brandIds: string[];
  productIds: string[];
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const offersRef = collection(db, "buy1get2Offers");

const normalize = (data: any, id: string): Buy1Get2Offer => ({
  id,
  title: String(data.title || "Buy 1 Get 2"),
  description: String(data.description || ""),
  brandIds: Array.isArray(data.brandIds) ? data.brandIds.map(String) : [],
  productIds: Array.isArray(data.productIds) ? data.productIds.map(String) : [],
  active: data.active !== false,
  ...data,
});

export const getBuy1Get2Offers = async (): Promise<Buy1Get2Offer[]> => {
  const snapshot = await getDocs(offersRef);
  return snapshot.docs.map((item) => normalize(item.data(), item.id));
};

export const addBuy1Get2Offer = async (data: {
  title: string;
  description?: string;
  brandIds?: string[];
  productIds?: string[];
  active?: boolean;
}) => {
  const title = data.title.trim();
  if (!title) throw new Error("Offer title is required");

  return addDoc(offersRef, {
    title,
    description: String(data.description || "").trim(),
    brandIds: Array.from(new Set(data.brandIds || [])),
    productIds: Array.from(new Set(data.productIds || [])),
    active: data.active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateBuy1Get2Offer = async (
  id: string,
  data: {
    title: string;
    description?: string;
    brandIds?: string[];
    productIds?: string[];
    active?: boolean;
  }
) => {
  const title = data.title.trim();
  if (!title) throw new Error("Offer title is required");

  await updateDoc(doc(db, "buy1get2Offers", id), {
    title,
    description: String(data.description || "").trim(),
    brandIds: Array.from(new Set(data.brandIds || [])),
    productIds: Array.from(new Set(data.productIds || [])),
    active: data.active !== false,
    updatedAt: new Date(),
  });
};

export const toggleBuy1Get2Offer = async (id: string, active: boolean) => {
  await updateDoc(doc(db, "buy1get2Offers", id), {
    active,
    updatedAt: new Date(),
  });
};

export const deleteBuy1Get2Offer = async (id: string) => {
  await deleteDoc(doc(db, "buy1get2Offers", id));
};
