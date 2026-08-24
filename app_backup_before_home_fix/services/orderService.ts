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
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../lib/firebase";

// =====================================================
// ADMIN CHECK
// =====================================================

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

const isAdminUser = () => {
  const user = auth.currentUser;

  return (
    !!user &&
    user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  );
};

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

export const addOrder = async (
  order: any
) => {
  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    throw new Error(
      "Please login before placing an order."
    );
  }

  // IMPORTANT:
  // Never trust userId coming from frontend order object.
  // Always use Firebase Auth UID.
  const userId =
    currentUser.uid;

  const existingCustomer =
    order?.customer || {};

  const customer = {
    ...existingCustomer,
    uid: userId,
    userId,
    name:
      existingCustomer?.name ||
      currentUser.displayName ||
      "Customer",
    phone:
      existingCustomer?.phone ||
      currentUser.phoneNumber ||
      "",
  };

  const orderData = {
    ...order,

    // FORCE authenticated customer UID
    userId,

    customer,

    status: "Pending",

    createdAt:
      order?.createdAt ||
      new Date(),

    updatedAt:
      new Date(),
  };

  // -------------------------------
  // CREATE ORDER
  // -------------------------------

  const orderRef =
    await addDoc(
      collection(db, "orders"),
      orderData
    );

  const savedOrder = {
    ...orderData,
    id: orderRef.id,
  };

  // ===================================================
  // ADMIN NEW ORDER NOTIFICATION
  // ===================================================

  try {
    await addDoc(
      collection(
        db,
        "notifications"
      ),
      {
        audience: "admin",

        type: "new-order",

        title:
          "New Order Received 🔔",

        message:
          `New order #${orderRef.id.slice(
            0,
            8
          )} received from ${
            customer?.name ||
            "Customer"
          } for ₹${Number(
            orderData?.total || 0
          )}.`,

        orderId:
          orderRef.id,

        userId,

        customer,

        read: false,

        createdAt:
          new Date(),
      }
    );
  } catch (error) {
    console.error(
      "Admin notification creation failed:",
      error
    );
  }

  // ===================================================
  // CUSTOMER ORDER CONFIRMATION
  // ===================================================

  await createOrderNotification(
    savedOrder,

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
// GET ORDERS
//
// ADMIN:
//   gets all orders.
//
// CUSTOMER:
//   gets only current customer's orders.
//
// This is IMPORTANT because Firestore Rules
// do not allow a customer to read the entire
// orders collection.
// =====================================================

export const getOrders = async () => {
  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    return [];
  }

  let snapshot;

  if (isAdminUser()) {
    const ordersQuery =
      query(
        collection(db, "orders"),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    snapshot =
      await getDocs(
        ordersQuery
      );
  } else {
    const ordersQuery =
      query(
        collection(db, "orders"),
        where(
          "userId",
          "==",
          currentUser.uid
        )
      );

    snapshot =
      await getDocs(
        ordersQuery
      );
  }

  const orders =
    snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      })
    );

  // Customer query is intentionally not
  // orderBy("createdAt") to avoid unnecessary
  // composite-index requirements.
  orders.sort(
    (a: any, b: any) => {
      const getTime =
        (value: any) => {
          if (
            typeof value?.toMillis ===
            "function"
          ) {
            return value.toMillis();
          }

          if (
            typeof value?.seconds ===
            "number"
          ) {
            return (
              value.seconds * 1000
            );
          }

          const time =
            new Date(
              value || 0
            ).getTime();

          return Number.isNaN(time)
            ? 0
            : time;
        };

      return (
        getTime(b.createdAt) -
        getTime(a.createdAt)
      );
    }
  );

  return orders;
};

// =====================================================
// REAL-TIME ORDERS
//
// ADMIN -> all orders
// CUSTOMER -> own orders only
// =====================================================

export const subscribeToOrders = (
  callback: (
    orders: any[]
  ) => void
) => {
  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    callback([]);
    return () => {};
  }

  let ordersQuery;

  if (isAdminUser()) {
    ordersQuery =
      query(
        collection(db, "orders"),
        orderBy(
          "createdAt",
          "desc"
        )
      );
  } else {
    ordersQuery =
      query(
        collection(db, "orders"),
        where(
          "userId",
          "==",
          currentUser.uid
        )
      );
  }

  const unsubscribe =
    onSnapshot(
      ordersQuery,

      (snapshot) => {
        const orders =
          snapshot.docs.map(
            (item) => {
              const data =
                item.data();

              return {
                id: item.id,
                ...data,
                status:
                  data.status ||
                  "Pending",
              };
            }
          );

        orders.sort(
          (a: any, b: any) => {
            const getTime =
              (value: any) => {
                if (
                  typeof value?.toMillis ===
                  "function"
                ) {
                  return value.toMillis();
                }

                if (
                  typeof value?.seconds ===
                  "number"
                ) {
                  return (
                    value.seconds *
                    1000
                  );
                }

                const time =
                  new Date(
                    value || 0
                  ).getTime();

                return Number.isNaN(
                  time
                )
                  ? 0
                  : time;
              };

            return (
              getTime(
                b.createdAt
              ) -
              getTime(
                a.createdAt
              )
            );
          }
        );

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
// REAL-TIME SINGLE ORDER
// =====================================================

export const subscribeToOrder = (
  id: string,
  callback: (
    order: any | null
  ) => void
) => {
  if (!id) {
    callback(null);
    return () => {};
  }

  const orderRef =
    doc(
      db,
      "orders",
      id
    );

  return onSnapshot(
    orderRef,

    (snapshot) => {
      if (
        !snapshot.exists()
      ) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },

    (error) => {
      console.error(
        "Single order subscription error:",
        error
      );

      callback(null);
    }
  );
};

// =====================================================
// GET ORDER BY ID
// =====================================================

export const getOrderById =
  async (
    id: string
  ) => {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      return null;
    }

    const orderRef =
      doc(
        db,
        "orders",
        id
      );

    const orderSnapshot =
      await getDoc(
        orderRef
      );

    if (
      !orderSnapshot.exists()
    ) {
      return null;
    }

    const data =
      orderSnapshot.data();

    // Customer can only receive
    // his/her own order.
    if (
      !isAdminUser() &&
      data.userId !==
        currentUser.uid
    ) {
      return null;
    }

    return {
      id:
        orderSnapshot.id,
      ...data,
    };
  };

// =====================================================
// CUSTOMER CANCEL ORDER
// =====================================================

export const cancelOrderByCustomer =
  async (
    id: string,
    reason: string,
    userId: string
  ) => {
    const currentUser =
      auth.currentUser;

    if (
      !currentUser ||
      currentUser.uid !==
        userId
    ) {
      throw new Error(
        "Please login again."
      );
    }

    const orderRef =
      doc(
        db,
        "orders",
        id
      );

    const orderSnapshot =
      await getDoc(
        orderRef
      );

    if (
      !orderSnapshot.exists()
    ) {
      throw new Error(
        "Order not found"
      );
    }

    const existingOrder =
      {
        id:
          orderSnapshot.id,
        ...orderSnapshot.data(),
      } as any;

    const owner =
      existingOrder?.userId ||
      existingOrder?.customer?.uid ||
      existingOrder?.customer?.userId ||
      "";

    if (
      owner !== userId
    ) {
      throw new Error(
        "You are not allowed to cancel this order"
      );
    }

    const currentStatus =
      existingOrder?.status ||
      "Pending";

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
    ];

    if (
      !allowedStatuses.includes(
        currentStatus
      )
    ) {
      throw new Error(
        "This order can no longer be cancelled"
      );
    }

    const cleanReason =
      reason?.trim();

    if (!cleanReason) {
      throw new Error(
        "Cancellation reason is required"
      );
    }

    await updateDoc(
      orderRef,
      {
        status:
          "Cancelled",

        cancelledBy:
          "customer",

        cancellationReason:
          cleanReason,

        cancelledAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );

    // ADMIN NOTIFICATION

    try {
      await addDoc(
        collection(
          db,
          "notifications"
        ),
        {
          audience:
            "admin",

          type:
            "order-cancelled",

          title:
            "Order Cancelled by Customer ❌",

          message:
            `Order #${id.slice(
              0,
              8
            )} has been cancelled by ${
              existingOrder
                ?.customer
                ?.name ||
              "Customer"
            }. Reason: ${cleanReason}`,

          orderId: id,

          userId,

          customer:
            existingOrder?.customer ||
            {},

          cancellationReason:
            cleanReason,

          read: false,

          createdAt:
            new Date(),
        }
      );
    } catch (error) {
      console.error(
        "Admin cancellation notification failed:",
        error
      );
    }

    // CUSTOMER NOTIFICATION

    await createOrderNotification(
      {
        ...existingOrder,
        id,
        userId,
      },

      "Order Cancelled ❌",

      `Your order #${id.slice(
        0,
        8
      )} has been cancelled successfully.`,

      "Cancelled"
    );

    return true;
  };

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

export const updateOrderStatus =
  async (
    id: string,
    status: string
  ) => {
    const orderRef =
      doc(
        db,
        "orders",
        id
      );

    const orderSnapshot =
      await getDoc(
        orderRef
      );

    if (
      !orderSnapshot.exists()
    ) {
      throw new Error(
        "Order not found"
      );
    }

    const existingOrder =
      {
        id:
          orderSnapshot.id,
        ...orderSnapshot.data(),
      };

    await updateDoc(
      orderRef,
      {
        status,

        updatedAt:
          new Date(),
      }
    );

    if (
      status ===
        "Packed" ||
      status ===
        "Confirmed"
    ) {
      await createOrderNotification(
        existingOrder,

        "Order Confirmed 📦",

        `Your order #${id.slice(
          0,
          8
        )} has been accepted and packed. It will be dispatched soon.`,

        status
      );
    } else if (
      status ===
      "Preparing"
    ) {
      await createOrderNotification(
        existingOrder,

        "Order Preparing 👨‍🍳",

        `Your order #${id.slice(
          0,
          8
        )} is now being prepared.`,

        "Preparing"
      );
    } else if (
      status ===
      "Out for Delivery"
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
    } else if (
      status ===
      "Delivered"
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
    } else if (
      status ===
      "Cancelled"
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

export const deleteOrder =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        "orders",
        id
      )
    );

    return true;
  };