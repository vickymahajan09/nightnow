"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerUser } from "../services/authService";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleSignup =
    async () => {
      if (
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        alert(
          "Please fill all fields"
        );
        return;
      }

      if (password.length < 6) {
        alert(
          "Password must be at least 6 characters"
        );
        return;
      }

      setLoading(true);

      try {
        await registerUser(
          name.trim(),
          email.trim(),
          password
        );

        alert(
          "Account Created Successfully"
        );

        router.replace("/");
      } catch (error: any) {
        alert(
          error?.message ||
            "Registration failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 pb-24 text-black">

      <div className="mx-auto max-w-md">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Back to Night Now
        </Link>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="text-center">

            <h1 className="text-3xl font-black">
              Night
              <span className="text-yellow-500">
                Now
              </span>
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Create your account
            </p>

          </div>

          <div className="mt-7 space-y-4">

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="w-full rounded-xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full rounded-xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-100 p-4 pr-14 outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

            <button
              type="button"
              onClick={
                handleSignup
              }
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-4 font-black disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </div>

          <div className="mt-6 border-t border-zinc-100 pt-5 text-center">

            <p className="text-sm text-zinc-500">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block font-black text-yellow-600"
            >
              Login →
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}