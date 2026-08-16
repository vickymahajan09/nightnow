"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseTestPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage(
      "Signup successful. Agar email confirmation enabled hai to email check karo."
    );
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(`Login error: ${error.message}`);
      return;
    }

    setMessage("Supabase login successful ✅");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMessage("Logged out.");
  }

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">
          NightNow Supabase Test
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          Temporary authentication test
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border p-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSignup}
            disabled={loading}
            className="rounded-lg bg-yellow-400 p-3 font-bold"
          >
            Sign Up
          </button>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-lg bg-black p-3 font-bold text-white"
          >
            Login
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border p-3 font-bold"
        >
          Logout
        </button>

        {message && (
          <div className="mt-5 rounded-lg bg-gray-100 p-3 text-sm">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}