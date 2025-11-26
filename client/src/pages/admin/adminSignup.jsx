import { useState } from "react";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/login-background.jpg";

export default function AdminSignup() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate
    // validate
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
        return; // 🔥 exit early
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

    try {
      const res = await fetch(`${API_BASE_URL}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }), // ✅ add confirmPassword
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || "" };
      }

      console.log("REGISTER response:", res.status, data);

      if (!res.ok) {
        toast.error(data.message || `Signup failed (status ${res.status})`);
        return;
      }

      // success toast depending on role/status
      if (data.role === "superAdmin") {
        toast.success("Super Admin registered successfully 🎉");
      } else if (data.status === "pending") {
        toast.success(
          "Registration successful! Awaiting super admin approval."
        );
      } else {
        toast.success("Registration successful!");
      }

      setTimeout(() => navigate("/admin/login"), 1000);
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong. Please try again.");
    }
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
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Admin Registration</h2>
        <p className="text-sm text-gray-300">
          Create your secure admin account
        </p>
      </div>

      <div className="w-full max-w-sm bg-[#0c123d] bg-opacity-90 p-6 rounded-xl shadow-2xl text-white">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="block text-sm mb-1">Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FiUser className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={getInputClasses(touched.name && name.trim() === "")}
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
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
            {touched.password && password.length > 0 && password.length < 6 && (
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
                    (confirmPassword === "" || confirmPassword !== password)
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
            className="w-full bg-blue-500 hover:bg-blue-600 font-semibold text-sm py-2 rounded-md transition text-white"
          >
            SIGN UP
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-3">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
