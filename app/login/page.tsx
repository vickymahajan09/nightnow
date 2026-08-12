"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPhoneOTP, savePhoneUserProfile } from "../services/authService";

const ADMIN_EMAIL = "mahajanvicky04@gmail.com";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const normalizedPhone = () => {
    const digits = phone.replace(/\D/g, "").replace(/^91/, "");
    return digits.length === 10 ? `+91${digits}` : "";
  };

  const sendOTP = async () => {
    const cleanPhone = normalizedPhone();
    if (!cleanPhone) return alert("Enter a valid 10 digit mobile number.");
    setLoading(true);
    try {
      const result = await sendPhoneOTP(cleanPhone, "recaptcha-container");
      setConfirmationResult(result);
      setOtpSent(true);
      alert("OTP sent successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult || otp.length !== 6) return alert("Enter the 6 digit OTP.");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await savePhoneUserProfile(result.user, name);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() || ADMIN_EMAIL.toLowerCase();
      if (result.user.email?.toLowerCase() === adminEmail) router.replace("/admin");
      else router.replace("/");
    } catch (error: any) {
      alert(error?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-black">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-zinc-500">← Back to Night Now</Link>
        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-black">Night<span className="text-yellow-500">Now</span></h1>
            <p className="mt-2 text-sm text-zinc-500">Mobile number se login karein</p>
          </div>

          <div className="mt-7 space-y-4">
            {!otpSent && (
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-xl bg-zinc-100 p-4 text-lg outline-none focus:ring-2 focus:ring-yellow-400"
              />
            )}

            {otpSent && (
              <>
                <div className="rounded-xl bg-zinc-100 p-4 text-sm font-bold">OTP sent to +91 {phone}</div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl bg-zinc-100 p-4 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </>
            )}

            <button
              type="button"
              onClick={otpSent ? verifyOTP : sendOTP}
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-4 font-black disabled:opacity-50"
            >
              {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
            </button>

            {otpSent && (
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setConfirmationResult(null); }} className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-bold">
                Change Mobile Number
              </button>
            )}
          </div>

          <div id="recaptcha-container" className="mt-3" />
          <p className="mt-6 text-center text-xs text-zinc-400">OTP login is required for Night Now customers.</p>
        </div>
      </div>
    </main>
  );
}
