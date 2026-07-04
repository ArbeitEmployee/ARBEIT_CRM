/* eslint-disable no-unused-vars */
// staff-login.jsx
import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const StaffLogin = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

    try {
      const res = await fetch(`${API_BASE_URL}/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      toast.success("Staff login successful!");

      // Save staff data in localStorage
      localStorage.setItem("crm_staff_token", data.token);
      localStorage.setItem("crm_staff", JSON.stringify(data.staff));

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
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
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
        <p className="text-sm text-slate-400">Login to your staff account</p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-slate-200">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="Enter your staff email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                  errors.email ? "focus:ring-red-400/50" : "focus:ring-sky-400/50"
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
              <label className="text-sm text-slate-200">Password</label>
              <Link
                to="/staff/forgot-password"
                className="text-xs text-sky-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-slate-400" />
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: "" });
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 ${
                  errors.password ? "focus:ring-red-400/50" : "focus:ring-sky-400/50"
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
              className="accent-sky-500 mr-2"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label htmlFor="remember" className="text-sm text-slate-200">
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold text-sm py-2.5 rounded-xl text-white shadow-md transition ${
              loading
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
            }`}
          >
            {loading ? "Logging in..." : "STAFF LOGIN"}
          </button>
        </form>

        {/* Registration Link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have a staff account?{" "}
          <Link
            to="/staff/registration"
            className="text-sky-400 hover:underline font-medium"
          >
            Register as Staff
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StaffLogin;
