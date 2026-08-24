import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  active?: boolean;
  [key: string]: any;
}

export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Category[];
};

export const addCategory = async (name: string, icon = "", image = "") =>
  addDoc(collection(db, "categories"), {
    name: name.trim(),
    icon: icon.trim(),
    image: image.trim(),
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

export const updateCategory = async (id: string, name: string, icon = "", image = "") => {
  await updateDoc(doc(db, "categories", id), {
    name: name.trim(),
    icon: icon.trim(),
    image: image.trim(),
    updatedAt: new Date(),
  });
};

export const deleteCategory = async (id: string) => deleteDoc(doc(db, "categories", id));
