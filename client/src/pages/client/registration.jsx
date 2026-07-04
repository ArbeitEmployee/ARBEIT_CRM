/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiBriefcase,
  FiLock,
  FiHome,
  FiMapPin,
  FiKey,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const ClientRegistration = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    position: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    vatNumber: "",
    companyPhone: "",
    country: "",
    city: "",
    address: "",
    zipCode: "",
  });

  const [customerCode, setCustomerCode] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [errors, setErrors] = useState({});
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Validate customer code
  const validateCode = async () => {
    if (!customerCode) {
      setCodeError("Customer code is required");
      return;
    }

    setValidatingCode(true);
    setCodeError("");

    try {
      const res = await fetch(`${API_BASE_URL}/customers/validate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.message || "Failed to validate code");
        setCustomerInfo(null);
        setCodeValidated(false);
        return;
      }

      if (data.valid) {
        setCustomerInfo(data.customer);
        setCodeValidated(true);
        setFormData((prev) => ({
          ...prev,
          companyName: data.customer.company,
          email: data.customer.email || "",
        }));
        toast.success("Customer code validated successfully!");
      } else {
        setCodeError(data.message || "Invalid customer code");
        setCustomerInfo(null);
        setCodeValidated(false);
      }
    } catch (error) {
      setCodeError("Network error. Please try again.");
      setCustomerInfo(null);
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
        case "phone":
        case "companyPhone":
          if (!/^[0-9+\- ]+$/.test(value)) {
            error = "Please enter a valid phone number";
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
    e.stopPropagation();

    if (!codeValidated || !customerInfo) {
      toast.error("Please validate your customer code first");
      return;
    }

    // Validate all required fields
    const requiredFields = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      companyName: formData.companyName,
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
        customerCode,
      };

      const res = await fetch(`${API_BASE_URL}/client/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please login.");
      navigate("/client/login");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

      {/* Brand chip */}
      <div className="relative mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-white">A</span>
      </div>

      {/* Title */}
      <div className="relative text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Welcome to CRM</h2>
        <p className="text-sm text-slate-300">
          Register your new client account
        </p>
      </div>

      {/* Registration Card */}
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Customer Code Validation */}
          <div className="mb-6 p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">
              Step 1: Validate Your Customer Code
            </h3>

            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1">
                <label className="block text-sm text-slate-300 mb-1">Customer Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your customer code (e.g., CUST-ABC123)"
                    value={customerCode}
                    onChange={(e) =>
                      setCustomerCode(e.target.value.toUpperCase())
                    }
                    disabled={codeValidated}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                      codeError
                        ? "focus:ring-red-500 border-red-500"
                        : "focus:ring-sky-400/50"
                    } ${codeValidated ? "opacity-70" : ""}`}
                  />
                </div>
                {codeError && (
                  <p className="text-red-400 text-xs mt-1">{codeError}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  This code was provided by your account manager
                </p>
              </div>

              <button
                type="button"
                onClick={validateCode}
                disabled={validatingCode || codeValidated}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:brightness-110 transition disabled:opacity-50"
              >
                {validatingCode
                  ? "Validating..."
                  : codeValidated
                  ? "✓ Validated"
                  : "Validate Code"}
              </button>
            </div>

            {customerInfo && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-400/30">
                <p className="text-green-400 text-sm">
                  ✓ Validated for: <strong>{customerInfo.company}</strong> (
                  {customerInfo.contact})
                </p>
              </div>
            )}
          </div>

          {codeValidated && (
            <>
              {/* Two Column Layout */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Primary Contact Information */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Primary Contact Information
                  </h3>
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                            errors.name
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-400/50"
                          }`}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="text-slate-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                            errors.email
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-400/50"
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                            errors.phone
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-400/50"
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiGlobe className="text-slate-400" />
                        </div>
                        <input
                          type="url"
                          name="website"
                          placeholder="Enter your website address"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Position</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="position"
                          placeholder="Enter your position"
                          value={formData.position}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-slate-400" />
                        </div>

                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm
      focus:outline-none focus:ring-2 ${
        errors.password ? "focus:ring-red-500" : "focus:ring-sky-400/50"
      }`}
                        />

                        {/* Eye icon */}
                        <div
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <FiEyeOff className="text-slate-300" />
                          ) : (
                            <FiEye className="text-slate-300" />
                          )}
                        </div>
                      </div>

                      {errors.password && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-slate-400" />
                        </div>

                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Enter your confirm password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm
      focus:outline-none focus:ring-2 ${
        errors.confirmPassword ? "focus:ring-red-500" : "focus:ring-sky-400/50"
      }`}
                        />

                        {/* Eye icon */}
                        <div
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <FiEyeOff className="text-slate-300" />
                          ) : (
                            <FiEye className="text-slate-300" />
                          )}
                        </div>
                      </div>

                      {errors.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Company Information */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Company Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHome className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="companyName"
                          placeholder="Enter your company name"
                          value={formData.companyName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                            errors.companyName
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-400/50"
                          }`}
                        />
                      </div>
                      {errors.companyName && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    {/* VAT Number */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">VAT Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="vatNumber"
                          placeholder="Enter your vat number"
                          value={formData.vatNumber}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* Company Phone */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          name="companyPhone"
                          placeholder="Enter your phone number"
                          value={formData.companyPhone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                            errors.companyPhone
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-400/50"
                          }`}
                        />
                      </div>
                      {errors.companyPhone && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.companyPhone}
                        </p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Country</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="country"
                          placeholder="Enter your country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          placeholder="Enter your city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="address"
                          placeholder="Enter your address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Zip Code</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="Enter your zip code"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition ${
                  loading
                    ? "bg-slate-600 opacity-70 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
                }`}
              >
                {loading ? "Registering..." : "REGISTER"}
              </button>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-slate-400 mt-4">
            Already have an account?{" "}
            <Link
              to="/client/login"
              className="text-sky-400 hover:text-sky-300 font-medium"
            >
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ClientRegistration;
