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

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  category?: string;
  image?: string;
  description?: string;
  [key: string]: any;
}

// ==============================
// ADD PRODUCT
// ==============================

export const addProduct = async (
  product: any
) => {
  return await addDoc(
    collection(db, "products"),
    {
      ...product,

      name: String(
        product.name || ""
      ).trim(),

      price: Number(
        product.price || 0
      ),

      stock: Number(
        product.stock || 0
      ),

      active:
        product.active !== false,

      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
};

// ==============================
// GET ALL PRODUCTS
// ==============================

export const getProducts =
  async (): Promise<Product[]> => {
    const snapshot =
      await getDocs(
        collection(db, "products")
      );

    return snapshot.docs.map(
      (item) => {
        const data =
          item.data();

        return {
          id: item.id,

          name: String(
            data.name || ""
          ),

          price: Number(
            data.price || 0
          ),

          stock: Number(
            data.stock || 0
          ),

          active:
            data.active !== false,

          ...data,
        } as Product;
      }
    );
  };

// ==============================
// GET SINGLE PRODUCT
// ==============================

export const getProductById =
  async (
    id: string
  ): Promise<Product | null> => {
    const productRef =
      doc(
        db,
        "products",
        id
      );

    const snapshot =
      await getDoc(
        productRef
      );

    if (!snapshot.exists()) {
      return null;
    }

    const data =
      snapshot.data();

    return {
      id: snapshot.id,

      name: String(
        data.name || ""
      ),

      price: Number(
        data.price || 0
      ),

      stock: Number(
        data.stock || 0
      ),

      active:
        data.active !== false,

      ...data,
    } as Product;
  };

// ==============================
// UPDATE PRODUCT
// ==============================

export const updateProduct =
  async (
    id: string,
    product: any
  ) => {
    await updateDoc(
      doc(
        db,
        "products",
        id
      ),
      {
        ...product,

        updatedAt: new Date(),
      }
    );
  };

// ==============================
// UPDATE PRODUCT STOCK
// ==============================

export const updateProductStock =
  async (
    id: string,
    newStock: number
  ) => {
    const safeStock =
      Math.max(
        0,
        Number(newStock || 0)
      );

    await updateDoc(
      doc(
        db,
        "products",
        id
      ),
      {
        stock: safeStock,
        updatedAt: new Date(),
      }
    );

    return safeStock;
  };

// ==============================
// VALIDATE LIVE STOCK
// ==============================

export const validateProductStock = async (
  id: string,
  quantity: number
) => {
  const product = await getProductById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  const qty = Number(quantity || 0);

  if (qty <= 0) {
    throw new Error("Invalid quantity");
  }

  if (product.active === false) {
    throw new Error(`${product.name} is currently unavailable`);
  }

  const stock = Number(product.stock || 0);

  if (stock < qty) {
    throw new Error(
      `${product.name} has only ${stock} item(s) in stock`
    );
  }

  return {
    product,
    stock,
    remainingStock: stock - qty,
  };
};

// ==============================
// DECREASE STOCK BY QUANTITY
// ==============================

export const decreaseProductStock =
  async (
    id: string,
    quantity: number
  ) => {
    const product =
      await getProductById(
        id
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    const currentStock =
      Number(
        product.stock || 0
      );

    const qty =
      Number(
        quantity || 0
      );

    if (qty <= 0) {
      throw new Error(
        "Invalid quantity"
      );
    }

    if (
      currentStock < qty
    ) {
      throw new Error(
        `Insufficient stock for ${product.name}`
      );
    }

    const newStock =
      currentStock - qty;

    await updateProductStock(
      id,
      newStock
    );

    return newStock;
  };

// ==============================
// DELETE PRODUCT
// ==============================

export const deleteProduct =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );
  };