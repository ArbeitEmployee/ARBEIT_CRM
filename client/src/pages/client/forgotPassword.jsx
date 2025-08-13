import React, { useState, useRef } from "react";
import { FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import backgroundImage from "../../assets/login-background.jpg";

export default function ForgotPassword() {
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
    confirmPassword: ""
  });

  const codeRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, "");
    setCode(newCode);
    setErrors({...errors, code: ""});

    if (value && index < code.length - 1) {
      codeRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
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
      setErrors({...errors, email: "Email is required"});
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({...errors, email: "Please enter a valid email"});
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/client/forgot-password", {
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
      setErrors({...errors, code: "Please enter complete code"});
      return;
    }
    const codeString = code.join("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/client/verify-reset-code", {
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
      setErrors({...errors, newPassword: "Password must be at least 6 characters"});
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({...errors, confirmPassword: "Passwords do not match"});
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/client/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      toast.success("Password reset successful! Redirecting to login...");
      
      setTimeout(() => {
        window.location.href = "/client/login";
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
            <h2 className="text-lg font-semibold text-white">Forgot Password</h2>
            <p className="text-xs text-gray-300">
              Enter your email to receive reset instructions
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white">Password Reset</h2>
            <p className="text-xs text-gray-300">We sent a code to {email || "your email"}</p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white">Set New Password</h2>
            <p className="text-xs text-gray-300">Must be at least 6 characters</p>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({...errors, email: ""});
                }}
                className={`w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.email ? "focus:ring-red-500" : "focus:ring-gray-700"
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
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
                  className={`w-16 h-14 text-center rounded bg-[#10194f] text-white text-lg font-semibold focus:outline-none focus:ring-2 ${
                    errors.code ? "focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
              ))}
            </div>
            {errors.code && <p className="text-red-400 text-xs -mt-6 mb-2">{errors.code}</p>}
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
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({...errors, newPassword: ""});
                }}
                className={`w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.newPassword ? "focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                required
              />
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter your confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({...errors, confirmPassword: ""});
                }}
                className={`w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.confirmPassword ? "focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                required
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
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
          <Link to="/client/login" className="text-white hover:underline transition">
            ← Back to log in
          </Link>
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