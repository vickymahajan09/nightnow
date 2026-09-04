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

import { notifyRidersOfNewOrder } from "./deliveryPartnerService";

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

// =====================================================
// CUSTOMER BROWSER PUSH (real notification — works even
// when the site/tab is closed, unlike the in-app popup)
// =====================================================

const sendCustomerPush = async (
  userId: string,
  title: string,
  body: string,
  orderId: string
) => {
  try {
    if (!userId) return;

    const currentUser = auth.currentUser;
    const idToken = currentUser ? await currentUser.getIdToken() : "";

    await fetch("/api/admin/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ userId, title, body, orderId }),
    });
  } catch (error) {
    // Never let a push failure block the order-status update itself.
    console.error("Customer push notification failed:", error);
  }
};

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

          audience:
            "customer",

          orderId:
            order?.orderId ||
            order?.id ||
            "",

          type:
            "order",

          title,

          message,

          status,

          read:
            false,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );
    } catch (error) {
      console.error(
        "Customer notification creation failed:",
        error
      );
    }
  };

// =====================================================
// SECURE ADMIN NOTIFICATION HELPER
// =====================================================

const createAdminNotification =
  async (
    currentUser: any,
    type: string,
    orderId: string,
    extraData: Record<
      string,
      any
    > = {}
  ) => {
    try {
      if (
        !currentUser ||
        !orderId
      ) {
        return;
      }

      const idToken =
        await currentUser.getIdToken();

      const response =
        await fetch(
          "/api/notifications/admin",
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${idToken}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                type,
                orderId,
                ...extraData,
              }),
          }
        );

      let data:
        | any
        | null = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error(
          "Admin notification API failed:",
          data?.error ||
            `HTTP ${response.status}`
        );

        return;
      }

      return data;
    } catch (error) {
      console.error(
        "Admin notification request failed:",
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

      assignedPartnerId:
        null,

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
    // ALERT ALL DELIVERY PARTNERS IMMEDIATELY
    //
    // Riders no longer wait for the order to be packed - they are
    // pinged the second it is placed, so they can start heading to
    // the shop while it is still being packed.
    // ===================================================

    notifyRidersOfNewOrder(orderRef.id);

    // ===================================================
    // SECURE ADMIN NEW ORDER NOTIFICATION
    // ===================================================

    await createAdminNotification(
      currentUser,

      "new-order",

      orderRef.id
    );

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

    let started = false;

    const start = async () => {
      if (!active || started) {
        return;
      }

      try {
        await auth.authStateReady();

        if (!active) {
          return;
        }

        const currentUser =
          auth.currentUser;

        if (!currentUser) {
          callback([]);
          return;
        }

        started = true;

        console.log(
          "🟢 Orders subscription started:",
          currentUser.uid
        );

        let ordersQuery;

        if (isAdminUser()) {
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
              if (!active) {
                return;
              }

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

              console.log(
                "📦 Orders received:",
                orders.length
              );

              callback(
                orders
              );
            },

            (error) => {
              console.error(
                "❌ Orders Firestore subscription error:",
                error
              );

              if (!active) {
                return;
              }

              callback([]);

              if (
                unsubscribeSnapshot
              ) {
                unsubscribeSnapshot();

                unsubscribeSnapshot =
                  null;
              }

              started = false;
            }
          );
      } catch (error) {
        console.error(
          "❌ Orders subscription start failed:",
          error
        );

        if (!active) {
          return;
        }

        started = false;

        callback([]);
      }
    };

    if (auth.currentUser) {
      start();
    } else {
      unsubscribeAuth =
        onAuthStateChanged(
          auth,
          (user) => {
            if (
              !active ||
              !user
            ) {
              return;
            }

            if (
              unsubscribeAuth
            ) {
              unsubscribeAuth();

              unsubscribeAuth =
                null;
            }

            start();
          },

          (error) => {
            console.error(
              "❌ Auth listener error:",
              error
            );

            if (!active) {
              return;
            }

            callback([]);
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

      started = false;
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
    // SECURE ADMIN CANCELLATION NOTIFICATION
    // =================================================

    await createAdminNotification(
      currentUser,

      "order-cancelled",

      id,

      {
        reason:
          cleanReason,
      }
    );

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
    if (!id?.trim()) {
      throw new Error(
        "Order ID is required."
      );
    }

    const cleanStatus =
      status?.trim();

    if (!cleanStatus) {
      throw new Error(
        "Order status is required."
      );
    }

    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      throw new Error(
        "Please login again."
      );
    }

    if (!isAdminUser()) {
      throw new Error(
        "Only admin can update order status."
      );
    }

    const allowedStatuses =
      [
        "Pending",
        "Confirmed",
        "Preparing",
        "Packed",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

    if (
      !allowedStatuses.includes(
        cleanStatus
      )
    ) {
      throw new Error(
        "Invalid order status."
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

    const previousStatus =
      existingOrder.status ||
      "Pending";

    if (
      previousStatus ===
      cleanStatus
    ) {
      return true;
    }

    await updateDoc(
      orderRef,
      {
        status:
          cleanStatus,

        previousStatus,

        statusUpdatedBy:
          currentUser.uid,

        statusUpdatedAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );

    let title =
      "Order Updated 📦";

    let message =
      `Your order #${id.slice(
        0,
        8
      )} status is now ${cleanStatus}.`;

    switch (
      cleanStatus
    ) {
      case "Confirmed":
        title =
          "Order Confirmed ✅";

        message =
          `Your order #${id.slice(
            0,
            8
          )} has been confirmed successfully.`;

        break;

      case "Preparing":
        title =
          "Order Preparing 👨‍🍳";

        message =
          `Your order #${id.slice(
            0,
            8
          )} is now being prepared.`;

        break;

      case "Packed":
        title =
          "Order Packed 📦";

        message =
          `Your order #${id.slice(
            0,
            8
          )} has been packed and is ready for dispatch.`;

        break;

      case "Out for Delivery":
        title =
          "Out for Delivery 🛵";

        message =
          `Your order #${id.slice(
            0,
            8
          )} is out for delivery.`;

        break;

      case "Delivered":
        title =
          "Order Delivered 🎉";

        message =
          `Your order #${id.slice(
            0,
            8
          )} has been delivered successfully.`;

        break;

      case "Cancelled":
        title =
          "Order Cancelled ❌";

        message =
          `Your order #${id.slice(
            0,
            8
          )} has been cancelled.`;

        break;
    }

    // =================================================
    // CUSTOMER STATUS NOTIFICATION
    // =================================================

    await createOrderNotification(
      existingOrder,

      title,

      message,

      cleanStatus
    );

    // Real browser push — arrives even if the customer's
    // site/tab is closed.
    await sendCustomerPush(
      existingOrder.userId ||
        existingOrder.customer?.uid ||
        existingOrder.customer?.userId ||
        "",
      title,
      message,
      id
    );

    // =================================================
    // ADMIN STATUS NOTIFICATION
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
            "order-status-updated",

          title:
            "Order Status Updated",

          message:
            `Order #${id.slice(
              0,
              8
            )}: ${previousStatus} → ${cleanStatus}`,

          orderId:
            id,

          userId:
            existingOrder.userId ||
            "",

          previousStatus,

          status:
            cleanStatus,

          updatedBy:
            currentUser.uid,

          read:
            false,

          createdAt:
            new Date(),
        }
      );
    } catch (error) {
      console.error(
        "Admin status notification failed:",
        error
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

    const cleanDescription =
      description?.trim() ||
      "";

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
        cleanDescription,

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
    // SECURE ADMIN RETURN NOTIFICATION
    // =================================================

    await createAdminNotification(
      currentUser,

      "product-return",

      orderId,

      {
        productId,

        reason:
          cleanReason,

        description:
          cleanDescription,
      }
    );

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

    const cleanDescription =
      description?.trim() ||
      "";

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
        cleanDescription,

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
    // SECURE ADMIN EXCHANGE NOTIFICATION
    // =================================================

    await createAdminNotification(
      currentUser,

      "product-exchange",

      orderId,

      {
        productId,

        reason:
          cleanReason,

        description:
          cleanDescription,
      }
    );

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
    if (!id?.trim()) {
      throw new Error(
        "Order ID is required."
      );
    }

    const currentUser =
      await waitForAuthUser();

    if (!currentUser) {
      throw new Error(
        "Please login again."
      );
    }

    if (!isAdminUser()) {
      throw new Error(
        "Only admin can delete orders."
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

    await deleteDoc(
      orderRef
    );

    return true;
  };