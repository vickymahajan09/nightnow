"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  checkUser,
  googleLogin,
  loginUser,
} from "../services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      checkUser((user) => {
        if (user) {
          router.replace("/");
        }
      });

    return () =>
      unsubscribe();
  }, [router]);

  const handleEmailLogin =
    async () => {
      if (loading || googleLoading) {
        return;
      }

      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        alert("Please enter your email.");
        return;
      }

      if (!password) {
        alert(
          "Please enter your password."
        );
        return;
      }

      setLoading(true);

      try {
        await loginUser(
          cleanEmail,
          password
        );

        router.replace("/");
      } catch (error: any) {
        console.error(
          "Login error:",
          error
        );

        alert(
          error?.message ||
            "Login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleGoogleLogin =
    async () => {
      if (loading || googleLoading) {
        return;
      }

      setGoogleLoading(true);

      try {
        const result =
          await googleLogin();

        if (!result?.user) {
          throw new Error(
            "Google login failed."
          );
        }

        /*
         * Firebase Auth session is now created.
         * Redirect only after signInWithPopup
         * and user profile save have completed.
         */
        router.replace("/");
      } catch (error: any) {
        console.error(
          "Google login error:",
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
            "Google popup blocked hai. Browser mein popup allow karein."
          );

          return;
        }

        alert(
          error?.message ||
            "Google login failed. Please try again."
        );
      } finally {
        setGoogleLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">

      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">

        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

          {/* LOGO */}

          <div className="text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-400 text-4xl text-black">
              🌙
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Night
              <span className="text-yellow-400">
                Now
              </span>
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Login to continue shopping
            </p>

          </div>

          {/* GOOGLE */}

          <button
            type="button"
            onClick={
              handleGoogleLogin
            }
            disabled={
              loading ||
              googleLoading
            }
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-black">
              G
            </span>

            {googleLoading
              ? "Signing in..."
              : "Continue with Google"}
          </button>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs font-bold text-zinc-500">
              OR
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* EMAIL */}

          <label className="mb-2 block text-sm font-bold text-zinc-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                void handleEmailLogin();
              }
            }}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
          />

          {/* PASSWORD */}

          <label className="mb-2 mt-4 block text-sm font-bold text-zinc-300">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                void handleEmailLogin();
              }
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
          />

          {/* LOGIN */}

          <button
            type="button"
            onClick={
              handleEmailLogin
            }
            disabled={
              loading ||
              googleLoading
            }
            className="mt-5 w-full rounded-xl bg-yellow-400 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {/* REGISTER */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/register"
              )
            }
            className="mt-4 w-full rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            Create New Account
          </button>

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-4 w-full text-sm font-bold text-zinc-500 hover:text-yellow-400"
          >
            ← Back to Night Now
          </button>

        </div>

      </div>

    </main>
  );
}