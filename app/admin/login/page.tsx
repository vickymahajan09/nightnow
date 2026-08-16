"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  checkUser,
  googleLogin,
} from "../../services/authService";

export default function AdminLoginPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      checkUser(
        (user: any) => {
          if (!user) return;

          const adminEmail =
            (process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
              "mahajanvicky04@gmail.com")
              .trim()
              .toLowerCase();

          if (
            adminEmail &&
            user.email
              ?.trim()
              .toLowerCase() ===
              adminEmail
          ) {
            router.replace(
              "/admin"
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [router]);

  const loginWithGoogle =
    async () => {
      if (loading) return;

      setLoading(true);

      try {
        const result =
          await googleLogin();

        const loggedEmail =
          result.user.email
            ?.trim()
            .toLowerCase();

        const adminEmail =
          (process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
            "mahajanvicky04@gmail.com")
            .trim()
            .toLowerCase();

        if (
          loggedEmail !==
          adminEmail
        ) {
          alert(
            "Ye Google account Admin account nahi hai."
          );

          return;
        }

        router.replace(
          "/admin"
        );
      } catch (error: any) {
        console.error(
          "Google Admin Login Error:",
          error
        );

        if (
          error?.code ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        if (
          error?.code ===
          "auth/popup-blocked"
        ) {
          alert(
            "Browser ne Google popup block kiya hai. Please popup allow karein."
          );

          return;
        }

        alert(
          error?.message ||
            "Google Admin Login Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 text-white">

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3f3f46,transparent_55%)]" />

      <div className="relative w-full max-w-md">

        <div className="overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl">

          {/* LOGO */}

          <div className="text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-400 text-4xl text-black shadow-lg">
              🌙
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Night
              <span className="text-yellow-400">
                Now
              </span>
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Primary Admin Login
            </p>
          </div>

          {/* GOOGLE */}

          <button
            type="button"
            onClick={
              loginWithGoogle
            }
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg">
              G
            </span>

            {loading
              ? "Opening Google..."
              : "Continue with Google"}
          </button>

          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-400/5 p-4">

            <p className="text-center text-xs leading-5 text-zinc-400">
              Primary Admin ke liye
              Gmail/password enter
              karne ki zarurat nahi hai.
              <br />
              <span className="font-bold text-yellow-400">
                Google Account select
                karein.
              </span>
            </p>

          </div>

          <button
            onClick={() =>
              router.push("/")
            }
            className="mt-5 w-full rounded-xl bg-zinc-800 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700"
          >
            ← Back to Night Now
          </button>

        </div>
      </div>
    </main>
  );
}