import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Read text then try parse JSON (safe for any response)
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text || "" };
      }

      console.log("LOGIN response:", res.status, data);

      // If backend returns non-OK, show its message
      if (!res.ok) {
        toast.error(data.message || `Login failed (status ${res.status})`);
        return;
      }

      // Expect token in successful response
      const token = data.token;
      if (!token) {
        // backend didn't return token — show message and don't navigate
        toast.error(data.message || "Login succeeded but token missing.");
        return;
      }

      // Success
      toast.success(data.message || "Login successful!");
      localStorage.setItem("crm_token", token);

      // small delay so toast is visible
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 900);
    } catch (err) {
      console.error("Network/login error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  const getInputClasses = (field, value) =>
    `w-full pl-10 pr-3 py-2 rounded-md bg-[#10194f] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
      touched[field] && !value
        ? "border border-red-500 focus:ring-red-400"
        : "focus:ring-blue-400"
    }`;

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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Welcome to CRM</h2>
        <p className="text-sm text-gray-300">Log in to your admin account</p>
      </div>

      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-80 p-6 rounded-xl shadow-xl text-white">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
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
              <p className="text-red-400 text-xs mt-1">
                Please fill up the email field.
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm">Password</label>
              <Link
                to="/admin/forgot-password"
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                className={getInputClasses("password", password)}
              />
            </div>
            {touched.password && !password && (
              <p className="text-red-400 text-xs mt-1">
                Please fill up the password field.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold text-sm py-2 rounded-md transition ${
              loading
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-white text-[#0c123d] hover:bg-gray-200"
            }`}
          >
            {loading ? "Logging in..." : "LOG IN"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-3">
          Don't have an account?{" "}
          <Link to="/admin/signup" className="text-blue-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
