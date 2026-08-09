import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

// ==============================
// ADD PRODUCT
// ==============================

export const addProduct = async (product: any) => {
  return await addDoc(collection(db, "products"), {
    ...product,
    name: product.name?.trim() || "",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    active: product.active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

// ==============================
// GET ALL PRODUCTS
// ==============================

export const getProducts = async () => {
  const snapshot = await getDocs(collection(db, "products"));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

// ==============================
// GET SINGLE PRODUCT
// ==============================

export const getProductById = async (id: string) => {
  const productRef = doc(db, "products", id);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

// ==============================
// UPDATE PRODUCT STOCK
// checkout/page.tsx sends the NEW stock value.
// Example: 20 - 3 = 17, so this saves 17.
// ==============================

export const updateProductStock = async (
  id: string,
  newStock: number
) => {
  const safeStock = Math.max(0, Number(newStock || 0));

  const productRef = doc(db, "products", id);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("Product not found");
  }

  await updateDoc(productRef, {
    stock: safeStock,
    updatedAt: new Date(),
  });

  return safeStock;
};

// ==============================
// UPDATE PRODUCT
// ==============================

export const updateProduct = async (
  id: string,
  product: any
) => {
  const productRef = doc(db, "products", id);

  const updateData = {
    ...product,

    ...(product.name !== undefined && {
      name: String(product.name).trim(),
    }),

    ...(product.price !== undefined && {
      price: Number(product.price || 0),
    }),

    ...(product.stock !== undefined && {
      stock: Math.max(0, Number(product.stock || 0)),
    }),

    updatedAt: new Date(),
  };

  await updateDoc(productRef, updateData);

  return {
    id,
    ...updateData,
  };
};

// ==============================
// TOGGLE PRODUCT ACTIVE STATUS
// ==============================

export const toggleProduct = async (
  id: string,
  active: boolean
) => {
  await updateDoc(doc(db, "products", id), {
    active: Boolean(active),
    updatedAt: new Date(),
  });
};

// ==============================
// DELETE PRODUCT
// ==============================

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, "products", id));
};