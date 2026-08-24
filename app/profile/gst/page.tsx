"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../../lib/firebase";

import {
  getCustomerProfile,
  updateGSTDetails,
} from "../../services/customerService";

export default function GSTPage() {
  const [user, setUser] =
    useState<any>(null);

  const [gstNumber, setGSTNumber] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(
            currentUser
          );

          if (!currentUser) {
            setLoading(false);
            return;
          }

          try {
            const profile =
              await getCustomerProfile();

            setGSTNumber(
              profile?.gstNumber ||
                ""
            );

            setCompanyName(
              profile?.companyName ||
                ""
            );
          } catch (
            error
          ) {
            console.error(
              "GST profile loading error:",
              error
            );
          } finally {
            setLoading(false);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const save =
    async () => {
      const gst =
        gstNumber
          .trim()
          .toUpperCase();

      if (
        gst &&
        !/^[0-9A-Z]{15}$/.test(
          gst
        )
      ) {
        alert(
          "Please enter a valid GST number."
        );

        return;
      }

      try {
        setSaving(true);

        await updateGSTDetails(
          gst,
          companyName.trim()
        );

        alert(
          "GST details saved successfully."
        );
      } catch (
        error: any
      ) {
        console.error(
          "GST save error:",
          error
        );

        alert(
          error?.message ||
            "Unable to save GST details."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">
            🧾
          </div>

          <p className="mt-4 font-black">
            Loading GST details...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black">
            Login Required
          </h1>

          <Link
            href="/login"
            className="mt-6 block rounded-xl bg-yellow-400 py-4 font-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-24 text-black">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/profile"
          className="text-sm font-black text-zinc-500"
        >
          ← Profile
        </Link>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600">
            BUSINESS DETAILS
          </p>

          <h1 className="mt-1 text-2xl font-black">
            GST Details
          </h1>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            GST details save karne ke baad
            future billing ke liye use kiye
            ja sakte hain.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-black text-zinc-500">
                Company Name
              </label>

              <input
                value={
                  companyName
                }
                onChange={(e) =>
                  setCompanyName(
                    e.target.value
                  )
                }
                placeholder="Company / Business Name"
                className="mt-2 w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-xs font-black text-zinc-500">
                GST Number
              </label>

              <input
                value={
                  gstNumber
                }
                onChange={(e) =>
                  setGSTNumber(
                    e.target.value
                      .toUpperCase()
                      .replace(
                        /\s/g,
                        ""
                      )
                      .slice(
                        0,
                        15
                      )
                  )
                }
                placeholder="15-character GSTIN"
                className="mt-2 w-full rounded-xl border border-zinc-200 p-3 text-sm uppercase outline-none focus:border-yellow-400"
              />
            </div>

            <p className="text-[10px] text-zinc-400">
              GSTIN format: 15 alphanumeric
              characters.
            </p>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                save
              }
              className="w-full rounded-xl bg-yellow-400 py-4 text-sm font-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save GST Details"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}