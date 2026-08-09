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
// ==============================
// CHECK USER
// ==============================

export const checkUser = (
  callback: (user: any) => void
) => {
  return onAuthStateChanged(
    auth,
    callback
  );
};

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";
// ==============================
// REGISTER USER
// ==============================

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  return await signupUser(
    email,
    password,
    name
  );
};

// ==============================
// CREATE USER
// ==============================

export const signupUser = async (
  
  email: string,
  password: string,
  name?: string
) => {
  const result =
    await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  if (name?.trim()) {
    await updateProfile(
      result.user,
      {
        displayName:
          name.trim(),
      }
    );
  }

  await setDoc(
    doc(
      db,
      "users",
      result.user.uid
    ),
    {
      uid: result.user.uid,

      email:
        result.user.email || "",

      name:
        name?.trim() ||
        result.user.displayName ||
        "",

      createdAt: new Date(),

      provider: "password",
    },
    {
      merge: true,
    }
  );

  return result;
};


// ==============================
// EMAIL LOGIN
// ==============================

export const loginUser = async (
  email: string,
  password: string
) => {
  try {
    return await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
  } catch (error: any) {
    switch (error?.code) {
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-credential":
        throw new Error(
          "Email or password is incorrect."
        );

      case "auth/too-many-requests":
        throw new Error(
          "Too many login attempts. Please try again later."
        );

      case "auth/network-request-failed":
        throw new Error(
          "Network problem. Please check your internet connection."
        );

      default:
        throw error;
    }
  }
};


// ==============================
// GOOGLE LOGIN
// ==============================

export const googleLogin = async () => {
  const provider =
    new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result =
    await signInWithPopup(
      auth,
      provider
    );

  await setDoc(
    doc(
      db,
      "users",
      result.user.uid
    ),
    {
      uid: result.user.uid,

      email:
        result.user.email || "",

      name:
        result.user.displayName || "",

      photoURL:
        result.user.photoURL || "",

      provider: "google",

      updatedAt: new Date(),
    },
    {
      merge: true,
    }
  );

  return result;
};


// ==============================
// PHONE OTP
// ==============================

export const sendPhoneOTP = async (
  phoneNumber: string,
  containerId: string
) => {
  let verifier: RecaptchaVerifier;

  const existing =
    (window as any).__nightNowRecaptcha;

  if (existing) {
    verifier = existing;
  } else {
    verifier =
      new RecaptchaVerifier(
        auth,
        containerId,
        {
          size: "invisible",
        }
      );

    (
      window as any
    ).__nightNowRecaptcha =
      verifier;
  }

  try {
    return await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier
    );
  } catch (error) {
    try {
      verifier.clear();

      (
        window as any
      ).__nightNowRecaptcha =
        null;
    } catch {}

    throw error;
  }
};


// ==============================
// RESET PASSWORD
// ==============================

export const resetPassword = async (
  email: string
) => {
  const {
    sendPasswordResetEmail,
  } = await import(
    "firebase/auth"
  );

  return await sendPasswordResetEmail(
    auth,
    email.trim()
  );
};


// ==============================
// LOGOUT
// ==============================

export const logoutUser = async () => {
  await signOut(auth);
};


// ==============================
// GET USER PROFILE
// ==============================

export const getUserProfile = async (
  uid: string
) => {
  const snapshot =
    await getDoc(
      doc(db, "users", uid)
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};