import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export const isAdmin = async (
  email: string
) => {
  const snap = await getDoc(
    doc(db, "admins", email)
  );

  return snap.exists();
};