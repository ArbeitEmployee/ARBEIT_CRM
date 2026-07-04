/* eslint-disable no-unused-vars */
import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

export default function AdminLogin() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
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

      console.log("LOGIN response:", res.status, data);

      if (!res.ok) {
        toast.error(data.message || `Login failed (status ${res.status})`);
        return;
      }

      const token = data.token;
      if (!token) {
        toast.error(data.message || "Login succeeded but token missing.");
        return;
      }

      // Store both token AND admin data in localStorage
      localStorage.setItem("crm_token", token);
      localStorage.setItem("crm_admin", JSON.stringify(data.admin)); // 👈 ADD THIS LINE

      toast.success(data.message || "Login successful!");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 900);
    } catch (err) {
      console.error("Network/login error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  const getInputClasses = (field, value) =>
    `w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 text-white placeholder-slate-400 border transition focus:outline-none focus:ring-2 ${
      touched[field] && !value
        ? "border-red-500/70 focus:ring-red-400/40"
        : "border-white/10 focus:ring-sky-400/50 focus:border-sky-400/50"
    }`;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Ambient background image + aurora blobs */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative z-10 mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-indigo-900/40">
          <span className="text-xl font-black text-white">A</span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-300/80">
          ARBEIT CRM
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-sm text-slate-400">Log in to your admin account</p>
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-[0_30px_90px_rgba(2,6,23,.6)] backdrop-blur-xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiMail className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className={getInputClasses("email", email)}
              />
            </div>
            {touched.email && !email && (
              <p className="mt-1 text-xs text-red-400">
                Please fill up the email field.
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300">
                Password
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-xs text-slate-300 transition hover:text-sky-300"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiLock className="text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                className={getInputClasses("password", password)}
              />
              <div
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
            {touched.password && !password && (
              <p className="mt-1 text-xs text-red-400">
                Please fill up the password field.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold tracking-wide transition ${
              loading
                ? "cursor-not-allowed bg-slate-600 text-slate-300"
                : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:brightness-110"
            }`}
          >
            {loading ? "Logging in..." : "LOG IN"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/admin/signup"
            className="font-semibold text-sky-400 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
