/* eslint-disable no-unused-vars */
// staff-forgotPassword.jsx
import React, { useState, useRef } from "react";
import { FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import backgroundImage from "../../assets/login-background.jpg";

export default function StaffForgotPassword() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const codeRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, "");
    setCode(newCode);
    setErrors({ ...errors, code: "" });

    if (value && index < code.length - 1) {
      codeRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs[index - 1].current.focus();
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      setErrors({ ...errors, email: "Email is required" });
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send reset code");
        return;
      }

      toast.success("Reset code sent to your email!");
      setStep(2);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 4) {
      setErrors({ ...errors, code: "Please enter the 4-digit code" });
      toast.error("Please enter the complete 4-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid or expired code");
        return;
      }

      toast.success("Code verified successfully!");
      setStep(3);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const verificationCode = code.join("");
    const newErrors = {
      newPassword: !newPassword
        ? "New password is required"
        : newPassword.length < 6
        ? "Password must be at least 6 characters"
        : "",
      confirmPassword: !confirmPassword
        ? "Please confirm your password"
        : confirmPassword !== newPassword
        ? "Passwords do not match"
        : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
      } else if (confirmPassword !== newPassword) {
        toast.error("Passwords do not match");
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verificationCode,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully!");
      setTimeout(() => {
        window.location.href = "/staff/login";
      }, 2000);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

      {/* Brand + Title */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-extrabold text-white shadow-lg">
          A
        </div>
        <h2 className="text-2xl font-bold text-white">Staff Password Reset</h2>
        <p className="text-sm text-slate-400">
          {step === 1 && "Enter your email to receive a reset code"}
          {step === 2 && "Enter the 4-digit code sent to your email"}
          {step === 3 && "Create your new password"}
        </p>
      </div>

      {/* Reset Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        {/* Step 1: Email Input */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-200">Staff Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your staff email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                    errors.email ? "focus:ring-red-400/50" : "focus:ring-sky-400/50"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading}
              className={`w-full font-semibold text-sm py-2.5 rounded-xl text-white shadow-md transition ${
                loading
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
              }`}
            >
              {loading ? "Sending Code..." : "SEND RESET CODE"}
            </button>
          </div>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-center text-slate-200">
                Enter 4-digit verification code
              </label>
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={codeRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-lg rounded-xl bg-white/5 text-white border border-white/10 focus:outline-none focus:ring-2 ${
                      errors.code ? "focus:ring-red-400/50" : "focus:ring-sky-400/50"
                    }`}
                  />
                ))}
              </div>
              {errors.code && (
                <p className="text-red-400 text-xs mt-1 text-center">
                  {errors.code}
                </p>
              )}
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className={`w-full font-semibold text-sm py-2.5 rounded-xl text-white shadow-md transition ${
                loading
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
              }`}
            >
              {loading ? "Verifying..." : "VERIFY CODE"}
            </button>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-200">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({ ...errors, newPassword: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? "focus:ring-red-400/50"
                      : "focus:ring-sky-400/50"
                  }`}
                />
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-200">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({ ...errors, confirmPassword: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "focus:ring-red-400/50"
                      : "focus:ring-sky-400/50"
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className={`w-full font-semibold text-sm py-2.5 rounded-xl text-white shadow-md transition ${
                loading
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
              }`}
            >
              {loading ? "Resetting..." : "RESET PASSWORD"}
            </button>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            to="/staff/login"
            className="text-sm text-sky-400 hover:underline"
          >
            ← Back to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
