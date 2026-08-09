import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export const getCategories = async () => {
  const snapshot = await getDocs(
    collection(db, "categories")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const addCategory = async (
  name: string,
  icon: string
) => {
  return await addDoc(
    collection(db, "categories"),
    {
      name: name.trim(),
      icon: icon.trim(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
};

export const updateCategory = async (
  id: string,
  name: string,
  icon: string
) => {
  await updateDoc(
    doc(db, "categories", id),
    {
      name: name.trim(),
      icon: icon.trim(),
      updatedAt: new Date(),
    }
  );
};

export const deleteCategory = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "categories", id)
  );
};