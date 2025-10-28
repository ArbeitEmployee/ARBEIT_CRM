// staff-forgotPassword.jsx
import React, { useState, useRef } from "react";
import { FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import backgroundImage from "../../assets/login-background.jpg";

export default function StaffForgotPassword() {
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

  const getLineClass = (lineNum) =>
    `h-1 rounded-full transition-all duration-300 ${
      step === lineNum ? "bg-white w-8" : "bg-white/30 w-6"
    }`;

  // 1. Send Reset Code to Email (Frontend Simulation)
  const sendResetCode = async () => {
    if (!email) {
      setErrors({ ...errors, email: "Email is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ ...errors, email: "Please enter a valid email" });
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Frontend validation simulation
      const validStaffEmails = [
        "staff@company.com",
        "admin@company.com",
        "hr@company.com",
      ];

      if (
        validStaffEmails.includes(email.toLowerCase()) ||
        email.includes("staff")
      ) {
        toast.success("Reset code sent to your staff email");
        setStep(2);
      } else {
        toast.error("No staff account found with this email");
      }
      setLoading(false);
    }, 1500);
  };

  // 2. Verify Reset Code (Frontend Simulation)
  const verifyCode = async () => {
    if (code.some((digit) => digit === "")) {
      setErrors({ ...errors, code: "Please enter complete code" });
      return;
    }

    const codeString = code.join("");
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Frontend validation simulation - any 4-digit code works for demo
      if (codeString.length === 4) {
        toast.success("Code verified. You can set a new password.");
        setStep(3);
      } else {
        toast.error("Invalid reset code");
      }
      setLoading(false);
    }, 1500);
  };

  // 3. Reset Password (Frontend Simulation)
  const resetPassword = async () => {
    if (newPassword.length < 6) {
      setErrors({
        ...errors,
        newPassword: "Password must be at least 6 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success("Staff password reset successful! Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/staff/login";
      }, 1500);

      setLoading(false);
    }, 1500);
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
              Staff Forgot Password
            </h2>
            <p className="text-xs text-gray-300">
              Enter your staff email to receive reset instructions
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white">
              Staff Password Reset
            </h2>
            <p className="text-xs text-gray-300">
              We sent a code to {email || "your staff email"}
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white">
              Set New Staff Password
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
              <label className="block text-sm mb-1">Staff Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your staff email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.email ? "focus:ring-red-500" : "focus:ring-gray-700"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Use your company staff email address
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
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
            <div>
              <label className="block text-sm mb-3 text-center">
                Enter the 4-digit code sent to your staff email
              </label>
              <div className="flex justify-between space-x-2 mb-6">
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
              {errors.code && (
                <p className="text-red-400 text-xs -mt-4 mb-2 text-center">
                  {errors.code}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "VERIFY CODE"}
            </button>

            <p className="text-center text-xs mt-2">
              Didn't receive the email?{" "}
              <button
                type="button"
                className="underline text-blue-400 hover:text-blue-300"
                disabled={loading}
                onClick={sendResetCode}
              >
                Resend Code
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
              <label className="block text-sm mb-1">New Staff Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({ ...errors, newPassword: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? "focus:ring-red-500"
                      : "focus:ring-blue-400"
                  }`}
                  required
                />
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">
                Confirm Staff Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({ ...errors, confirmPassword: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "focus:ring-red-500"
                      : "focus:ring-blue-400"
                  }`}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "RESET STAFF PASSWORD"}
            </button>
          </form>
        )}

        {/* Back to login link */}
        <p className="text-center text-sm mt-4">
          <Link
            to="/staff/login"
            className="text-white hover:underline transition"
          >
            ← Back to Staff Login
          </Link>
        </p>

        {/* Client Forgot Password Link */}
        <p className="text-center text-sm mt-2">
          <Link
            to="/client/forgot-password"
            className="text-gray-400 hover:text-white transition text-xs"
          >
            Are you a client? Reset client password
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
