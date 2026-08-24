"use client";

import {
  useEffect,
} from "react";

import {
  registerAdminPushNotifications,
  listenForForegroundMessages,
} from "../lib/messaging";

export default function AdminPushNotification() {
  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | undefined;

    const setup =
      async () => {
        try {
          // Register service worker
          if (
            "serviceWorker" in
            navigator
          ) {
            await navigator.serviceWorker.register(
              "/firebase-messaging-sw.js"
            );
          }

          // Register FCM token
          await registerAdminPushNotifications();

          // Foreground messages
          unsubscribe =
            await listenForForegroundMessages(
              (payload) => {
                const title =
                  payload?.notification
                    ?.title ||
                  "Night Now";

                const body =
                  payload?.notification
                    ?.body ||
                  "New notification";

                // Browser foreground popup
                if (
                  Notification.permission ===
                  "granted"
                ) {
                  new Notification(
                    title,
                    {
                      body,
                      icon:
                        "/favicon.ico",
                    }
                  );
                }
              }
            );
        } catch (error) {
          console.error(
            "Admin push setup failed:",
            error
          );
        }
      };

    setup();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return null;
}