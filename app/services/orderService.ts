import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../lib/firebase";

// =====================================================
// CUSTOMER NOTIFICATION
// =====================================================

const createOrderNotification = async (
  order: any,
  title: string,
  message: string,
  status: string
) => {
  try {
    const userId =
      order?.userId ||
      order?.customer?.uid ||
      order?.customer?.userId ||
      "";

    if (!userId) {
      console.warn(
        "No userId found for customer notification"
      );
      return;
    }

    await addDoc(
      collection(db, "notifications"),
      {
        userId,
        orderId:
          order?.orderId ||
          order?.id ||
          "",
        type: "order",
        title,
        message,
        status,
        read: false,
        createdAt: new Date(),
      }
    );
  } catch (error) {
    console.error(
      "Notification creation failed:",
      error
    );
  }
};

// =====================================================
// ADD ORDER
// =====================================================

export const addOrder = async (order: any) => {
  const orderData = {
    ...order,
    status: "Pending",
    createdAt:
      order?.createdAt || new Date(),
  };

  const orderRef = await addDoc(
    collection(db, "orders"),
    orderData
  );

  // ADMIN NOTIFICATION
  try {
    await addDoc(
      collection(db, "notifications"),
      {
        audience: "admin",
        type: "new-order",
        title: "New Order Received 🔔",
        message:
          `New order #${orderRef.id.slice(
            0,
            8
          )} received from ${
            orderData?.customer?.name ||
            "Customer"
          } for ₹${Number(
            orderData?.total || 0
          )}.`,
        orderId: orderRef.id,
        userId:
          orderData?.userId || "",
        customer:
          orderData?.customer || {},
        read: false,
        createdAt: new Date(),
      }
    );
  } catch (error) {
    console.error(
      "Admin notification creation failed:",
      error
    );
  }

  // CUSTOMER CONFIRMATION
  await createOrderNotification(
    {
      ...orderData,
      id: orderRef.id,
    },
    "Order Confirmed 🎉",
    `Your order #${orderRef.id.slice(
      0,
      8
    )} has been placed successfully. We will start processing it shortly.`,
    "Pending"
  );

  return orderRef;
};

// =====================================================
// GET ALL ORDERS
// =====================================================

export const getOrders = async () => {
  const snapshot = await getDocs(
    collection(db, "orders")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

// =====================================================
// REAL-TIME ORDERS
// =====================================================

export const subscribeToOrders = (
  callback: (orders: any[]) => void
) => {
  const ordersRef =
    collection(db, "orders");

  const ordersQuery = query(
    ordersRef,
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders =
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

      callback(orders);
    },
    (error) => {
      console.error(
        "Orders subscription error:",
        error
      );

      callback([]);
    }
  );

  return unsubscribe;
};

// =====================================================
// GET ORDER BY ID
// =====================================================

export const getOrderById = async (
  id: string
) => {
  const orderRef = doc(
    db,
    "orders",
    id
  );

  const orderSnapshot =
    await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    return null;
  }

  return {
    id: orderSnapshot.id,
    ...orderSnapshot.data(),
  };
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

export const updateOrderStatus = async (
  id: string,
  status: string
) => {
  const orderRef = doc(
    db,
    "orders",
    id
  );

  const orderSnapshot =
    await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    throw new Error(
      "Order not found"
    );
  }

  const existingOrder = {
    id: orderSnapshot.id,
    ...orderSnapshot.data(),
  };

  await updateDoc(
    orderRef,
    {
      status,
      updatedAt: new Date(),
    }
  );

  // PACKED / CONFIRMED
  if (
    status === "Packed" ||
    status === "Confirmed"
  ) {
    await createOrderNotification(
      existingOrder,
      "Order Packed 📦",
      `Your order #${id.slice(
        0,
        8
      )} has been accepted and packed. It will be dispatched soon.`,
      "Packed"
    );
  }

  // OUT FOR DELIVERY
  else if (
    status === "Out for Delivery"
  ) {
    await createOrderNotification(
      existingOrder,
      "Out for Delivery 🚚",
      `Your order #${id.slice(
        0,
        8
      )} is out for delivery. It will reach you soon.`,
      "Out for Delivery"
    );
  }

  // DELIVERED
  else if (
    status === "Delivered"
  ) {
    await createOrderNotification(
      existingOrder,
      "Order Delivered ✅",
      `Your order #${id.slice(
        0,
        8
      )} has been delivered successfully. Thank you for shopping with Night Now!`,
      "Delivered"
    );
  }

  // CANCELLED
  else if (
    status === "Cancelled"
  ) {
    await createOrderNotification(
      existingOrder,
      "Order Cancelled ❌",
      `Your order #${id.slice(
        0,
        8
      )} has been cancelled.`,
      "Cancelled"
    );
  }

  return true;
};

// =====================================================
// DELETE ORDER
// =====================================================

export const deleteOrder = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "orders", id)
  );

  return true;
};