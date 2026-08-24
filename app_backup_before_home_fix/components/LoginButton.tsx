"use client";

import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginButton()
 {
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            alert("Welcome " + result.user.displayName);
            await setDoc(doc(db, "users", result.user.uid), {
  name: result.user.displayName,
  email: result.user.email,
  photo: result.user.photoURL,
  createdAt: new Date(),
});

      alert("Welcome " + result.user.displayName);
    } catch (error: any) {
  console.error(error);
  alert(error.code);
  alert(error.message);
}
  };

  return (
    <button
      onClick={login}
      className="rounded-lg border border-black px-4 py-2 font-semibold text-black transition hover:bg-black hover:text-white"
    >
      Login
      
    </button>
  );
}