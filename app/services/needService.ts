import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type Need = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  keywords: string[];
  brandIds: string[];
  productIds: string[];
  active: boolean;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
};

const needsRef = collection(db, "needs");

const normalize = (data: any, id: string): Need => ({
  id,
  icon: String(data.icon || "✨"),
  title: String(data.title || ""),
  description: String(data.description || ""),
  keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
  brandIds: Array.isArray(data.brandIds) ? data.brandIds.map(String) : [],
  productIds: Array.isArray(data.productIds) ? data.productIds.map(String) : [],
  active: data.active !== false,
  sortOrder: Number(data.sortOrder || 0),
  ...data,
});

export const getNeeds = async (): Promise<Need[]> => {
  const snapshot = await getDocs(needsRef);
  return snapshot.docs
    .map((item) => normalize(item.data(), item.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

const cleanNeed = (data: {
  icon: string;
  title: string;
  description?: string;
  keywords?: string[];
  brandIds?: string[];
  productIds?: string[];
  active?: boolean;
  sortOrder?: number;
}) => {
  const title = data.title.trim();
  if (!title) throw new Error("Need title is required");

  return {
    icon: data.icon.trim() || "✨",
    title,
    description: String(data.description || "").trim(),
    keywords: Array.from(new Set((data.keywords || []).map((x) => x.trim()).filter(Boolean))),
    brandIds: Array.from(new Set(data.brandIds || [])),
    productIds: Array.from(new Set(data.productIds || [])),
    active: data.active !== false,
    sortOrder: Number(data.sortOrder || 0),
    updatedAt: new Date(),
  };
};

export const addNeed = async (data: Parameters<typeof cleanNeed>[0]) => {
  return addDoc(needsRef, {
    ...cleanNeed(data),
    createdAt: new Date(),
  });
};

export const updateNeed = async (
  id: string,
  data: Parameters<typeof cleanNeed>[0]
) => {
  await updateDoc(doc(db, "needs", id), cleanNeed(data));
};

export const toggleNeed = async (id: string, active: boolean) => {
  await updateDoc(doc(db, "needs", id), {
    active,
    updatedAt: new Date(),
  });
};

export const deleteNeed = async (id: string) => {
  await deleteDoc(doc(db, "needs", id));
};