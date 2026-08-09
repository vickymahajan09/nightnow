"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerUser } from "../services/authService";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleSignup = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      alert("Please fill all fields");
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
      console.error(
        "Registration Error:",
        error
      );

      switch (error?.code) {
        case "auth/email-already-in-use":
          alert(
            "This email is already registered. Please login."
          );
          break;

        case "auth/invalid-email":
          alert(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          alert(
            "Password must be at least 6 characters."
          );
          break;

        case "auth/network-request-failed":
          alert(
            "Network problem. Please check your internet connection."
          );
          break;

        default:
          alert(
            error?.message ||
              "Registration failed"
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">

      <div className="mx-auto max-w-md rounded-2xl bg-zinc-900 p-6">

        <div className="text-center">

          <h1 className="text-3xl font-black text-yellow-400">
            Night Now
          </h1>

          <p className="mt-2 text-zinc-400">
            Create your account
          </p>

        </div>

        <div className="mt-8 space-y-4">

          {/* NAME */}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* EMAIL */}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {/* PASSWORD */}

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
              className="w-full rounded-xl bg-zinc-800 p-4 pr-14 outline-none focus:ring-2 focus:ring-yellow-400"
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

          {/* CREATE ACCOUNT */}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </div>

        {/* LOGIN */}

        <Link href="/login">
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-zinc-800 py-3 font-bold hover:bg-zinc-700"
          >
            Already have an account? Login
          </button>
        </Link>

      </div>

    </main>
  );
}