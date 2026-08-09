import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

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
      read: false,
      createdAt: new Date(),
    }
  );
};

export const getNotifications = async () => {
  const snapshot = await getDocs(
    collection(db, "notifications")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const getUserNotifications = async (
  userId: string
) => {
  const all = await getNotifications();

  return all
    .filter(
      (item: any) =>
        !item.userId ||
        item.userId === userId
    )
    .sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : 0;
      const bTime = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : 0;
      return bTime - aTime;
    });
};

export const markNotificationRead = async (
  id: string
) => {
  await updateDoc(
    doc(db, "notifications", id),
    {
      read: true,
      updatedAt: new Date(),
    }
  );
};

export const deleteNotification = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "notifications", id)
  );
};
