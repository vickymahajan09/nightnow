"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  loginUser,
  googleLogin,
  sendPhoneOTP,
} from "../services/authService";

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<"email" | "phone">(
      "email"
    );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    confirmationResult,
    setConfirmationResult,
  ] = useState<any>(null);

  const [otpSent, setOtpSent] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const goAfterLogin = (
    user: any
  ) => {
    const loggedInEmail =
      user?.email
        ?.trim()
        .toLowerCase();

    if (
      loggedInEmail ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  };

  const handleEmailLogin =
    async () => {
      if (
        !email.trim() ||
        !password
      ) {
        alert(
          "Please fill all fields"
        );
        return;
      }

      setLoading(true);

      try {
        const result =
          await loginUser(
            email.trim(),
            password
          );

        goAfterLogin(result.user);
      } catch (error: any) {
        alert(
          error?.message ||
            "Login failed"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleGoogleLogin =
    async () => {
      if (loading) return;

      setLoading(true);

      try {
        const result =
          await googleLogin();

        goAfterLogin(result.user);
      } catch (error: any) {
        if (
          error?.code ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        alert(
          error?.message ||
            "Google login failed"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleSendOTP =
    async () => {
      const cleanPhone =
        phone.replace(
          /\s/g,
          ""
        );

      if (
        !cleanPhone.startsWith("+91") ||
        cleanPhone.length !== 13
      ) {
        alert(
          "Enter valid number with +91"
        );
        return;
      }

      setLoading(true);

      try {
        const result =
          await sendPhoneOTP(
            cleanPhone,
            "recaptcha-container"
          );

        setConfirmationResult(
          result
        );

        setOtpSent(true);

        alert("OTP sent");
      } catch (error: any) {
        alert(
          error?.message ||
            "Failed to send OTP"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleVerifyOTP =
    async () => {
      if (
        !confirmationResult ||
        otp.length !== 6
      ) {
        alert(
          "Enter valid 6 digit OTP"
        );
        return;
      }

      setLoading(true);

      try {
        const result =
          await confirmationResult.confirm(
            otp
          );

        goAfterLogin(
          result.user
        );
      } catch (error: any) {
        alert(
          error?.message ||
            "Invalid OTP"
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

        <div className="mt-5 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">

          <div className="text-center">

            <h1 className="text-3xl font-black">
              Night
              <span className="text-yellow-500">
                Now
              </span>
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Login to continue shopping
            </p>

          </div>

          <div className="mt-7 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">

            <button
              type="button"
              onClick={() => {
                setMode("email");
                setOtpSent(false);
              }}
              className={`rounded-lg py-3 text-sm font-black ${
                mode === "email"
                  ? "bg-black text-white"
                  : "text-zinc-500"
              }`}
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("phone");
                setOtpSent(false);
              }}
              className={`rounded-lg py-3 text-sm font-black ${
                mode === "phone"
                  ? "bg-black text-white"
                  : "text-zinc-500"
              }`}
            >
              Mobile OTP
            </button>

          </div>

          {mode === "email" ? (
            <div className="mt-6 space-y-4">

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
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

              <button
                type="button"
                onClick={
                  handleEmailLogin
                }
                disabled={loading}
                className="w-full rounded-xl bg-yellow-400 py-4 font-black disabled:opacity-50"
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>

            </div>
          ) : (
            <div className="mt-6 space-y-4">

              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-100 p-4 outline-none"
              />

              {!otpSent ? (
                <button
                  type="button"
                  onClick={
                    handleSendOTP
                  }
                  disabled={loading}
                  className="w-full rounded-xl bg-yellow-400 py-4 font-black"
                >
                  {loading
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 Digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="w-full rounded-xl bg-zinc-100 p-4 text-center text-xl tracking-[0.5em] outline-none"
                  />

                  <button
                    type="button"
                    onClick={
                      handleVerifyOTP
                    }
                    disabled={loading}
                    className="w-full rounded-xl bg-yellow-400 py-4 font-black"
                  >
                    Verify OTP
                  </button>
                </>
              )}

            </div>
          )}

          <div
            id="recaptcha-container"
            className="mt-3"
          />

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-400">
              OR
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <button
            type="button"
            onClick={
              handleGoogleLogin
            }
            disabled={loading}
            className="w-full rounded-xl border border-zinc-200 bg-white py-4 font-black hover:bg-zinc-50"
          >
            🔵 Continue with Google
          </button>

          <Link href="/register">
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-black py-4 font-black text-white"
            >
              Create New Account
            </button>
          </Link>

        </div>
      </div>
    </main>
  );
}