import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

export type Address = {
  id?: string;

  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;

  label?: string;
  isDefault?: boolean;

  createdAt?: any;
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

const getAddressCollection = () => {
  const uid =
    requireUserId();

  return collection(
    db,
    "users",
    uid,
    "addresses"
  );
};

export const getAddresses =
  async (): Promise<Address[]> => {
    const snapshot =
      await getDocs(
        getAddressCollection()
      );

    const addresses =
      snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as Address
      );

    addresses.sort(
      (a, b) => {
        if (
          a.isDefault &&
          !b.isDefault
        ) {
          return -1;
        }

        if (
          !a.isDefault &&
          b.isDefault
        ) {
          return 1;
        }

        return 0;
      }
    );

    return addresses;
  };

export const addAddress =
  async (
    address: Omit<
      Address,
      "id" | "createdAt" | "updatedAt"
    >
  ) => {
    const uid =
      requireUserId();

    const existing =
      await getAddresses();

    const shouldBeDefault =
      Boolean(
        address.isDefault ||
        existing.length === 0
      );

    if (shouldBeDefault) {
      await Promise.all(
        existing
          .filter(
            (item) =>
              item.id &&
              item.isDefault
          )
          .map(
            (item) =>
              updateDoc(
                doc(
                  db,
                  "users",
                  uid,
                  "addresses",
                  item.id!
                ),
                {
                  isDefault: false,
                  updatedAt:
                    new Date(),
                }
              )
          )
      );
    }

    const ref =
      await addDoc(
        getAddressCollection(),
        {
          ...address,
          isDefault:
            shouldBeDefault,
          createdAt:
            new Date(),
          updatedAt:
            new Date(),
        }
      );

    return ref.id;
  };

export const updateAddress =
  async (
    id: string,
    address: Partial<Address>
  ) => {
    const uid =
      requireUserId();

    if (!id) {
      throw new Error(
        "Address ID is required."
      );
    }

    if (address.isDefault) {
      const existing =
        await getAddresses();

      await Promise.all(
        existing
          .filter(
            (item) =>
              item.id &&
              item.id !== id &&
              item.isDefault
          )
          .map(
            (item) =>
              updateDoc(
                doc(
                  db,
                  "users",
                  uid,
                  "addresses",
                  item.id!
                ),
                {
                  isDefault: false,
                  updatedAt:
                    new Date(),
                }
              )
          )
      );
    }

    await updateDoc(
      doc(
        db,
        "users",
        uid,
        "addresses",
        id
      ),
      {
        ...address,
        updatedAt:
          new Date(),
      }
    );
  };

export const deleteAddress =
  async (
    id: string
  ) => {
    const uid =
      requireUserId();

    if (!id) {
      return;
    }

    await deleteDoc(
      doc(
        db,
        "users",
        uid,
        "addresses",
        id
      )
    );
  };

export const setDefaultAddress =
  async (
    id: string
  ) => {
    const uid =
      requireUserId();

    if (!id) {
      throw new Error(
        "Address ID is required."
      );
    }

    const existing =
      await getAddresses();

    await Promise.all(
      existing
        .filter(
          (item) =>
            item.id &&
            item.id !== id &&
            item.isDefault
        )
        .map(
          (item) =>
            updateDoc(
              doc(
                db,
                "users",
                uid,
                "addresses",
                item.id!
              ),
              {
                isDefault: false,
                updatedAt:
                  new Date(),
              }
            )
        )
    );

    await updateDoc(
      doc(
        db,
        "users",
        uid,
        "addresses",
        id
      ),
      {
        isDefault: true,
        updatedAt:
          new Date(),
      }
    );
  };