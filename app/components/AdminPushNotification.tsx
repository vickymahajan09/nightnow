"use client";

import {
  useEffect,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  registerAdminPushNotifications,
  listenForForegroundMessages,
} from "../lib/messaging";

export default function AdminPushNotification() {
  useEffect(() => {
    let unsubscribeMessages:
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
          unsubscribeMessages =
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

    // Retry setup whenever the admin logs in (not just on first mount) —
    // otherwise the token never registers if this mounts before login.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setup();
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, []);

  return null;
}