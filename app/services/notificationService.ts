import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

export type AppNotification = {
  id?: string;
  userId?: string;
  audience?: string;
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

const getCurrentUserId =
  () =>
    auth.currentUser?.uid ||
    "";

const getNotificationTime =
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

const sortNotifications =
  (
    items: AppNotification[]
  ) =>
    [...items].sort(
      (a, b) =>
        getNotificationTime(
          b.createdAt
        ) -
        getNotificationTime(
          a.createdAt
        )
    );

export const getMyNotifications =
  async (): Promise<
    AppNotification[]
  > => {
    const uid =
      getCurrentUserId();

    if (!uid) {
      return [];
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
  };

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
  };

export const getUnreadCount =
  async () => {
    const items =
      await getMyNotifications();

    return items.filter(
      (item) =>
        item.read !== true
    ).length;
  };

export const subscribeToMyNotifications =
  (
    callback: (
      notifications: AppNotification[]
    ) => void
  ) => {
    const uid =
      getCurrentUserId();

    if (!uid) {
      callback([]);

      return () => {};
    }

    return onSnapshot(
      query(
        collection(
          db,
          "notifications"
        ),
        where(
          "userId",
          "==",
          uid
        )
      ),
      (snapshot) => {
        callback(
          sortNotifications(
            snapshot.docs.map(
              (item) =>
                ({
                  id: item.id,
                  ...item.data(),
                }) as AppNotification
            )
          )
        );
      },
      (error) => {
        console.error(
          "Customer notification subscription error:",
          error
        );

        callback([]);
      }
    );
  };

export const subscribeToAdminNotifications =
  (
    callback: (
      notifications: AppNotification[]
    ) => void
  ) => {
    return onSnapshot(
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
      ),
      (snapshot) => {
        callback(
          sortNotifications(
            snapshot.docs.map(
              (item) =>
                ({
                  id: item.id,
                  ...item.data(),
                }) as AppNotification
            )
          )
        );
      },
      (error) => {
        console.error(
          "Admin notification subscription error:",
          error
        );

        callback([]);
      }
    );
  };

export const markNotificationRead =
  async (
    id: string
  ) => {
    if (!id) {
      return;
    }

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

export const markAllNotificationsRead =
  async () => {
    const items =
      await getMyNotifications();

    await Promise.all(
      items
        .filter(
          (item) =>
            item.id &&
            item.read !== true
        )
        .map(
          (item) =>
            updateDoc(
              doc(
                db,
                "notifications",
                item.id!
              ),
              {
                read: true,
                updatedAt:
                  new Date(),
              }
            )
        )
    );
  };

export const deleteNotification =
  async (
    id: string
  ) => {
    if (!id) {
      return;
    }

    await deleteDoc(
      doc(
        db,
        "notifications",
        id
      )
    );
  };