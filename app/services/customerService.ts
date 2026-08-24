import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

export type CustomerProfile = {
  uid: string;

  name?: string;
  email?: string;
  phone?: string;
  photoURL?: string;

  provider?: string;

  gstNumber?: string;
  companyName?: string;

  updatedAt?: any;
};

const requireUserId = () => {
  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    throw new Error(
      "Please login first."
    );
  }

  return uid;
};

export const getCustomerProfile =
  async (): Promise<
    CustomerProfile | null
  > => {
    const uid =
      requireUserId();

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );

    if (
      !snapshot.exists()
    ) {
      return null;
    }

    return {
      uid,
      ...snapshot.data(),
    } as CustomerProfile;
  };

export const updateCustomerProfile =
  async (
    data: Partial<CustomerProfile>
  ) => {
    const uid =
      requireUserId();

    await setDoc(
      doc(
        db,
        "users",
        uid
      ),
      {
        ...data,
        uid,
        updatedAt:
          new Date(),
      },
      {
        merge: true,
      }
    );
  };

export const updateCustomerName =
  async (
    name: string
  ) => {
    await updateCustomerProfile({
      name: name.trim(),
    });
  };

export const updateCustomerPhone =
  async (
    phone: string
  ) => {
    await updateCustomerProfile({
      phone: phone.trim(),
    });
  };

export const updateGSTDetails =
  async (
    gstNumber: string,
    companyName: string
  ) => {
    await updateCustomerProfile({
      gstNumber:
        gstNumber
          .trim()
          .toUpperCase(),

      companyName:
        companyName.trim(),
    });
  };

export const clearGSTDetails =
  async () => {
    await updateCustomerProfile({
      gstNumber: "",
      companyName: "",
    });
  };