import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  getToken,
} from "firebase/messaging";

import {
  db,
  getFirebaseMessaging,
} from "../lib/firebase";

const VAPID_KEY =
  process.env
    .NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export const registerPushToken =
  async (
    userId: string,
    role: "admin" | "customer" = "customer"
  ) => {
    try {
      if (
        typeof window ===
        "undefined"
      ) {
        return null;
      }

      if (!userId) {
        console.warn(
          "Push registration: userId missing"
        );

        return null;
      }

      if (!VAPID_KEY) {
        console.error(
          "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing"
        );

        return null;
      }

      if (
        !("Notification" in window)
      ) {
        console.warn(
          "Browser notifications are not supported."
        );

        return null;
      }

      const messaging =
        await getFirebaseMessaging();

      if (!messaging) {
        console.warn(
          "Firebase Messaging is not supported."
        );

        return null;
      }

      const permission =
        await Notification.requestPermission();

      if (
        permission !==
        "granted"
      ) {
        console.warn(
          "Notification permission denied."
        );

        return null;
      }

      const registration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

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
        console.warn(
          "FCM token was not generated."
        );

        return null;
      }

      await setDoc(
        doc(
          db,
          "pushTokens",
          token
        ),
        {
          token,
          userId,
          role,
          platform:
            "web",
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      return token;
    } catch (error) {
      console.error(
        "Push token registration failed:",
        error
      );

      return null;
    }
  };