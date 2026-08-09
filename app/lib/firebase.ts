
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDqF5SmjpswS5LRlwufjhXTceecSQVkS5A",
  authDomain: "night-now-c5617.firebaseapp.com",
  projectId: "night-now-c5617",
  storageBucket: "night-now-c5617.firebasestorage.app",
  messagingSenderId: "875117617997",
  appId: "1:875117617997:web:c28795cb5ce11c975b4d04",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
export const storage = getStorage(app);
