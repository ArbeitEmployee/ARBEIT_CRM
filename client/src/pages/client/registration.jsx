import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiGlobe, FiBriefcase, FiLock, FiHome, FiMapPin, FiKey } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const ClientRegistration = () => {
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
    zipCode: ""
  });

  const [customerCode, setCustomerCode] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [errors, setErrors] = useState({});
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("http://localhost:5000/api/customers/validate-code", {
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
        setFormData(prev => ({
          ...prev,
          companyName: data.customer.company,
          email: data.customer.email || ""
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

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      companyName: formData.companyName
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
        customerCode
      };

      const res = await fetch("http://localhost:5000/api/client/register", {
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
        <h2 className="text-2xl font-bold text-white">Welcome to CRM</h2>
        <p className="text-sm text-gray-300">Register your new client account</p>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-4xl bg-[#0c123d] bg-opacity-80 p-6 rounded-xl shadow-xl text-white">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Customer Code Validation */}
          <div className="mb-6 p-4 bg-[#10194f] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Step 1: Validate Your Customer Code</h3>
            
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm mb-1">Customer Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiKey className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your customer code (e.g., CUST-ABC123)"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    disabled={codeValidated}
                    className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#0a0f30] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      codeError ? "focus:ring-red-500 border border-red-500" : "focus:ring-blue-500"
                    } ${codeValidated ? "opacity-70" : ""}`}
                  />
                </div>
                {codeError && <p className="text-red-400 text-xs mt-1">{codeError}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  This code was provided by your account manager
                </p>
              </div>
              
              <button
                type="button"
                onClick={validateCode}
                disabled={validatingCode || codeValidated}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {validatingCode ? "Validating..." : codeValidated ? "✓ Validated" : "Validate Code"}
              </button>
            </div>

            {customerInfo && (
              <div className="mt-4 p-3 bg-green-900/20 rounded border border-green-800/50">
                <p className="text-green-400 text-sm">
                  ✓ Validated for: <strong>{customerInfo.company}</strong> ({customerInfo.contact})
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
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                    Primary Contact Information
                  </h3>
                  <div className="space-y-4">

                    {/* Name */}
                    <div>
                      <label className="block text-sm mb-1">Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.name ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.phone ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm mb-1">Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiGlobe className="text-gray-400" />
                        </div>
                        <input
                          type="url"
                          name="website"
                          placeholder="Enter your website address"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm mb-1">Position</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="position"
                          placeholder="Enter your position"
                          value={formData.position}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.password ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm mb-1">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          placeholder="Enter your confirm password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.confirmPassword ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>

                {/* Right Column - Company Information */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm mb-1">Company Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHome className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="companyName"
                          placeholder="Enter your company name"
                          value={formData.companyName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.companyName ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
                    </div>

                    {/* VAT Number */}
                    <div>
                      <label className="block text-sm mb-1">VAT Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="vatNumber"
                          placeholder="Enter your vat number"
                          value={formData.vatNumber}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* Company Phone */}
                    <div>
                      <label className="block text-sm mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="companyPhone"
                          placeholder="Enter your phone number"
                          value={formData.companyPhone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.companyPhone ? "focus:ring-red-500" : "focus:ring-gray-700"}`}
                        />
                      </div>
                      {errors.companyPhone && <p className="text-red-400 text-xs mt-1">{errors.companyPhone}</p>}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm mb-1">Country</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="country"
                          placeholder="Enter your country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm mb-1">City</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          placeholder="Enter your city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm mb-1">Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="address"
                          placeholder="Enter your address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                      </div>
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm mb-1">Zip Code</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMapPin className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="Enter your zip code"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700"
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
                className={`w-full bg-white text-[#0c123d] font-semibold text-sm py-2 rounded-md hover:bg-gray-200 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Registering..." : "REGISTER"}
              </button>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <Link to="/client/login" className="text-white hover:underline font-medium">
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ClientRegistration;