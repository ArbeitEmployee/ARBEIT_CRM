// staff-registration.jsx
import { useState } from "react";
import { FiMail, FiLock, FiUser, FiKey } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const StaffRegistration = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [staffInfo, setStaffInfo] = useState(null);
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const navigate = useNavigate();
  const emailRegex = /^\S+@\S+\.\S+$/;

  const getInputClasses = (hasError) =>
    `w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
      hasError
        ? "border border-red-500 focus:ring-red-400"
        : "focus:ring-blue-400"
    }`;

  // Validate staff code (frontend simulation)
  const validateCode = async () => {
    if (!staffCode) {
      setCodeError("Staff registration code is required");
      return;
    }

    setValidatingCode(true);
    setCodeError("");

    // Simulate API call delay
    setTimeout(() => {
      // Frontend validation simulation
      const validCodes = ["STAFF-2024", "STAFF-ADMIN", "STAFF-RECRUIT"];
      if (validCodes.includes(staffCode.toUpperCase())) {
        const simulatedStaffInfo = {
          company: "CRM System Inc.",
          department: getDepartmentFromCode(staffCode),
          contact: "HR Department",
        };

        setStaffInfo(simulatedStaffInfo);
        setCodeValidated(true);
        toast.success("Staff code validated successfully!");
      } else {
        setCodeError("Invalid staff registration code");
        setStaffInfo(null);
        setCodeValidated(false);
      }
      setValidatingCode(false);
    }, 1500);
  };

  const getDepartmentFromCode = (code) => {
    const codeMap = {
      "STAFF-2024": "General",
      "STAFF-ADMIN": "Administration",
      "STAFF-RECRUIT": "HR",
    };
    return codeMap[code.toUpperCase()] || "General";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!codeValidated || !staffInfo) {
      toast.error("Please validate your staff registration code first");
      return;
    }

    // Validate form fields
    const nameErr = name.trim() === "";
    const emailErr = !emailRegex.test(email);
    const passErr = password.length < 6;
    const confirmErr = confirmPassword !== password || confirmPassword === "";

    if (nameErr || emailErr || passErr || confirmErr) {
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
      });

      if (nameErr) {
        toast.error("Please fill up the name field.");
        return;
      }
      if (emailErr) {
        toast.error("Please enter a valid email.");
        return;
      }
      if (passErr) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      if (confirmErr) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    // Simulate registration process
    setTimeout(() => {
      toast.success("Staff registration successful! Please login.");
      navigate("/staff/login");
      setLoading(false);
    }, 2000);
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
        <h2 className="text-2xl font-bold text-white">
          Welcome to CRM Staff Portal
        </h2>
        <p className="text-sm text-gray-300">Register your new staff account</p>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-90 p-6 rounded-xl shadow-2xl text-white">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Staff Code Validation */}
          {!codeValidated && (
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
                      placeholder="Enter staff code (e.g., STAFF-2024)"
                      value={staffCode}
                      onChange={(e) =>
                        setStaffCode(e.target.value.toUpperCase())
                      }
                      className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#0a0f30] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        codeError
                          ? "focus:ring-red-500 border border-red-500"
                          : "focus:ring-blue-500"
                      }`}
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
                  disabled={validatingCode}
                  className="w-full bg-blue-600 text-white font-semibold text-sm py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {validatingCode ? "Validating..." : "Validate Code"}
                </button>
              </div>

              {staffInfo && (
                <div className="mt-3 p-3 bg-green-900/20 rounded border border-green-800/50">
                  <p className="text-green-400 text-sm text-center">
                    ✓ Validated for: <strong>{staffInfo.company}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {codeValidated && (
            <>
              {/* Registration Form - Similar to Admin Signup */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2 text-center">
                  Step 2: Complete Registration
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <FiUser className="text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      className={getInputClasses(
                        touched.name && name.trim() === ""
                      )}
                    />
                  </div>
                  {touched.name && name.trim() === "" && (
                    <p className="text-red-400 text-xs mt-1">
                      Please fill up the name field.
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <FiMail className="text-gray-400" />
                    </span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      className={getInputClasses(
                        touched.email && (!email || !emailRegex.test(email))
                      )}
                    />
                  </div>
                  {touched.email && !email && (
                    <p className="text-red-400 text-xs mt-1">
                      Please fill up the email field.
                    </p>
                  )}
                  {touched.email && email && !emailRegex.test(email) && (
                    <p className="text-red-400 text-xs mt-1">
                      Please enter a valid email.
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <FiLock className="text-gray-400" />
                    </span>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, password: true }))
                      }
                      className={getInputClasses(
                        touched.password && password.length < 6
                      )}
                    />
                  </div>
                  {touched.password && password.length === 0 && (
                    <p className="text-red-400 text-xs mt-1">
                      Please fill up the password field.
                    </p>
                  )}
                  {touched.password &&
                    password.length > 0 &&
                    password.length < 6 && (
                      <p className="text-red-400 text-xs mt-1">
                        Password must be at least 6 characters.
                      </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <FiLock className="text-gray-400" />
                    </span>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, confirmPassword: true }))
                      }
                      className={getInputClasses(
                        touched.confirmPassword &&
                          (confirmPassword === "" ||
                            confirmPassword !== password)
                      )}
                    />
                  </div>
                  {touched.confirmPassword && confirmPassword === "" && (
                    <p className="text-red-400 text-xs mt-1">
                      Please confirm your password.
                    </p>
                  )}
                  {touched.confirmPassword &&
                    confirmPassword !== "" &&
                    confirmPassword !== password && (
                      <p className="text-red-400 text-xs mt-1">
                        Passwords do not match.
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
