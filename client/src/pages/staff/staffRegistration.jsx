// staff-registration.jsx
import { useState } from "react";
import { FiMail, FiLock, FiUser, FiKey } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const StaffRegistration = () => {
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
      const res = await fetch("http://localhost:5000/api/staff/validate-code", {
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

      const res = await fetch("http://localhost:5000/api/staff/register", {
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
    `w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
      hasError
        ? "border border-red-500 focus:ring-red-400"
        : "focus:ring-blue-400"
    }`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Welcome to CRM Staff Portal
        </h2>
        <p className="text-sm text-gray-300">Register your new staff account</p>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-90 p-6 rounded-xl shadow-2xl text-white">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Staff Code Validation */}
          <div className="mb-4 p-4 bg-[#10194f] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 text-center">
              Step 1: Validate Staff Code
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">
                  Staff Registration Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter staff code (e.g., STAFF-ABC123)"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                    disabled={codeValidated}
                    className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#0a0f30] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      codeError
                        ? "focus:ring-red-500 border border-red-500"
                        : "focus:ring-blue-500"
                    } ${codeValidated ? "opacity-70" : ""}`}
                  />
                </div>
                {codeError && (
                  <p className="text-red-400 text-xs mt-1">{codeError}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  This code is provided by your HR department
                </p>
              </div>

              <button
                type="button"
                onClick={validateCode}
                disabled={validatingCode || codeValidated}
                className="w-full bg-blue-600 text-white font-semibold text-sm py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {validatingCode
                  ? "Validating..."
                  : codeValidated
                  ? "✓ Validated"
                  : "Validate Code"}
              </button>
            </div>

            {staffInfo && (
              <div className="mt-3 p-3 bg-green-900/20 rounded border border-green-800/50">
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
                  <label className="block text-sm mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
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
                  <label className="block text-sm mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
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
                  <label className="block text-sm mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
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
                  <label className="block text-sm mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
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
                  className={`w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Registering..." : "REGISTER AS STAFF"}
                </button>
              </div>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have a staff account?{" "}
            <Link
              to="/staff/login"
              className="text-white hover:underline font-medium"
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
