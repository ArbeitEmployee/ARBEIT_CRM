import { useState, useEffect } from "react";
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaKey } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ onToggleSidebar, admin: propAdmin, onLogout }) => {
  const [admin, setAdmin] = useState(propAdmin || null);
  const navigate = useNavigate();

  // Read from localStorage if not passed as prop
  useEffect(() => {
    if (!propAdmin) {
      const storedAdmin = JSON.parse(localStorage.getItem("crm_admin"));
      if (storedAdmin) setAdmin(storedAdmin);
    }
  }, [propAdmin]);

  // Handle logout functionality
  const handleLogout = () => {
    // Clear JWT token from localStorage
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_admin");
    
    // If a custom logout function is provided as prop, call it
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    }
    
    // Redirect to login page
    navigate("/admin/login");
  };

  // Navigate to change password page
  const handleChangePassword = () => {
    navigate("/admin/change-password");
  };

  return (
    <header className="bg-gray-600 text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 h-14">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-white text-xl">
          <FaBars />
        </button>
        <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="inline-block h-7 mr-3" />
        <h1 className="text-lg font-bold">ARBEIT CRM</h1>
      </div>

      {/* Center: Search bar */}
      <div className="hidden md:block w-1/3">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 py-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Customer Area + Change Password */}
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-gray-300"
            onClick={handleChangePassword}
          >
            <FaKey className="text-xl" />
            <span className="hidden md:inline text-sm">Change Password</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-2 bg-red-500 rounded-full text-xs px-1">
            3
          </span>
        </button>

        {/* User Name */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <h2 className="hidden md:inline text-sm font-semibold">{admin?.name || "Unknown User"}</h2>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="flex items-center gap-1 hover:text-gray-300">
          <FaSignOutAlt className="text-xl" />
          <span className="hidden md:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;