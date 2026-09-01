"use client";

import {
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
  getFirebaseMessaging,
} from "../lib/firebase";

const VAPID_KEY =
  process.env
    .NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export async function registerAdminPushNotifications() {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const supported =
      await isSupported();

    if (!supported) {
      console.log(
        "Firebase Messaging is not supported in this browser."
      );

      return null;
    }

    if (!VAPID_KEY) {
      console.error(
        "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing."
      );

      return null;
    }

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      console.log(
        "No authenticated admin user."
      );

      return null;
    }

    if (
      !("Notification" in window)
    ) {
      console.log(
        "Browser notifications are not supported."
      );

      return null;
    }

    const permission =
      await Notification.requestPermission();

    if (
      permission !== "granted"
    ) {
      console.log(
        "Notification permission denied."
      );

      return null;
    }

    /*
     * Register / get Firebase service worker
     */

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    /*
     * Wait until service worker is ready
     */

    await navigator.serviceWorker.ready;

    /*
     * Get Firebase Messaging
     */

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      console.error(
        "Firebase Messaging initialization failed."
      );

      return null;
    }

    /*
     * Generate FCM token
     */

    const token =
      await getToken(
        messaging,
        {
          vapidKey:
            VAPID_KEY,

          serviceWorkerRegistration:
            registration,
        }
      );

    if (!token) {
      console.error(
        "FCM token was not generated."
      );

      return null;
    }

    /*
     * Save token
     */

    await setDoc(
      doc(
        db,
        "adminPushTokens",
        currentUser.uid
      ),
      {
        userId:
          currentUser.uid,

        email:
          currentUser.email ||
          "",

        token,

        enabled: true,

        platform:
          "web",

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "✅ Admin FCM token saved."
    );

    return token;
  } catch (error) {
    console.error(
      "FCM registration error:",
      error
    );

    return null;
  }
}

/* =====================================================
   FOREGROUND MESSAGE
===================================================== */

export async function listenForForegroundMessages(
  callback: (
    payload: MessagePayload
  ) => void
) {
  try {
    if (
      typeof window === "undefined"
    ) {
      return () => {};
    }

    const supported =
      await isSupported();

    if (!supported) {
      return () => {};
    }

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return () => {};
    }

    return onMessage(
      messaging,
      (payload) => {
        console.log(
          "🔔 Foreground FCM message:",
          payload
        );

        callback(
          payload
        );
      }
    );
  } catch (error) {
    console.error(
      "Foreground FCM error:",
      error
    );

    return () => {};
  }
}