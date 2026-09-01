import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../lib/firebase";

export type AppNotification = {
  id?: string;
  userId?: string;
  audience?: "admin" | "customer" | string;
  type?: string;
  title?: string;
  message?: string;
  status?: string;
  orderId?: string;
  read?: boolean;
  createdAt?: any;
  updatedAt?: any;

  [key: string]: any;
};

/* =====================================================
   HELPERS
===================================================== */

const getCurrentUserId = () =>
  auth.currentUser?.uid || "";

const getNotificationTime = (
  value: any
) => {
  if (!value) {
    return 0;
  }

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate().getTime();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return value.seconds * 1000;
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
};

const sortNotifications = (
  items: AppNotification[]
) => {
  return [...items].sort(
    (a, b) =>
      getNotificationTime(
        b.createdAt
      ) -
      getNotificationTime(
        a.createdAt
      )
  );
};

/* =====================================================
   GET MY NOTIFICATIONS
===================================================== */

export const getMyNotifications =
  async (): Promise<
    AppNotification[]
  > => {
    const uid =
      getCurrentUserId();

    if (!uid) {
      return [];
    }

    try {
      const snapshot =
        await getDocs(
          query(
            collection(
              db,
              "notifications"
            ),
            where(
              "userId",
              "==",
              uid
            ),
            where(
              "audience",
              "==",
              "customer"
            )
          )
        );

      return sortNotifications(
        snapshot.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as AppNotification
        )
      );
    } catch (error) {
      console.error(
        "Get customer notifications error:",
        error
      );

      return [];
    }
  };

/* =====================================================
   GET USER NOTIFICATIONS
===================================================== */

export const getUserNotifications =
  async (
    userId?: string
  ): Promise<
    AppNotification[]
  > => {
    const uid =
      userId ||
      getCurrentUserId();

    if (!uid) {
      return [];
    }

    try {
      const snapshot =
        await getDocs(
          query(
            collection(
              db,
              "notifications"
            ),
            where(
              "userId",
              "==",
              uid
            ),
            where(
              "audience",
              "==",
              "customer"
            )
          )
        );

      return sortNotifications(
        snapshot.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as AppNotification
        )
      );
    } catch (error) {
      console.error(
        "Get user notifications error:",
        error
      );

      return [];
    }
  };

/* =====================================================
   GET UNREAD COUNT
===================================================== */

export const getUnreadCount =
  async () => {
    const items =
      await getMyNotifications();

    return items.filter(
      (item) =>
        item.read !== true
    ).length;
  };

/* =====================================================
   CUSTOMER REALTIME NOTIFICATIONS
===================================================== */

export const subscribeToMyNotifications =
  (
    callback: (
      notifications: AppNotification[]
    ) => void
  ) => {
    let active = true;

    let unsubscribeSnapshot:
      | (() => void)
      | null = null;

    let unsubscribeAuth:
      | (() => void)
      | null = null;

    const stopSnapshot =
      () => {
        if (
          unsubscribeSnapshot
        ) {
          unsubscribeSnapshot();

          unsubscribeSnapshot =
            null;
        }
      };

    const startSnapshot = (
      uid: string
    ) => {
      if (
        !active ||
        !uid
      ) {
        return;
      }

      stopSnapshot();

      const notificationsQuery =
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "userId",
            "==",
            uid
          ),
          where(
            "audience",
            "==",
            "customer"
          )
        );

      unsubscribeSnapshot =
        onSnapshot(
          notificationsQuery,

          (snapshot) => {
            if (!active) {
              return;
            }

            const notifications =
              snapshot.docs.map(
                (item) =>
                  ({
                    id: item.id,
                    ...item.data(),
                  }) as AppNotification
              );

            callback(
              sortNotifications(
                notifications
              )
            );
          },

          (error) => {
            console.error(
              "Customer notification realtime error:",
              error
            );

            if (active) {
              callback([]);
            }
          }
        );
    };

    /*
     * Firebase Auth ready hone ke baad hi
     * notification listener start karo.
     */

    const start =
      async () => {
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

          startSnapshot(
            currentUser.uid
          );

          /*
           * Login/logout change ko bhi handle karo.
           */

          unsubscribeAuth =
            onAuthStateChanged(
              auth,
              (user) => {
                if (!active) {
                  return;
                }

                stopSnapshot();

                if (!user) {
                  callback([]);
                  return;
                }

                startSnapshot(
                  user.uid
                );
              }
            );
        } catch (error) {
          console.error(
            "Customer notification listener start error:",
            error
          );

          if (active) {
            callback([]);
          }
        }
      };

    start();

    return () => {
      active = false;

      stopSnapshot();

      if (
        unsubscribeAuth
      ) {
        unsubscribeAuth();

        unsubscribeAuth =
          null;
      }
    };
  };

/* =====================================================
   ADMIN REALTIME NOTIFICATIONS
===================================================== */

export const subscribeToAdminNotifications =
  (
    callback: (
      notifications: AppNotification[]
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

    let active = true;

    const unsubscribe =
      onSnapshot(
        notificationsQuery,
        (snapshot) => {
          if (!active) {
            return;
          }

          const notifications =
            snapshot.docs.map(
              (item) =>
                ({
                  id: item.id,
                  ...item.data(),
                }) as AppNotification
            );

          callback(
            sortNotifications(
              notifications
            )
          );
        },
        (error) => {
          console.error(
            "Admin notification subscription error:",
            error
          );

          if (active) {
            callback([]);
          }
        }
      );

    return () => {
      active = false;
      unsubscribe();
    };
  };

/* =====================================================
   MARK SINGLE CUSTOMER NOTIFICATION READ
===================================================== */

export const markNotificationRead =
  async (
    id: string
  ) => {
    if (!id) {
      return;
    }

    const uid =
      getCurrentUserId();

    if (!uid) {
      throw new Error(
        "Please login again."
      );
    }

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "userId",
            "==",
            uid
          ),
          where(
            "audience",
            "==",
            "customer"
          )
        )
      );

    const belongsToUser =
      snapshot.docs.some(
        (item) =>
          item.id === id
      );

    if (!belongsToUser) {
      throw new Error(
        "Notification not found."
      );
    }

    await updateDoc(
      doc(
        db,
        "notifications",
        id
      ),
      {
        read: true,
        updatedAt: new Date(),
      }
    );
  };

/* =====================================================
   MARK ALL CUSTOMER NOTIFICATIONS READ
===================================================== */

export const markAllNotificationsRead =
  async () => {
    const uid =
      getCurrentUserId();

    if (!uid) {
      throw new Error(
        "Please login again."
      );
    }

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "userId",
            "==",
            uid
          ),
          where(
            "audience",
            "==",
            "customer"
          ),
          where(
            "read",
            "==",
            false
          )
        )
      );

    if (
      snapshot.empty
    ) {
      return;
    }

    const batch =
      writeBatch(db);

    snapshot.docs.forEach(
      (notification) => {
        batch.update(
          notification.ref,
          {
            read: true,
            updatedAt: new Date(),
          }
        );
      }
    );

    await batch.commit();
  };

/* =====================================================
   MARK ALL ADMIN NOTIFICATIONS READ
===================================================== */

export const markAllAdminNotificationsRead =
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
          ),
          where(
            "read",
            "==",
            false
          )
        )
      );

    if (
      snapshot.empty
    ) {
      return;
    }

    const batch =
      writeBatch(db);

    snapshot.docs.forEach(
      (notification) => {
        batch.update(
          notification.ref,
          {
            read: true,
            updatedAt: new Date(),
          }
        );
      }
    );

    await batch.commit();
  };

/* =====================================================
   DELETE CUSTOMER NOTIFICATION
===================================================== */

export const deleteNotification =
  async (
    id: string
  ) => {
    if (!id) {
      return;
    }

    const uid =
      getCurrentUserId();

    if (!uid) {
      throw new Error(
        "Please login again."
      );
    }

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "userId",
            "==",
            uid
          ),
          where(
            "audience",
            "==",
            "customer"
          )
        )
      );

    const belongsToUser =
      snapshot.docs.some(
        (item) =>
          item.id === id
      );

    if (!belongsToUser) {
      throw new Error(
        "Notification not found."
      );
    }

    await deleteDoc(
      doc(
        db,
        "notifications",
        id
      )
    );
  };

/* =====================================================
   CLEANUP OLD CUSTOMER NOTIFICATIONS
===================================================== */

export const cleanupMyNotifications =
  async (
    keepCount = 100
  ) => {
    const uid =
      getCurrentUserId();

    if (!uid) {
      return;
    }

    const safeKeepCount =
      Math.max(
        20,
        Math.min(
          Number(keepCount) || 100,
          500
        )
      );

    try {
      const items =
        await getMyNotifications();

      if (
        items.length <=
        safeKeepCount
      ) {
        return;
      }

      const oldItems =
        items.slice(
          safeKeepCount
        );

      const batch =
        writeBatch(db);

      oldItems.forEach(
        (item) => {
          if (item.id) {
            batch.delete(
              doc(
                db,
                "notifications",
                item.id
              )
            );
          }
        }
      );

      await batch.commit();
    } catch (error) {
      console.error(
        "Notification cleanup error:",
        error
      );
    }
  };