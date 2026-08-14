"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  googleLogin,
  sendPhoneOTP,
} from "../services/authService";

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] =
    useState("");

  const [otp, setOtp] =
    useState("");

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
    const email =
      user?.email
        ?.trim()
        .toLowerCase();

    if (
      email ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace(
        "/admin"
      );

      return;
    }

    router.replace("/");
  };

  const handleGoogleLogin =
    async () => {
      if (loading) return;

      setLoading(true);

      try {
        const result =
          await googleLogin();

        goAfterLogin(
          result.user
        );
      } catch (error: any) {
        console.error(
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
            "Google popup blocked hai. Browser popup allow karein."
          );

          return;
        }

        alert(
          error?.message ||
            "Google login failed."
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
        !cleanPhone.startsWith(
          "+91"
        ) ||
        cleanPhone.length !== 13
      ) {
        alert(
          "Enter valid Indian mobile number with +91."
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
      } catch (error: any) {
        alert(
          error?.message ||
            "OTP send failed."
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
          "Enter valid 6 digit OTP."
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
            "Invalid OTP."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-10 text-white">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3f3f46,transparent_55%)]" />

      <div className="relative mx-auto max-w-md">

        <Link
          href="/"
          className="text-sm font-bold text-zinc-500"
        >
          ← Back to Night Now
        </Link>

        <section className="mt-5 overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

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

            <p className="mt-2 text-sm text-zinc-500">
              Login / Continue
            </p>
          </div>

          {/* GOOGLE */}

          <button
            type="button"
            onClick={
              handleGoogleLogin
            }
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-black text-black hover:bg-zinc-200 disabled:opacity-60"
          >
            <span className="text-lg font-black">
              G
            </span>

            {loading
              ? "Opening Google..."
              : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs text-zinc-600">
              OR
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* PHONE */}

          <p className="mb-3 text-sm font-black">
            Mobile Number
          </p>

          <input
            type="tel"
            value={phone}
            disabled={otpSent}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="+91 9876543210"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 p-4 outline-none focus:border-yellow-400"
          />

          {!otpSent ? (
            <button
              onClick={
                handleSendOTP
              }
              disabled={loading}
              className="mt-3 w-full rounded-2xl bg-yellow-400 py-4 font-black text-black disabled:opacity-60"
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          ) : (
            <>
              <input
                value={otp}
                maxLength={6}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter 6 digit OTP"
                className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-800 p-4 text-center text-xl font-black tracking-[0.4em] outline-none focus:border-yellow-400"
              />

              <button
                onClick={
                  handleVerifyOTP
                }
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-yellow-400 py-4 font-black text-black disabled:opacity-60"
              >
                {loading
                  ? "Verifying..."
                  : "Verify & Continue"}
              </button>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setConfirmationResult(
                    null
                  );
                }}
                className="mt-3 w-full py-2 text-xs font-bold text-zinc-500"
              >
                Change Number
              </button>
            </>
          )}

          <div
            id="recaptcha-container"
            className="hidden"
          />

          <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
            Continue karke aap Night Now
            ke terms aur privacy policy
            accept karte hain.
          </p>

        </section>

      </div>
    </main>
  );
}