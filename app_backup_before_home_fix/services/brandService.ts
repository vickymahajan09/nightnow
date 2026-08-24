import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  active: boolean;
  topBrand: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// ==============================
// GET ALL BRANDS
// ==============================

export const getBrands = async (): Promise<Brand[]> => {
  const snapshot = await getDocs(
    collection(db, "brands")
  );

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        id: item.id,
        name: String(data.name || "").trim(),
        logo: String(data.logo || "").trim(),
        active: data.active !== false,
        topBrand: data.topBrand === true,
        ...data,
      } as Brand;
    })
    .filter((brand) => brand.name);
};

// ==============================
// ADD BRAND
// ==============================

export const addBrand = async (
  name: string,
  logo: string = "",
  active: boolean = true,
  topBrand: boolean = false
) => {
  const cleanName = String(name || "").trim();
  const cleanLogo = String(logo || "").trim();

  if (!cleanName) {
    throw new Error("Brand name required");
  }

  const brands = await getBrands();

  const alreadyExists = brands.some(
    (brand) =>
      brand.name.toLowerCase() ===
      cleanName.toLowerCase()
  );

  if (alreadyExists) {
    throw new Error("Brand already exists");
  }

  return await addDoc(
    collection(db, "brands"),
    {
      name: cleanName,
      logo: cleanLogo,
      active,
      topBrand,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
};

// ==============================
// UPDATE BRAND
// ==============================

export const updateBrand = async (
  id: string,
  brand: {
    name: string;
    logo?: string;
    active?: boolean;
    topBrand?: boolean;
  }
) => {
  const cleanName = String(
    brand.name || ""
  ).trim();

  const cleanLogo = String(
    brand.logo || ""
  ).trim();

  if (!cleanName) {
    throw new Error("Brand name required");
  }

  await updateDoc(
    doc(db, "brands", id),
    {
      name: cleanName,
      logo: cleanLogo,
      active: brand.active !== false,
      topBrand: brand.topBrand === true,
      updatedAt: new Date(),
    }
  );
};

// ==============================
// TOGGLE BRAND ACTIVE
// ==============================

export const toggleBrand = async (
  id: string,
  active: boolean
) => {
  await updateDoc(
    doc(db, "brands", id),
    {
      active,
      updatedAt: new Date(),
    }
  );
};

// ==============================
// TOGGLE TOP BRAND
// ==============================

export const toggleTopBrand = async (
  id: string,
  topBrand: boolean
) => {
  await updateDoc(
    doc(db, "brands", id),
    {
      topBrand,
      updatedAt: new Date(),
    }
  );
};

// ==============================
// DELETE BRAND
// ==============================

export const deleteBrand = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "brands", id)
  );
};