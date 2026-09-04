// firebase-messaging-sw.js
// This file MUST live at the root of your deployed site, i.e. at
// public/firebase-messaging-sw.js in this Next.js project, so it is
// served at https://nightnow.in/firebase-messaging-sw.js
//
// Without this exact file at this exact path, Chrome (and other
// browsers) can never register for push notifications — every call
// to navigator.serviceWorker.register("/firebase-messaging-sw.js")
// in the app will fail, and no FCM token will ever be saved.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Same config as app/lib/firebase.ts — must match exactly.
firebase.initializeApp({
  apiKey: "AIzaSyDqF5SmjpswS5LRlwufjhXTceecSQVkS5A",
  authDomain: "night-now-c5617.firebaseapp.com",
  projectId: "night-now-c5617",
  storageBucket: "night-now-c5617.firebasestorage.app",
  messagingSenderId: "875117617997",
  appId: "1:875117617997:web:c28795cb5ce11c975b4d04",
});

const messaging = firebase.messaging();

// Shows the OS-level notification when a push arrives while the
// site/tab is closed or in the background.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Night Now";
  const options = {
    body: payload.notification?.body || "You have a new notification.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

// Clicking the notification opens (or focuses) the relevant page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
