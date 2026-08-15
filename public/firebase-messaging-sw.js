importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDqF5SmjpswS5LRlwufjhXTceecSQVkS5A",
  authDomain: "night-now-c5617.firebaseapp.com",
  projectId: "night-now-c5617",
  storageBucket: "night-now-c5617.firebasestorage.app",
  messagingSenderId: "875117617997",
  appId: "1:875117617997:web:c28795cb5ce11c975b4d04",
});

const messaging =
  firebase.messaging();

messaging.onBackgroundMessage(
  (payload) => {
    console.log(
      "[firebase-messaging-sw.js] Background message:",
      payload
    );

    const notificationTitle =
      payload?.notification?.title ||
      payload?.data?.title ||
      "Night Now";

    const notificationOptions = {
      body:
        payload?.notification?.body ||
        payload?.data?.body ||
        "You have a new notification.",
      icon:
        payload?.notification?.icon ||
        "/icon-192.png",
      badge:
        "/icon-192.png",
      data:
        payload?.data || {},
    };

    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const data =
      event.notification?.data || {};

    const orderId =
      data.orderId || "";

    const targetUrl =
      orderId
        ? `/admin/orders/${orderId}`
        : "/admin/notifications";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "focus" in client
            ) {
              client.navigate(
                targetUrl
              );

              return client.focus();
            }
          }

          if (
            clients.openWindow
          ) {
            return clients.openWindow(
              targetUrl
            );
          }

          return null;
        })
    );
  }
);