import React, { useState, useRef } from "react";
import { FiLock } from "react-icons/fi";
import { Link } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });

  // refs for the 4 code inputs
  const codeInputsRef = useRef([]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // restrict one char per box
    if (value && !/^\d$/.test(value)) return; // allow only digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setErrors({...errors, code: ""});

    // auto move to next input if value is valid and not last input
    if (value && index < codeInputsRef.current.length - 1) {
      codeInputsRef.current[index + 1].focus();
    }
  };

  // Optional: handle backspace to move back focus if input empty
  const handleCodeKeyDown = (e, index) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      codeInputsRef.current[index - 1].focus();
    }
  };

  const getLineClass = (lineNum) =>
    `h-1 rounded-full transition-all duration-300 ${
      step === lineNum ? "bg-white w-8" : "bg-white/30 w-6"
    }`;

  const validateStep1 = () => {
    if (!email) {
      setErrors({...errors, email: "Email is required"});
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({...errors, email: "Please enter a valid email"});
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (code.some((digit) => digit === "")) {
      setErrors({...errors, code: "Please enter complete code"});
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors = {...errors};
    let isValid = true;

    if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
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
            <h2 className="text-xl font-semibold text-white mb-2">Forgot Password</h2>
            <p className="text-sm text-gray-300 mb-4">
                Enter your email to receive reset instructions
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-2">Password Reset</h2>
            <p className="text-sm text-gray-300 mb-4">
              We sent a code to {email || "your email"}
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-2">Set New Password</h2>
            <p className="text-sm text-gray-300 mb-4">Must be at least 6 characters</p>
          </>
        )}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-80 p-6 rounded-xl shadow-xl text-white">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateStep1()) setStep(2);
            }}
            className="space-y-4"
            noValidate
          >
            <div>
              <label className="block text-sm mb-2">Email Address</label>
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
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition"
            >
              Send code
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateStep2()) setStep(3);
            }}
            className="space-y-4"
            noValidate
          >
            <div className="flex justify-between space-x-2 mb-4">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (codeInputsRef.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => handleCodeKeyDown(e, idx)}
                  className={`w-16 h-14 text-center rounded bg-[#10194f] text-white text-lg font-semibold focus:outline-none focus:ring-2 ${
                    errors.code ? "focus:ring-red-500" : "focus:ring-gray-700"
                  }`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            {errors.code && <p className="text-red-400 text-xs -mt-2 mb-2">{errors.code}</p>}
            <button
              type="submit"
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition"
            >
              CONTINUE
            </button>
            <p className="text-center text-xs mt-2">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                className="underline text-white"
                onClick={() => alert("Resend email clicked")}
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
              if (validateStep3()) {
                alert("Password reset successful!");
                setStep(1);
                setEmail("");
                setCode(["", "", "", ""]);
                setNewPassword("");
                setConfirmPassword("");
                setErrors({
                  email: "",
                  code: "",
                  newPassword: "",
                  confirmPassword: ""
                });
              }
            }}
            className="space-y-4"
            noValidate
          >
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({...errors, newPassword: ""});
                  }}
                  className={`w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.newPassword ? "focus:ring-red-500" : "focus:ring-gray-700"
                  }`}
                />
              </div>
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({...errors, confirmPassword: ""});
                  }}
                  className={`w-full px-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? "focus:ring-red-500" : "focus:ring-gray-700"
                  }`}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition"
            >
              RESET PASSWORD
            </button>
          </form>
        )}

        {/* Back to login link */}
        <p className="text-center text-sm mt-4">
          <Link
            to="/client/login"
            className="text-white hover:underline transition"
          >
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
