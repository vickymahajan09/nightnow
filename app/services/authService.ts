"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";

/* =====================================================
   AUTH STATE
===================================================== */

export const checkUser = (
  callback: (user: any) => void
) => {
  return onAuthStateChanged(
    auth,
    callback
  );
};

/* =====================================================
   EMAIL LOGIN
===================================================== */

export const loginUser = async (
  email: string,
  password: string
) => {
  try {
    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      throw new Error(
        "Please enter your email."
      );
    }

    if (!password) {
      throw new Error(
        "Please enter your password."
      );
    }

    const result =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    return result;
  } catch (error: any) {
    console.error(
      "Email login error:",
      error
    );

    if (
      [
        "auth/wrong-password",
        "auth/user-not-found",
        "auth/invalid-credential",
      ].includes(
        error?.code
      )
    ) {
      throw new Error(
        "Email or password is incorrect."
      );
    }

    if (
      error?.code ===
      "auth/too-many-requests"
    ) {
      throw new Error(
        "Too many login attempts. Please try again later."
      );
    }

    throw error;
  }
};

/* =====================================================
   GOOGLE LOGIN
===================================================== */

export const googleLogin =
  async () => {
    if (
      typeof window ===
      "undefined"
    ) {
      throw new Error(
        "Google login is only available in the browser."
      );
    }

    try {
      const provider =
        new GoogleAuthProvider();

      /*
       * Force Google account selector.
       */
      provider.setCustomParameters({
        prompt:
          "select_account",
      });

      /*
       * IMPORTANT:
       * Use the same auth instance that
       * comes from lib/firebase.ts.
       */
      const result =
        await signInWithPopup(
          auth,
          provider
        );

      if (!result?.user) {
        throw new Error(
          "Google login failed."
        );
      }

      const firebaseUser =
        result.user;

      /*
       * Save / update customer profile.
       */
      await setDoc(
        doc(
          db,
          "users",
          firebaseUser.uid
        ),
        {
          uid:
            firebaseUser.uid,

          email:
            firebaseUser.email ||
            "",

          phone:
            firebaseUser.phoneNumber ||
            "",

          name:
            firebaseUser.displayName ||
            "",

          photoURL:
            firebaseUser.photoURL ||
            "",

          provider:
            "google",

          updatedAt:
            new Date(),
        },
        {
          merge: true,
        }
      );

      return result;
    } catch (error: any) {
      console.error(
        "Google login error:",
        error
      );

      if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {
        throw error;
      }

      if (
        error?.code ===
        "auth/popup-blocked"
      ) {
        throw new Error(
          "Google popup was blocked. Please allow popups in your browser."
        );
      }

      if (
        error?.code ===
        "auth/cancelled-popup-request"
      ) {
        throw error;
      }

      throw error;
    }
  };

/* =====================================================
   RECAPTCHA
===================================================== */

const getRecaptcha =
  (
    containerId: string
  ) => {
    if (
      typeof window ===
      "undefined"
    ) {
      throw new Error(
        "Phone authentication is only available in the browser."
      );
    }

    const container =
      document.getElementById(
        containerId
      );

    if (!container) {
      throw new Error(
        `Recaptcha container "${containerId}" was not found.`
      );
    }

    const existing =
      (
        window as any
      ).__nightNowRecaptcha;

    if (existing) {
      return existing as RecaptchaVerifier;
    }

    const verifier =
      new RecaptchaVerifier(
        auth,
        container,
        {
          size: "invisible",
        }
      );

    (
      window as any
    ).__nightNowRecaptcha =
      verifier;

    return verifier;
  };

/* =====================================================
   PHONE OTP
===================================================== */

export const sendPhoneOTP =
  async (
    phoneNumber: string,
    containerId =
      "recaptcha-container"
  ) => {
    const verifier =
      getRecaptcha(
        containerId
      );

    try {
      return await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier
      );
    } catch (error) {
      try {
        verifier.clear();
      } catch {}

      (
        window as any
      ).__nightNowRecaptcha =
        null;

      throw error;
    }
  };

/* =====================================================
   SAVE PHONE USER
===================================================== */

export const savePhoneUserProfile =
  async (
    user: any,
    name = ""
  ) => {
    if (!user?.uid) {
      throw new Error(
        "Invalid phone user."
      );
    }

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        uid:
          user.uid,

        phone:
          user.phoneNumber ||
          "",

        name:
          name.trim() ||
          user.displayName ||
          "",

        provider:
          "phone",

        updatedAt:
          new Date(),
      },
      {
        merge: true,
      }
    );
  };

/* =====================================================
   REGISTER
===================================================== */

export const registerUser =
  async (
    name: string,
    email: string,
    password: string
  ) => {
    const cleanEmail =
      email.trim();

    const result =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const cleanName =
      name.trim();

    if (cleanName) {
      await updateProfile(
        result.user,
        {
          displayName:
            cleanName,
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
        uid:
          result.user.uid,

        email:
          result.user.email ||
          "",

        phone:
          result.user.phoneNumber ||
          "",

        name:
          cleanName,

        photoURL:
          result.user.photoURL ||
          "",

        provider:
          "password",

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      },
      {
        merge: true,
      }
    );

    return result;
  };

/* =====================================================
   SIGNUP
===================================================== */

export const signupUser =
  async (
    email: string,
    password: string,
    name?: string
  ) => {
    return registerUser(
      name || "",
      email,
      password
    );
  };

/* =====================================================
   RESET PASSWORD
===================================================== */

export const resetPassword =
  async (
    email: string
  ) => {
    return sendPasswordResetEmail(
      auth,
      email.trim()
    );
  };

/* =====================================================
   LOGOUT
===================================================== */

export const logoutUser =
  async () => {
    try {
      await signOut(auth);

      if (
        typeof window !==
        "undefined"
      ) {
        try {
          (
            window as any
          ).__nightNowRecaptcha?.clear();
        } catch {}

        (
          window as any
        ).__nightNowRecaptcha =
          null;
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      throw error;
    }
  };

/* =====================================================
   GET USER PROFILE
===================================================== */

export const getUserProfile =
  async (
    uid: string
  ) => {
    if (!uid) {
      return null;
    }

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );

    if (
      !snapshot.exists()
    ) {
      return null;
    }

    return {
      id:
        snapshot.id,
      ...snapshot.data(),
    };
  };