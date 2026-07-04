import React, { useState, useRef } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";
import backgroundImage from "../../assets/login-background.jpg";

export default function ForgotPassword() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // refs for code inputs
  const codeRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // only 1 digit allowed
    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, ""); // allow only numbers
    setCode(newCode);

    // move to next box if value entered
    if (value && index < code.length - 1) {
      codeRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // move back if deleting empty box
      codeRefs[index - 1].current.focus();
    }
  };

  const getLineClass = (lineNum) =>
    `h-1 rounded-full transition-all duration-300 ${
      step === lineNum ? "bg-white w-8" : "bg-white/30 w-6"
    }`;

  // 1. Send Reset Code to Email
  const sendResetCode = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code");
      toast.success("Reset code sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Reset Code
  const verifyCode = async () => {
    if (code.some((digit) => digit === "")) {
      toast.error("Please enter complete code");
      return;
    }
    const codeString = code.join("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid reset code");
      toast.success("Code verified. You can set a new password.");
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password
  const resetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      toast.success("Password reset successful! Redirecting to login...");

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Background image */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />

      {/* Brand + Title */}
      <div className="relative z-10 text-center mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
          A
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-300/80">
          ARBEIT CRM
        </p>
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-white mt-1">
              Forgot Password
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Enter your email to receive reset instructions
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-white mt-1">Password Reset</h2>
            <p className="text-sm text-slate-300 mt-1">
              We sent a code to {email || "your email"}
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-white mt-1">
              Set New Password
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Must be at least 6 characters
            </p>
          </>
        )}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendResetCode();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCode();
            }}
            className="space-y-4"
          >
            <div className="flex justify-between space-x-2 mb-9">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={codeRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-16 h-14 text-center rounded-xl bg-white/5 text-white text-lg font-semibold border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 tabular-nums"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "CONTINUE"}
            </button>
            <p className="text-center text-xs mt-2 text-slate-300">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                className="underline text-sky-400"
                disabled={loading}
                onClick={sendResetCode}
              >
                Resend Again
              </button>
            </p>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resetPassword();
            }}
            className="space-y-4"
          >
            <div className="relative">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((show) => !show)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((show) => !show)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        {/* Back to login link */}
        <p className="text-center text-sm mt-4">
          <a
            href="/admin/login"
            className="text-sky-400 hover:underline transition"
          >
            ← Back to log in
          </a>
        </p>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-3 mt-6">
          <div className={getLineClass(1)}></div>
          <div className={getLineClass(2)}></div>
          <div className={getLineClass(3)}></div>
        </div>
      </div>
    </div>
  );
}
