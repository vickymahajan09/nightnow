"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  loginUser,
  googleLogin,
  sendPhoneOTP,
  resetPassword,
} from "../services/authService";

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<
    "email" | "phone"
  >("email");

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

  const [confirmationResult, setConfirmationResult] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [otpSent, setOtpSent] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const goAfterLogin = (user: any) => {
    const loggedInEmail =
      user?.email?.trim().toLowerCase();

    if (
      loggedInEmail ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace("/admin");
      return;
    }

    router.replace("/");
  };

  // =========================
  // EMAIL LOGIN
  // =========================

  const handleEmailLogin =
    async () => {
      if (!email.trim() || !password) {
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
        console.error(
          "Email login error:",
          error
        );

        alert(
          error?.message ||
            "Login failed"
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // FORGOT PASSWORD
  // =========================

  const handleForgotPassword =
    async () => {
      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        alert(
          "Please enter your email address first."
        );
        return;
      }

      setResetLoading(true);

      try {
        await resetPassword(
          cleanEmail
        );

        alert(
          "Password reset link email par bhej diya gaya hai. Apna inbox aur spam folder check karein."
        );
      } catch (error: any) {
        console.error(
          "Password reset error:",
          error
        );

        switch (error?.code) {
          case "auth/user-not-found":
            alert(
              "Is email se koi account nahi mila."
            );
            break;

          case "auth/invalid-email":
            alert(
              "Please enter a valid email address."
            );
            break;

          case "auth/too-many-requests":
            alert(
              "Bahut baar request ho chuki hai. Thodi der baad try karein."
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
                "Password reset failed."
            );
        }
      } finally {
        setResetLoading(false);
      }
    };

  // =========================
  // GOOGLE LOGIN
  // =========================

  const handleGoogleLogin =
    async () => {
      if (loading) return;

      setLoading(true);

      try {
        const result =
          await googleLogin();

        goAfterLogin(result.user);
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
            "Google login popup was blocked. Please allow popups for this site."
          );
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

  // =========================
  // SEND OTP
  // =========================

  const handleSendOTP =
    async () => {
      if (!phone.trim()) {
        alert(
          "Please enter mobile number"
        );
        return;
      }

      const cleanPhone =
        phone.replace(/\s/g, "");

      if (
        !cleanPhone.startsWith("+91")
      ) {
        alert(
          "Enter number with +91"
        );
        return;
      }

      if (
        cleanPhone.length !== 13
      ) {
        alert(
          "Please enter a valid Indian mobile number"
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

        alert(
          "OTP sent successfully"
        );
      } catch (error: any) {
        console.error(
          "OTP error:",
          error
        );

        alert(
          error?.message ||
            "Failed to send OTP"
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // VERIFY OTP
  // =========================

  const handleVerifyOTP =
    async () => {
      if (
        !confirmationResult
      ) {
        alert(
          "Please request OTP first"
        );
        return;
      }

      if (
        !otp ||
        otp.length !== 6
      ) {
        alert(
          "Please enter 6 digit OTP"
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
        console.error(
          "OTP verification error:",
          error
        );

        alert(
          error?.message ||
            "Invalid OTP"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">

      <div className="mx-auto max-w-md rounded-2xl bg-zinc-900 p-6">

        {/* LOGO */}

        <div className="text-center">

          <h1 className="text-3xl font-black text-yellow-400">
            Night Now
          </h1>

          <p className="mt-2 text-zinc-400">
            Login to your account
          </p>

        </div>

        {/* LOGIN TYPE */}

        <div className="mt-8 grid grid-cols-2 gap-2 rounded-xl bg-zinc-800 p-1">

          <button
            type="button"
            onClick={() => {
              setMode("email");
              setOtpSent(false);
              setOtp("");
            }}
            className={`rounded-lg py-3 font-bold ${
              mode === "email"
                ? "bg-yellow-400 text-black"
                : "text-zinc-400"
            }`}
          >
            Email
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setOtpSent(false);
              setOtp("");
            }}
            className={`rounded-lg py-3 font-bold ${
              mode === "phone"
                ? "bg-yellow-400 text-black"
                : "text-zinc-400"
            }`}
          >
            Mobile OTP
          </button>

        </div>

        {/* EMAIL LOGIN */}

        {mode === "email" && (
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
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
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
                className="w-full rounded-xl bg-zinc-800 p-4 pr-14 outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>

            {/* FORGOT PASSWORD */}

            <div className="text-right">

              <button
                type="button"
                onClick={
                  handleForgotPassword
                }
                disabled={resetLoading}
                className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
              >
                {resetLoading
                  ? "Sending..."
                  : "Forgot Password?"}
              </button>

            </div>

            <button
              type="button"
              onClick={
                handleEmailLogin
              }
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </div>
        )}

        {/* PHONE LOGIN */}

        {mode === "phone" && (
          <div className="mt-6 space-y-4">

            <input
              type="tel"
              placeholder="+91 8989855637"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
            />

            {!otpSent ? (
              <button
                type="button"
                onClick={
                  handleSendOTP
                }
                disabled={loading}
                className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
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
                  placeholder="Enter 6 Digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  className="w-full rounded-xl bg-zinc-800 p-4 text-center text-xl tracking-[0.5em] outline-none"
                />

                <button
                  type="button"
                  onClick={
                    handleVerifyOTP
                  }
                  disabled={loading}
                  className="w-full rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>
              </>
            )}

          </div>
        )}

        <div
          id="recaptcha-container"
          className="mt-3"
        />

        {/* DIVIDER */}

        <div className="my-6 flex items-center gap-3">

          <div className="h-px flex-1 bg-zinc-700" />

          <span className="text-sm text-zinc-500">
            OR
          </span>

          <div className="h-px flex-1 bg-zinc-700" />

        </div>

        {/* GOOGLE */}

        <button
          type="button"
          onClick={
            handleGoogleLogin
          }
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 font-bold text-black disabled:opacity-50"
        >
          <span className="text-xl">
            G
          </span>

          {loading
            ? "Please wait..."
            : "Continue with Google"}
        </button>

        {/* REGISTER */}

        <Link href="/register">
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-zinc-800 py-3 font-bold"
          >
            Create Account
          </button>
        </Link>

      </div>

    </main>
  );
}