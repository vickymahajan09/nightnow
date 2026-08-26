"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../lib/firebase";


/* =====================================================
   AUTH PERSISTENCE
===================================================== */

let persistencePromise:
  | Promise<void>
  | null = null;

const ensureAuthPersistence =
  async () => {

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    if (
      !persistencePromise
    ) {
      persistencePromise =
        setPersistence(
          auth,
          browserLocalPersistence
        );
    }

    await persistencePromise;
  };


/* =====================================================
   CHECK CURRENT USER
===================================================== */

export const getCurrentUser =
  (): User | null => {
    return auth.currentUser;
  };


/* =====================================================
   WAIT FOR FIREBASE AUTH
===================================================== */

export const waitForAuthUser =
  async (
    timeoutMs = 5000
  ): Promise<User | null> => {

    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    await ensureAuthPersistence();

    if (auth.currentUser) {
      return auth.currentUser;
    }

    return new Promise(
      (resolve) => {

        let finished = false;

        let unsubscribe:
          | (() => void)
          | null = null;

        const finish = (
          user: User | null
        ) => {

          if (finished) {
            return;
          }

          finished = true;

          if (unsubscribe) {
            unsubscribe();
          }

          resolve(user);
        };


        unsubscribe =
          onAuthStateChanged(
            auth,
            (user) => {

              if (user) {
                finish(user);
              }

            }
          );


        window.setTimeout(
          () => {

            finish(
              auth.currentUser
            );

          },
          timeoutMs
        );

      }
    );
  };


/* =====================================================
   CHECK USER LISTENER
===================================================== */

export const checkUser =
  (
    callback: (
      user: User | null
    ) => void
  ) => {

    return onAuthStateChanged(
      auth,
      callback
    );
  };


/* =====================================================
   SAVE USER PROFILE
===================================================== */

export const saveUserProfile =
  async (
    user: User,
    extraData: Record<
      string,
      any
    > = {}
  ) => {

    if (!user?.uid) {
      return;
    }

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const existing =
      await getDoc(
        userRef
      );

    const data: Record<
      string,
      any
    > = {
      uid: user.uid,

      email:
        user.email ||
        "",

      displayName:
        user.displayName ||
        "",

      photoURL:
        user.photoURL ||
        "",

      lastLoginAt:
        serverTimestamp(),

      ...extraData,
    };


    if (!existing.exists()) {

      data.createdAt =
        serverTimestamp();

    }


    await setDoc(
      userRef,
      data,
      {
        merge: true,
      }
    );
  };


/* =====================================================
   EMAIL LOGIN
===================================================== */

export const loginUser =
  async (
    email: string,
    password: string
  ) => {

    const cleanEmail =
      email
        .trim()
        .toLowerCase();


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


    try {

      await ensureAuthPersistence();


      const result =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );


      /*
       * IMPORTANT:
       * Firebase sign-in has completed.
       * Wait until currentUser is actually
       * available before returning.
       */

      const currentUser =
        await waitForAuthUser();


      if (!currentUser) {
        throw new Error(
          "Login successful, but Firebase session is not ready. Please try again."
        );
      }


      await saveUserProfile(
        currentUser
      );


      return currentUser;

    } catch (error: any) {

      console.error(
        "Email login error:",
        error
      );


      if (
        error?.code ===
          "auth/invalid-credential" ||
        error?.code ===
          "auth/wrong-password" ||
        error?.code ===
          "auth/user-not-found"
      ) {

        throw new Error(
          "Email or password is incorrect."
        );
      }


      if (
        error?.code ===
        "auth/invalid-email"
      ) {

        throw new Error(
          "Please enter a valid email address."
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

    try {

      await ensureAuthPersistence();


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


      const currentUser =
        await waitForAuthUser();


      if (!currentUser) {
        throw new Error(
          "Google login successful, but Firebase session is not ready."
        );
      }


      await saveUserProfile(
        currentUser
      );


      return {
        ...result,
        user: currentUser,
      };

    } catch (error: any) {

      console.error(
        "Google login error:",
        error
      );


      throw error;
    }
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

    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanName) {
      throw new Error(
        "Please enter your name."
      );
    }


    if (!cleanEmail) {
      throw new Error(
        "Please enter your email."
      );
    }


    if (!password) {
      throw new Error(
        "Please enter a password."
      );
    }


    if (password.length < 6) {
      throw new Error(
        "Password must be at least 6 characters."
      );
    }


    try {

      await ensureAuthPersistence();


      const result =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );


      const user =
        result.user;


      await updateProfile(
        user,
        {
          displayName:
            cleanName,
        }
      );


      const currentUser =
        await waitForAuthUser();


      if (!currentUser) {
        throw new Error(
          "Account created, but Firebase session is not ready."
        );
      }


      await saveUserProfile(
        currentUser,
        {
          displayName:
            cleanName,
        }
      );


      return currentUser;

    } catch (error: any) {

      console.error(
        "Registration error:",
        error
      );


      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {

        throw new Error(
          "This email is already registered."
        );
      }


      if (
        error?.code ===
        "auth/invalid-email"
      ) {

        throw new Error(
          "Please enter a valid email address."
        );
      }


      if (
        error?.code ===
        "auth/weak-password"
      ) {

        throw new Error(
          "Password must be at least 6 characters."
        );
      }


      throw error;
    }
  };


/* =====================================================
   LOGOUT
===================================================== */

export const logoutUser =
  async () => {

    await signOut(auth);

  };


/* =====================================================
   ADMIN CHECK
===================================================== */

export const isAdmin =
  async (
    email: string
  ) => {

    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      return false;
    }


    const snap =
      await getDoc(
        doc(
          db,
          "admins",
          cleanEmail
        )
      );


    return snap.exists();
  };