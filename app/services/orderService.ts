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

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  db,
  auth,
} from "../lib/firebase";

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
// AUTH READY
// =====================================================

const waitForAuthUser = async (
  timeoutMs = 15000
) => {
  try {
    await auth.authStateReady();

    if (auth.currentUser) {
      return auth.currentUser;
    }
  } catch (error) {
    console.error(
      "Firebase authStateReady error:",
      error
    );
  }

  return new Promise<any | null>(
    (resolve) => {
      let finished = false;

      let unsubscribe:
        | (() => void)
        | null = null;

      let timer:
        | ReturnType<typeof setTimeout>
        | null = null;

      const finish = (
        user: any | null
      ) => {
        if (finished) {
          return;
        }

        finished = true;

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        resolve(user);
      };

      unsubscribe =
        onAuthStateChanged(
          auth,
          (user) => {
            if (user) {
              finish(user);
            }
          },
          (error) => {
            console.error(
              "Firebase auth state listener error:",
              error
            );

            finish(null);
          }
        );

      timer = setTimeout(() => {
        finish(
          auth.currentUser
        );
      }, timeoutMs);
    }
  );
};

// =====================================================
// CUSTOMER NOTIFICATION
// =====================================================

const createOrderNotification =
  async (
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
        collection(
          db,
          "notifications"
        ),
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

          createdAt:
            new Date(),
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

export const addOrder =
  async (
    order: any
  ) => {
    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      throw new Error(
        "Please login before placing an order."
      );
    }

    const userId =
      currentUser.uid;

    const existingCustomer =
      order?.customer || {};

    const customer = {
      ...existingCustomer,

      uid:
        userId,

      userId:
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

      userId,

      customer,

      status:
        "Pending",

      createdAt:
        order?.createdAt ||
        new Date(),

      updatedAt:
        new Date(),
    };

    const orderRef =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        orderData
      );

    const savedOrder = {
      ...orderData,

      id:
        orderRef.id,
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
          audience:
            "admin",

          type:
            "new-order",

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
              orderData?.total ||
                0
            )}.`,

          orderId:
            orderRef.id,

          userId,

          customer,

          read:
            false,

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
    // CUSTOMER CONFIRMATION
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
// =====================================================

export const getOrders =
  async () => {
    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      return [];
    }

    let snapshot;

    if (
      isAdminUser()
    ) {
      const ordersQuery =
        query(
          collection(
            db,
            "orders"
          ),
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
          collection(
            db,
            "orders"
          ),
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
          id:
            item.id,

          ...item.data(),
        })
      );

    orders.sort(
      (
        a: any,
        b: any
      ) => {
        const getTime =
          (
            value: any
          ) => {
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

    return orders;
  };

// =====================================================
// REAL-TIME ORDERS
// =====================================================

export const subscribeToOrders =
  (
    callback: (
      orders: any[]
    ) => void
  ) => {
    let unsubscribeAuth:
      | (() => void)
      | null = null;

    let unsubscribeSnapshot:
      | (() => void)
      | null = null;

    let active = true;

    const start = () => {
      const currentUser =
        auth.currentUser;

      if (!active) {
        return;
      }

      if (!currentUser) {
        callback([]);
        return;
      }

      let ordersQuery;

      if (
        isAdminUser()
      ) {
        ordersQuery =
          query(
            collection(
              db,
              "orders"
            ),
            orderBy(
              "createdAt",
              "desc"
            )
          );
      } else {
        ordersQuery =
          query(
            collection(
              db,
              "orders"
            ),
            where(
              "userId",
              "==",
              currentUser.uid
            )
          );
      }

      unsubscribeSnapshot =
        onSnapshot(
          ordersQuery,

          (snapshot) => {
            const orders =
              snapshot.docs.map(
                (item) => {
                  const data =
                    item.data();

                  return {
                    id:
                      item.id,

                    ...data,

                    status:
                      data.status ||
                      "Pending",
                  };
                }
              );

            orders.sort(
              (
                a: any,
                b: any
              ) => {
                const getTime =
                  (
                    value: any
                  ) => {
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

            callback(
              orders
            );
          },

          (error) => {
            console.error(
              "Orders subscription error:",
              error
            );

            callback([]);
          }
        );
    };

    if (
      auth.currentUser
    ) {
      start();
    } else {
      unsubscribeAuth =
        onAuthStateChanged(
          auth,
          () => {
            if (
              auth.currentUser
            ) {
              if (
                unsubscribeAuth
              ) {
                unsubscribeAuth();

                unsubscribeAuth =
                  null;
              }

              start();
            }
          }
        );
    }

    return () => {
      active = false;

      if (
        unsubscribeAuth
      ) {
        unsubscribeAuth();

        unsubscribeAuth =
          null;
      }

      if (
        unsubscribeSnapshot
      ) {
        unsubscribeSnapshot();

        unsubscribeSnapshot =
          null;
      }
    };
  };

// =====================================================
// REAL-TIME SINGLE ORDER
// =====================================================

export const subscribeToOrder =
  (
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
          id:
            snapshot.id,

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
      await waitForAuthUser();

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
      await waitForAuthUser();

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

    const allowedStatuses =
      [
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

    // =================================================
    // ADMIN NOTIFICATION
    // =================================================

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

          orderId:
            id,

          userId,

          customer:
            existingOrder?.customer ||
            {},

          cancellationReason:
            cleanReason,

          read:
            false,

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

    // =================================================
    // CUSTOMER NOTIFICATION
    // =================================================

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
// RETURN PRODUCT
// =====================================================

export const requestProductReturn =
  async (
    orderId: string,
    productId: string,
    reason: string,
    description = ""
  ) => {
    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      throw new Error(
        "Please login before requesting a return."
      );
    }

    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }

    if (!productId) {
      throw new Error(
        "Product ID is required."
      );
    }

    const cleanReason =
      reason?.trim();

    if (!cleanReason) {
      throw new Error(
        "Return reason is required."
      );
    }

    const orderRef =
      doc(
        db,
        "orders",
        orderId
      );

    const orderSnapshot =
      await getDoc(
        orderRef
      );

    if (
      !orderSnapshot.exists()
    ) {
      throw new Error(
        "Order not found."
      );
    }

    const order =
      {
        id:
          orderSnapshot.id,

        ...orderSnapshot.data(),
      } as any;

    const owner =
      order?.userId ||
      order?.customer?.uid ||
      order?.customer?.userId ||
      "";

    if (
      owner !==
      currentUser.uid
    ) {
      throw new Error(
        "You are not allowed to request a return for this order."
      );
    }

    if (
      order.status !==
      "Delivered"
    ) {
      throw new Error(
        "Product return is available only after delivery."
      );
    }

    const items =
      Array.isArray(
        order.items
      )
        ? [...order.items]
        : [];

    const itemIndex =
      items.findIndex(
        (item: any) =>
          String(
            item?.id || ""
          ) ===
          String(
            productId
          )
      );

    if (
      itemIndex === -1
    ) {
      throw new Error(
        "Product not found in this order."
      );
    }

    const selectedItem =
      items[itemIndex] as any;

    if (
      selectedItem.returnStatus ===
        "Requested" ||
      selectedItem.returnStatus ===
        "Approved" ||
      selectedItem.returnStatus ===
        "Completed"
    ) {
      throw new Error(
        "Return request already exists for this product."
      );
    }

    items[itemIndex] = {
      ...selectedItem,

      returnStatus:
        "Requested",

      returnReason:
        cleanReason,

      returnDescription:
        description?.trim() ||
        "",

      returnRequestedAt:
        new Date(),

      refundStatus:
        "Pending",
    };

    await updateDoc(
      orderRef,
      {
        items,

        returnRequested:
          true,

        returnRequestedAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );

    // =================================================
    // ADMIN RETURN NOTIFICATION
    // =================================================

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
            "product-return",

          title:
            "Product Return Requested ↩️",

          message:
            `${order?.customer?.name || "Customer"} requested a return for "${selectedItem?.name || "Product"}" in order #${orderId.slice(
              0,
              8
            )}. Reason: ${cleanReason}`,

          orderId,

          userId:
            currentUser.uid,

          productId,

          productName:
            selectedItem?.name ||
            "Product",

          returnReason:
            cleanReason,

          returnDescription:
            description?.trim() ||
            "",

          read:
            false,

          createdAt:
            new Date(),
        }
      );
    } catch (error) {
      console.error(
        "Admin return notification failed:",
        error
      );
    }

    // =================================================
    // CUSTOMER RETURN NOTIFICATION
    // =================================================

    await createOrderNotification(
      {
        ...order,

        id:
          orderId,

        userId:
          currentUser.uid,
      },

      "Return Request Submitted ↩️",

      `Your return request for "${selectedItem?.name || "Product"}" has been submitted successfully. Our team will review it.`,

      "Return Requested"
    );

    return true;
  };

// =====================================================
// EXCHANGE PRODUCT
// =====================================================

export const requestProductExchange =
  async (
    orderId: string,
    productId: string,
    reason: string,
    description = ""
  ) => {
    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      throw new Error(
        "Please login before requesting an exchange."
      );
    }

    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }

    if (!productId) {
      throw new Error(
        "Product ID is required."
      );
    }

    const cleanReason =
      reason?.trim();

    if (!cleanReason) {
      throw new Error(
        "Exchange reason is required."
      );
    }

    const orderRef =
      doc(
        db,
        "orders",
        orderId
      );

    const orderSnapshot =
      await getDoc(
        orderRef
      );

    if (
      !orderSnapshot.exists()
    ) {
      throw new Error(
        "Order not found."
      );
    }

    const order =
      {
        id:
          orderSnapshot.id,

        ...orderSnapshot.data(),
      } as any;

    const owner =
      order?.userId ||
      order?.customer?.uid ||
      order?.customer?.userId ||
      "";

    if (
      owner !==
      currentUser.uid
    ) {
      throw new Error(
        "You are not allowed to request an exchange for this order."
      );
    }

    if (
      order.status !==
      "Delivered"
    ) {
      throw new Error(
        "Product exchange is available only after delivery."
      );
    }

    const items =
      Array.isArray(
        order.items
      )
        ? [...order.items]
        : [];

    const itemIndex =
      items.findIndex(
        (item: any) =>
          String(
            item?.id || ""
          ) ===
          String(
            productId
          )
      );

    if (
      itemIndex === -1
    ) {
      throw new Error(
        "Product not found in this order."
      );
    }

    const selectedItem =
      items[itemIndex] as any;

    if (
      selectedItem.exchangeStatus ===
        "Requested" ||
      selectedItem.exchangeStatus ===
        "Approved" ||
      selectedItem.exchangeStatus ===
        "Completed"
    ) {
      throw new Error(
        "Exchange request already exists for this product."
      );
    }

    items[itemIndex] = {
      ...selectedItem,

      exchangeStatus:
        "Requested",

      exchangeReason:
        cleanReason,

      exchangeDescription:
        description?.trim() ||
        "",

      exchangeRequestedAt:
        new Date(),
    };

    await updateDoc(
      orderRef,
      {
        items,

        exchangeRequested:
          true,

        exchangeRequestedAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );

    // =================================================
    // ADMIN EXCHANGE NOTIFICATION
    // =================================================

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
            "product-exchange",

          title:
            "Product Exchange Requested 🔄",

          message:
            `${order?.customer?.name || "Customer"} requested an exchange for "${selectedItem?.name || "Product"}" in order #${orderId.slice(
              0,
              8
            )}. Reason: ${cleanReason}`,

          orderId,

          userId:
            currentUser.uid,

          productId,

          productName:
            selectedItem?.name ||
            "Product",

          exchangeReason:
            cleanReason,

          exchangeDescription:
            description?.trim() ||
            "",

          read:
            false,

          createdAt:
            new Date(),
        }
      );
    } catch (error) {
      console.error(
        "Admin exchange notification failed:",
        error
      );
    }

    // =================================================
    // CUSTOMER EXCHANGE NOTIFICATION
    // =================================================

    await createOrderNotification(
      {
        ...order,

        id:
          orderId,

        userId:
          currentUser.uid,
      },

      "Exchange Request Submitted 🔄",

      `Your exchange request for "${selectedItem?.name || "Product"}" has been submitted successfully. Our team will review it.`,

      "Exchange Requested"
    );

    return true;
  };

// =====================================================
// DELETE ORDER
// =====================================================

export const deleteOrder =
  async (
    id: string
  ) => {
    if (!id) {
      throw new Error(
        "Order ID is required."
      );
    }

    await deleteDoc(
      doc(
        db,
        "orders",
        id
      )
    );

    return true;
  };