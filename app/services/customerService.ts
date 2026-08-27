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

const PROFILE_CACHE_TTL =
  15_000;

let profileCache:
  | {
      uid: string;
      data: CustomerProfile;
      expiresAt: number;
    }
  | null = null;

let profileRequest:
  | Promise<CustomerProfile | null>
  | null = null;

const clearCustomerProfileCache =
  () => {
    profileCache = null;
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
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<
    CustomerProfile | null
  > => {
    const uid =
      requireUserId();

    const forceRefresh =
      options?.forceRefresh ===
      true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      profileCache &&
      profileCache.uid === uid &&
      profileCache.expiresAt >
        now
    ) {
      return profileCache.data;
    }

    if (
      !forceRefresh &&
      profileRequest
    ) {
      return profileRequest;
    }

    const request =
      (async () => {
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

        const profile =
          {
            uid,
            ...snapshot.data(),
          } as CustomerProfile;

        profileCache = {
          uid,
          data: profile,
          expiresAt:
            Date.now() +
            PROFILE_CACHE_TTL,
        };

        return profile;
      })();

    profileRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        profileRequest ===
        request
      ) {
        profileRequest = null;
      }
    }
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

    clearCustomerProfileCache();
  };

export const updateCustomerName =
  async (
    name: string
  ) => {
    await updateCustomerProfile({
      name:
        name.trim(),
    });
  };

export const updateCustomerPhone =
  async (
    phone: string
  ) => {
    await updateCustomerProfile({
      phone:
        phone.trim(),
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