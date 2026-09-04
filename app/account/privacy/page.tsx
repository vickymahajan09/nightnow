"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteUser, onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function AccountPrivacyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const deleteCollectionDocs = async (userId: string, subcollection: string) => {
    const snapshot = await getDocs(
      collection(db, "users", userId, subcollection)
    );
    if (snapshot.empty) return;

    let batch = writeBatch(db);
    let count = 0;

    for (const item of snapshot.docs) {
      batch.delete(item.ref);
      count += 1;
      if (count === 450) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Delete your Night Now account permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "Final confirmation: delete this account and its saved profile data?"
    );

    if (!doubleConfirmed) return;

    setDeleting(true);

    try {
      await deleteCollectionDocs(user.uid, "addresses");
      await deleteCollectionDocs(user.uid, "wallet");
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);

      localStorage.removeItem("nightnow-location");
      localStorage.removeItem("nightnow-checkout-address");
      localStorage.removeItem("nightnow-theme");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Account deletion error:", error);
      setDeleting(false);

      if (error?.code === "auth/requires-recent-login") {
        alert("For security, please login again and then retry account deletion.");
        return;
      }

      alert(error?.message || "Account deletion failed.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="font-black">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow dark:bg-zinc-900">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-4 text-2xl font-black">Login Required</h1>
          <p className="mt-2 text-sm text-zinc-500">Please log in to access your account privacy settings.</p>
          <Link href="/login" className="mt-6 block rounded-2xl bg-yellow-400 py-3 font-black text-black">
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-24 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/profile" className="text-xs font-black text-zinc-500">
          ← Back to Profile
        </Link>

        <section className="mt-4 rounded-3xl bg-black p-6 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">Account Privacy</p>
          <h1 className="mt-2 text-3xl font-black">Privacy & Security</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Yahan aap apne account data aur account deletion ko manage kar sakte hain.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-black">Your account</h2>
          <p className="mt-2 text-xs text-zinc-500">{user.email || user.phoneNumber || "Night Now account"}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">Profile information can be updated from <Link className="font-black text-yellow-600" href="/profile">Profile</Link>.</div>
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">Saved addresses are stored under your account and can be removed from Profile.</div>
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">Theme preference is stored as part of your user profile.</div>
          </div>
        </section>

        <section id="delete-account" className="mt-4 rounded-2xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/50 dark:bg-zinc-900">
          <h2 className="font-black text-red-600">Delete Account</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Account deletion permanently removes your Firebase account and Night Now profile document. Saved addresses and wallet entries stored under your user profile are also removed.
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteAccount}
            className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting Account..." : "Delete My Account"}
          </button>
        </section>
      </div>
    </main>
  );
}
