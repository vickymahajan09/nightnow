import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import {
  getFirestore,
  initializeFirestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

import {
  getMessaging,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey:
    "AIzaSyDqF5SmjpswS5LRlwufjhXTceecSQVkS5A",

  authDomain:
    "night-now-c5617.firebaseapp.com",

  projectId:
    "night-now-c5617",

  storageBucket:
    "night-now-c5617.firebasestorage.app",

  messagingSenderId:
    "875117617997",

  appId:
    "1:875117617997:web:c28795cb5ce11c975b4d04",
};

/* ==========================================
   FIREBASE APP
========================================== */

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/* ==========================================
   AUTH
========================================== */

export const auth =
  getAuth(app);

/*
 * Keep customer login available across
 * route changes / page reloads.
 */
if (
  typeof window !==
  "undefined"
) {
  setPersistence(
    auth,
    browserLocalPersistence
  ).catch((error) => {
    console.error(
      "Firebase Auth persistence error:",
      error
    );
  });
}

/* ==========================================
   FIRESTORE
========================================== */

/*
 * Firestore's default transport is a long-lived streaming
 * connection. Some ISPs, office/college wifi, VPNs and Windows
 * antivirus tools with HTTPS scanning break that stream, which
 * shows up as "Could not reach Cloud Firestore backend
 * (code=unavailable)" and drops the app into offline mode.
 *
 * experimentalAutoDetectLongPolling makes the SDK notice this and
 * fall back to ordinary HTTP polling on its own. On a healthy
 * network it changes nothing.
 *
 * initializeFirestore throws if Firestore was already started
 * (which happens on hot reload in dev), so we fall back to the
 * existing instance in that case.
 */
const createDb = () => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
};

export const db = createDb();

/* ==========================================
   STORAGE
========================================== */

export const storage =
  getStorage(app);

/* ==========================================
   FIREBASE MESSAGING
========================================== */

export const getFirebaseMessaging =
  async () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    try {
      const supported =
        await isSupported();

      if (!supported) {
        return null;
      }

      return getMessaging(app);
    } catch (error) {
      console.error(
        "Firebase Messaging error:",
        error
      );

      return null;
    }
  };

export default app;