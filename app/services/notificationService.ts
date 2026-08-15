import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";

// ==========================================
// CREATE NOTIFICATION
// ==========================================

export const addNotification = async (
  title: string,
  message: string,
  userId?: string,
  orderId?: string
) => {
  return await addDoc(
    collection(db, "notifications"),
    {
      title: title.trim(),
      message: message.trim(),
      userId: userId || null,
      orderId: orderId || "",
      audience: userId
        ? "customer"
        : "admin",
      type: "general",
      read: false,
      createdAt: new Date(),
    }
  );
};

// ==========================================
// GET ALL
// ==========================================

export const getNotifications =
  async () => {
    const snapshot =
      await getDocs(
        collection(
          db,
          "notifications"
        )
      );

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort(
        (a: any, b: any) =>
          getTime(b.createdAt) -
          getTime(a.createdAt)
      );
  };

// ==========================================
// CUSTOMER
// ==========================================

export const getUserNotifications =
  async (
    userId: string
  ) => {
    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "audience",
            "!=",
            "admin"
          )
        )
      );

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter(
        (item: any) =>
          !item.userId ||
          item.userId === userId
      )
      .sort(
        (a: any, b: any) =>
          getTime(b.createdAt) -
          getTime(a.createdAt)
      );
  };

// ==========================================
// ADMIN
// ==========================================

export const getAdminNotifications =
  async () => {
    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "audience",
            "==",
            "admin"
          )
        )
      );

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort(
        (a: any, b: any) =>
          getTime(b.createdAt) -
          getTime(a.createdAt)
      );
  };

// ==========================================
// ADMIN REAL-TIME
// ==========================================

export const subscribeToAdminNotifications =
  (
    callback: (
      notifications: any[]
    ) => void
  ) => {
    const notificationsQuery =
      query(
        collection(
          db,
          "notifications"
        ),
        where(
          "audience",
          "==",
          "admin"
        )
      );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const data =
          snapshot.docs
            .map((item) => ({
              id: item.id,
              ...item.data(),
            }))
            .sort(
              (
                a: any,
                b: any
              ) =>
                getTime(
                  b.createdAt
                ) -
                getTime(
                  a.createdAt
                )
            );

        callback(data);
      },
      (error) => {
        console.error(
          "ADMIN NOTIFICATION ERROR:",
          error
        );

        callback([]);
      }
    );
  };

// ==========================================
// MARK READ
// ==========================================

export const markNotificationRead =
  async (
    id: string
  ) => {
    await updateDoc(
      doc(
        db,
        "notifications",
        id
      ),
      {
        read: true,
        updatedAt:
          new Date(),
      }
    );
  };

// ==========================================
// DELETE
// ==========================================

export const deleteNotification =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        "notifications",
        id
      )
    );
  };

// ==========================================
// DATE HELPER
// ==========================================

function getTime(
  value: any
): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toDate ===
    "function"
  ) {
    return value
      .toDate()
      .getTime();
  }

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}