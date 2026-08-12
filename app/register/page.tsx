"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPhoneOTP, savePhoneUserProfile } from "../services/authService";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getPhone = () => {
    const digits = phone.replace(/\D/g, "").replace(/^91/, "");
    return digits.length === 10 ? `+91${digits}` : "";
  };

  const sendOTP = async () => {
    if (!name.trim()) return alert("Please enter your name.");
    const cleanPhone = getPhone();
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
    if (!confirmationResult || otp.length !== 6) return alert("Enter valid 6 digit OTP.");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await savePhoneUserProfile(result.user, name);
      alert("Account created successfully.");
      router.replace("/");
    } catch (error: any) {
      alert(error?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-black">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="text-sm font-bold text-zinc-500">← Back to Login</Link>
        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-500">Mobile OTP se account banayein</p>
          <div className="mt-7 space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" disabled={otpSent} className="w-full rounded-xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
            {!otpSent && <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number" className="w-full rounded-xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />}
            {otpSent && <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 Digit OTP" className="w-full rounded-xl bg-zinc-100 p-4 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-yellow-400" />}
            <button onClick={otpSent ? verifyOTP : sendOTP} disabled={loading} className="w-full rounded-xl bg-yellow-400 py-4 font-black disabled:opacity-50">
              {loading ? "Please wait..." : otpSent ? "Verify OTP & Create Account" : "Send OTP"}
            </button>
            {otpSent && <button onClick={() => { setOtpSent(false); setOtp(""); setConfirmationResult(null); }} className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-bold">Change Number</button>}
          </div>
          <div id="recaptcha-container" className="mt-3" />
        </div>
      </div>
    </main>
  );
}
