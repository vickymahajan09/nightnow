"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type WalletEntry = {
  id: string;
  amount?: number;
  type?: string;
  reason?: string;
  description?: string;
  createdAt?: any;
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setBalance(0);
        setEntries([]);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "wallet")
        );

        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<WalletEntry, "id">),
        }));

        const total = data.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );

        setBalance(total);
        setEntries(
          [...data].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          })
        );
      } catch (error) {
        console.error("Wallet loading error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/profile" className="text-sm font-bold text-zinc-500">
          ← Profile
        </Link>

        <section className="mt-5 rounded-3xl bg-black p-6 text-white">
          <p className="text-xs font-bold text-zinc-400">NIGHT NOW WALLET</p>
          <p className="mt-3 text-4xl font-black text-yellow-400">
            ₹{balance.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-zinc-400">Available wallet balance</p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h2 className="font-black">Transaction History</h2>

          {loading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Abhi wallet me koi transaction nahi hai.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="font-bold">
                      {item.reason || item.description || item.type || "Wallet transaction"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.createdAt?.toDate?.()?.toLocaleString?.("en-IN") || ""}
                    </p>
                  </div>
                  <p className="ml-4 whitespace-nowrap font-black text-green-600">
                    +₹{Number(item.amount || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}