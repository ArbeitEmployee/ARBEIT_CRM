// staff-login.jsx
import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const StaffLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const newErrors = {
      email: !email ? "Email is required" : "",
      password: !password ? "Password is required" : "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== "")) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    // Simulate login process
    setTimeout(() => {
      // Frontend simulation - in real app, you'd call your API
      const simulatedStaffData = {
        id: "STAFF001",
        name: "John Doe",
        email: email,
        department: "Administration",
        position: "Staff Member",
        employeeId: "EMP2024001",
        role: "staff",
      };

      toast.success("Staff login successful!");

      // Save staff data in localStorage (simulation)
      localStorage.setItem("crm_staff_token", "simulated_staff_token_12345");
      localStorage.setItem("crm_staff", JSON.stringify(simulatedStaffData));

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem("crm_staff_email", email);
      } else {
        localStorage.removeItem("crm_staff_email");
      }

      // Redirect to staff dashboard
      setTimeout(() => {
        navigate("/staff/dashboard");
      }, 1000);

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
        <h2 className="text-2xl font-bold text-white">
          Welcome to CRM Staff Portal
        </h2>
        <p className="text-sm text-gray-300">Login to your staff account</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-80 p-6 rounded-xl shadow-xl text-white">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
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
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm">Password</label>
              <Link
                to="/staff/forgot-password"
                className="text-xs text-gray-100 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: "" });
                }}
                className={`w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.password ? "focus:ring-red-500" : "focus:ring-gray-700"
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="accent-gray-100 mr-2"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label htmlFor="remember" className="text-sm">
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold text-sm py-2 rounded-md transition ${
              loading
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-white text-[#0c123d] hover:bg-gray-200"
            }`}
          >
            {loading ? "Logging in..." : "STAFF LOGIN"}
          </button>
        </form>

        {/* Registration Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have a staff account?{" "}
          <Link
            to="/staff/registration"
            className="text-white hover:underline font-medium"
          >
            Register as Staff
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StaffLogin;
