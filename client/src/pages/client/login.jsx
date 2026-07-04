/* eslint-disable no-unused-vars */
// ClientLogin.jsx - Updated version
import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

const ClientLogin = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

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
      const res = await fetch(`${API_BASE_URL}/client/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text || "" };
      }

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      toast.success("Login successful!");

      // Save token and client data in localStorage
      localStorage.setItem("crm_client_token", data.token);
      localStorage.setItem("crm_client", JSON.stringify(data.client));

      // Also save the customer code for data filtering
      if (data.client.customerCode) {
        localStorage.setItem(
          "crm_client_customer_code",
          data.client.customerCode
        );
      }

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem("crm_client_email", email);
      } else {
        localStorage.removeItem("crm_client_email");
      }

      // Redirect to home
      setTimeout(() => {
        navigate("/client/home");
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
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

      {/* Brand chip */}
      <div className="relative mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-white">A</span>
      </div>

      {/* Title */}
      <div className="relative text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Welcome to CRM</h2>
        <p className="text-sm text-slate-300">Login to your client account</p>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
                className={`w-full rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  errors.email ? "focus:ring-red-500" : "focus:ring-sky-400/50"
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
              <label className="text-sm text-slate-300">Password</label>
              <Link
                to="/client/forgot-password"
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              {/* Lock Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-slate-400" />
              </div>

              {/* Password Input */}
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: "" });
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border border-white/10 text-sm focus:outline-none focus:ring-2 ${
                  errors.password ? "focus:ring-red-500" : "focus:ring-sky-400/50"
                }`}
              />

              {/* Show / Hide Button */}
              <button
                type="button"
                onClick={togglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white transition"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
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
            <label htmlFor="remember" className="text-sm text-slate-300">
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition ${
              loading
                ? "bg-slate-600 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110"
            }`}
          >
            {loading ? "Logging in..." : "LOG IN"}
          </button>
        </form>

        {/* Sign up */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link
            to="/client/registration"
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ClientLogin;
