import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export const addOrder = async (order: any) => {
  return await addDoc(collection(db, "orders"), {
    ...order,
    status: order.status || "Pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const getOrders = async () => {
  const snapshot = await getDocs(collection(db, "orders"));

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort((a: any, b: any) => {
      const at = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : 0;
      const bt = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : 0;
      return bt - at;
    });
};

export const getMyOrders = async (userId: string) => {
  if (!userId) return [];

  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort((a: any, b: any) => {
      const at = a.createdAt?.toDate
        ? a.createdAt.toDate().getTime()
        : 0;
      const bt = b.createdAt?.toDate
        ? b.createdAt.toDate().getTime()
        : 0;
      return bt - at;
    });
};

export const getOrderById = async (id: string) => {
  if (!id) return null;

  const snapshot = await getDoc(
    doc(db, "orders", id)
  );

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const updateOrderStatus = async (
  id: string,
  status: string
) => {
  const allowed = [
    "Pending",
    "Confirmed",
    "Processing",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  if (!allowed.includes(status)) {
    throw new Error("Invalid order status");
  }

  const order = await getOrderById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  await updateDoc(doc(db, "orders", id), {
    status,
    updatedAt: new Date(),
  });

  const data: any = order;

  if (data.userId) {
    await addDoc(collection(db, "notifications"), {
      title: `Order ${status}`,
      message: `Your Night Now order #${id.slice(
        0,
        8
      )} is now ${status}.`,
      userId: data.userId,
      orderId: id,
      read: false,
      createdAt: new Date(),
    }).catch((error) => {
      console.error(
        "Notification creation failed:",
        error
      );
    });
  }
};

export const deleteOrder = async (id: string) => {
  await deleteDoc(doc(db, "orders", id));
};
