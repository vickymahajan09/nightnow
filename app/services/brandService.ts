import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type Brand = {
  id: string;
  name: string;
  logo?: string;
  active: boolean;
  topBrand: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const brandsRef = collection(db, "brands");

export const getBrands = async (): Promise<Brand[]> => {
  const snapshot = await getDocs(brandsRef);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      name: data.name || data.brandName || "",
      logo: data.logo || data.image || "",
      active:
        data.active !== undefined
          ? Boolean(data.active)
          : data.isActive !== undefined
          ? Boolean(data.isActive)
          : true,
      topBrand:
        data.topBrand !== undefined
          ? Boolean(data.topBrand)
          : data.isTopBrand !== undefined
          ? Boolean(data.isTopBrand)
          : false,
      ...data,
    };
  });
};

export const addBrand = async (
  name: string,
  logo: string,
  active: boolean,
  topBrand: boolean
) => {
  return await addDoc(brandsRef, {
    name: name.trim(),
    logo: logo.trim(),
    active,
    topBrand,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateBrand = async (
  id: string,
  data: {
    name: string;
    logo: string;
    active: boolean;
    topBrand: boolean;
  }
) => {
  await updateDoc(doc(db, "brands", id), {
    name: data.name.trim(),
    logo: data.logo.trim(),
    active: data.active,
    topBrand: data.topBrand,
    updatedAt: new Date(),
  });
};

export const deleteBrand = async (id: string) => {
  await deleteDoc(doc(db, "brands", id));
};

export const toggleBrand = async (
  id: string,
  active: boolean
) => {
  await updateDoc(doc(db, "brands", id), {
    active,
    updatedAt: new Date(),
  });
};

export const toggleTopBrand = async (
  id: string,
  topBrand: boolean
) => {
  await updateDoc(doc(db, "brands", id), {
    topBrand,
    updatedAt: new Date(),
  });
};