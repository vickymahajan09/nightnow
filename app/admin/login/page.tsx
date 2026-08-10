"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkUser,
  loginUser,
} from "../../services/authService";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = checkUser((user: any) => {
      if (!user) return;

      const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (
        adminEmail &&
        user.email &&
        user.email.toLowerCase() ===
          adminEmail.toLowerCase()
      ) {
        router.replace("/admin");
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [router]);

  const login = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("Email aur password dono bhariye.");
      return;
    }

    const adminEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    if (!adminEmail) {
      alert(
        "Admin configuration missing. Vercel Environment Variables check karein."
      );
      return;
    }

    if (cleanEmail !== adminEmail) {
      alert("Ye admin account nahi hai.");
      return;
    }

    setLoading(true);

    try {
  const result = await loginUser(
  cleanEmail,
  password
);

if (!result?.user) {
  throw new Error("Login failed");
}

if (
  result.user.email?.toLowerCase() !==
  adminEmail
) {
  alert("Admin access denied.");
  return;
}

      router.replace("/admin");
    } catch (error: any) {
      console.error("ADMIN LOGIN ERROR:", error);

      switch (error?.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          alert(
            "Email ya password incorrect hai."
          );
          break;

        case "auth/too-many-requests":
          alert(
            "Bahut baar login try hua hai. Thodi der baad try karein."
          );
          break;

        case "auth/network-request-failed":
          alert(
            "Internet connection check karein."
          );
          break;

        default:
          alert(
            error?.message ||
              "Admin login failed."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

        {/* LOGO */}
        <div className="mb-8 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-400 text-4xl text-black">
            ⚡
          </div>

          <h1 className="mt-5 text-3xl font-black text-yellow-400">
            Night Now
          </h1>

          <p className="mt-2 text-zinc-400">
            Admin Panel
          </p>

        </div>

        {/* EMAIL */}
        <label className="mb-2 block text-sm font-semibold text-zinc-300">
          Admin Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="Enter admin email"
          autoComplete="email"
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-white outline-none transition focus:border-yellow-400"
        />

        {/* PASSWORD */}
        <label className="mb-2 block text-sm font-semibold text-zinc-300">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Enter admin password"
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              login();
            }
          }}
          className="mb-5 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-white outline-none transition focus:border-yellow-400"
        />

        {/* LOGIN */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Logging In..."
            : "Admin Login"}
        </button>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Night Now Admin Panel
        </p>

      </div>
    </main>
  );
}