import { initializeApp, getApps, getApp } from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
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

export const auth = getAuth(app);

/*
  Session browser/tab ke andar maintain rahegi.
*/

if (typeof window !== "undefined") {
  setPersistence(
    auth,
    browserSessionPersistence
  ).catch((error) => {
    console.error(
      "Firebase auth persistence error:",
      error
    );
  });
}

/* ==========================================
   FIRESTORE
========================================== */

export const db =
  getFirestore(app);

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
      typeof window === "undefined"
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