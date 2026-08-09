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
      const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (
        user &&
        adminEmail &&
        user.email?.toLowerCase() ===
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
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    const adminEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (
      adminEmail &&
      email.trim().toLowerCase() !==
        adminEmail.toLowerCase()
    ) {
      alert("This account is not an admin account");
      return;
    }

    setLoading(true);

    try {
      await loginUser(email, password);

      router.replace("/admin");
    } catch (error: any) {
      console.error(error);

      alert(
        error?.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : error?.message || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-5 text-white">

      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6">

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

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="Admin Email"
          className="mb-4 w-full rounded-lg bg-zinc-800 p-3 outline-none"
        />

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Admin Password"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              login();
            }
          }}
          className="mb-5 w-full rounded-lg bg-zinc-800 p-3 outline-none"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Logging In..." : "Admin Login"}
        </button>

      </div>

    </main>
  );
}