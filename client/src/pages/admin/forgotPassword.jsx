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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Title */}
      <div className="text-center mb-6">
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-white">
              Forgot Password
            </h2>
            <p className="text-xs text-gray-300">
              Enter your email to receive reset instructions
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white">Password Reset</h2>
            <p className="text-xs text-gray-300">
              We sent a code to {email || "your email"}
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white">
              Set New Password
            </h2>
            <p className="text-xs text-gray-300">
              Must be at least 6 characters
            </p>
          </>
        )}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-80 p-6 rounded-xl shadow-xl text-white">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendResetCode();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
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
                  className="w-16 h-14 text-center rounded bg-[#10194f] text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "CONTINUE"}
            </button>
            <p className="text-center text-xs mt-2">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                className="underline text-blue-400"
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
              <label className="block text-sm mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <label className="block text-sm mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        {/* Back to login link */}
        <p className="text-center text-sm mt-4">
          <a
            href="/admin/login"
            className="text-white hover:underline transition"
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
