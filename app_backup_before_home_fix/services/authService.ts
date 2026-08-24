import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export const checkUser = (callback: (user: any) => void) =>
  onAuthStateChanged(auth, callback);

// Kept for admin/backward compatibility.
export const loginUser = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error: any) {
    if (["auth/wrong-password", "auth/user-not-found", "auth/invalid-credential"].includes(error?.code)) {
      throw new Error("Email or password is incorrect.");
    }
    if (error?.code === "auth/too-many-requests") {
      throw new Error("Too many login attempts. Please try again later.");
    }
    throw error;
  }
};

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  await setDoc(doc(db, "users", result.user.uid), {
    uid: result.user.uid,
    email: result.user.email || "",
    phone: result.user.phoneNumber || "",
    name: result.user.displayName || "",
    photoURL: result.user.photoURL || "",
    provider: "google",
    updatedAt: new Date(),
  }, { merge: true });
  return result;
};

const getRecaptcha = (containerId: string) => {
  const existing = (window as any).__nightNowRecaptcha;
  if (existing) return existing as RecaptchaVerifier;

  const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  (window as any).__nightNowRecaptcha = verifier;
  return verifier;
};

export const sendPhoneOTP = async (phoneNumber: string, containerId = "recaptcha-container") => {
  const verifier = getRecaptcha(containerId);
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    try {
      verifier.clear();
      (window as any).__nightNowRecaptcha = null;
    } catch {}
    throw error;
  }
};

export const savePhoneUserProfile = async (user: any, name = "") => {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    phone: user.phoneNumber || "",
    name: name.trim() || user.displayName || "",
    provider: "phone",
    updatedAt: new Date(),
  }, { merge: true });
};

export const registerUser = async (name: string, email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
  await setDoc(doc(db, "users", result.user.uid), {
    uid: result.user.uid,
    email: result.user.email || "",
    name: name.trim(),
    provider: "password",
    createdAt: new Date(),
  }, { merge: true });
  return result;
};

export const signupUser = async (email: string, password: string, name?: string) =>
  registerUser(name || "", email, password);

export const resetPassword = async (email: string) => {
  const { sendPasswordResetEmail } = await import("firebase/auth");
  return sendPasswordResetEmail(auth, email.trim());
};

export const logoutUser = async () => signOut(auth);

export const getUserProfile = async (uid: string) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};
