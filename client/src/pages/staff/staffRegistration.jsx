/* eslint-disable no-unused-vars */
// staff-registration.jsx
import { useState } from "react";
import { FiMail, FiLock, FiUser, FiKey } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const StaffRegistration = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [staffCode, setStaffCode] = useState("");
  const [staffInfo, setStaffInfo] = useState(null);
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // Validate staff code with backend
  const validateCode = async () => {
    if (!staffCode) {
      setCodeError("Staff registration code is required");
      return;
    }

    setValidatingCode(true);
    setCodeError("");

    try {
      const res = await fetch(`${API_BASE_URL}/staff/validate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.message || "Failed to validate code");
        setStaffInfo(null);
        setCodeValidated(false);
        return;
      }

      if (data.valid) {
        setStaffInfo(data.staff);
        setCodeValidated(true);
        setFormData((prev) => ({
          ...prev,
          email: data.staff.email || "",
        }));
        toast.success("Staff code validated successfully!");
      } else {
        setCodeError(data.message || "Invalid staff registration code");
        setStaffInfo(null);
        setCodeValidated(false);
      }
    } catch (error) {
      setCodeError("Network error. Please try again.");
      setStaffInfo(null);
      setCodeValidated(false);
    } finally {
      setValidatingCode(false);
    }
  };

  const validateField = (name, value) => {
    let error = "";

    if (!value) {
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Please enter a valid email";
          }
          break;
        case "password":
          if (value.length < 6) {
            error = "Password must be at least 6 characters";
          }
          break;
        case "confirmPassword":
          if (value !== formData.password) {
            error = "Passwords don't match";
          }
          break;
        case "name":
          if (value.trim().length < 2) {
            error = "Name must be at least 2 characters";
          }
          break;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!codeValidated || !staffInfo) {
      toast.error("Please validate your staff registration code first");
      return;
    }

    // Validate all required fields
    const requiredFields = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    let isValid = true;
    Object.entries(requiredFields).forEach(([name, value]) => {
      if (!validateField(name, value)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        ...formData,
        staffCode,
      };

      const res = await fetch(`${API_BASE_URL}/staff/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("Staff registration successful! Please login.");
      navigate("/staff/login");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInputClasses = (hasError) =>
    `w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
      hasError ? "border-red-400/60 focus:ring-red-400/50" : "focus:ring-sky-400/50"
    }`;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

      {/* Brand + Title */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-extrabold text-white shadow-lg">
          A
        </div>
        <h2 className="text-2xl font-bold text-white">
          Welcome to CRM Staff Portal
        </h2>
        <p className="text-sm text-slate-400">Register your new staff account</p>
      </div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Staff Code Validation */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-lg font-semibold text-white mb-3 text-center">
              Step 1: Validate Staff Code
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-slate-200">
                  Staff Registration Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter staff code (e.g., STAFF-ABC123)"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                    disabled={codeValidated}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                      codeError
                        ? "focus:ring-red-400/50 border-red-400/60"
                        : "focus:ring-sky-400/50"
                    } ${codeValidated ? "opacity-70" : ""}`}
                  />
                </div>
                {codeError && (
                  <p className="text-red-400 text-xs mt-1">{codeError}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  This code is provided by your HR department
                </p>
              </div>

              <button
                type="button"
                onClick={validateCode}
                disabled={validatingCode || codeValidated}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl shadow-md hover:brightness-110 transition disabled:opacity-50"
              >
                {validatingCode
                  ? "Validating..."
                  : codeValidated
                  ? "✓ Validated"
                  : "Validate Code"}
              </button>
            </div>

            {staffInfo && (
              <div className="mt-3 p-3 bg-green-500/10 rounded-xl border border-green-400/30">
                <p className="text-green-400 text-sm text-center">
                  ✓ Validated for: <strong>{staffInfo.company}</strong> (
                  {staffInfo.department})
                </p>
              </div>
            )}
          </div>

          {codeValidated && (
            <>
              {/* Registration Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2 text-center">
                  Step 2: Complete Registration
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm mb-1 text-slate-200">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-slate-400" />
                    </span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClasses(errors.name)}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-1 text-slate-200">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-slate-400" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClasses(errors.email)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm mb-1 text-slate-200">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-slate-400" />
                    </span>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClasses(errors.password)}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm mb-1 text-slate-200">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-slate-400" />
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClasses(errors.confirmPassword)}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-sm py-2.5 rounded-xl shadow-md hover:brightness-110 transition ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Registering..." : "REGISTER AS STAFF"}
                </button>
              </div>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-slate-400 mt-4">
            Already have a staff account?{" "}
            <Link
              to="/staff/login"
              className="text-sky-400 hover:underline font-medium"
            >
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default StaffRegistration;
