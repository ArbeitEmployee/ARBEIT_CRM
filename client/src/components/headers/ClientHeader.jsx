// ClientHeader.jsx - Updated version
import {
  FaUserCircle,
  FaBars,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaKey,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ClientHeader = ({ onToggleSidebar, client: propClient, onLogout }) => {
  const navigate = useNavigate();

  // Read from localStorage if not passed as prop
  const storedClient = JSON.parse(localStorage.getItem("crm_client"));
  const client = propClient || storedClient;

  // Handle logout functionality
  const handleLogout = () => {
    // Clear client data from localStorage
    localStorage.removeItem("crm_client_token");
    localStorage.removeItem("crm_client");

    // If a custom logout function is provided as prop, call it
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    }

    // Redirect to login page
    navigate("/client/login");
  };

  // Navigate to change password page
  const handleChangePassword = () => {
    navigate("/client/change-password");
  };

  return (
    <header className="bg-gray-600 text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 h-14">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-white text-xl">
          <FaBars />
        </button>
        <img
          src="/arbeit-logo.png"
          alt="ARBEIT Logo"
          className="inline-block h-7 mr-3"
        />
        <h1 className="text-lg font-bold">ARBEIT Client</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Change Password */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-gray-300"
            onClick={handleChangePassword}
          >
            <FaKey className="text-xl" />
            <span className="hidden md:inline text-sm">Change Password</span>
          </div>
        </div>

        {/* Notifications
        <button className="relative">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-2 bg-red-500 rounded-full text-xs px-1">
            3
          </span>
        </button> */}

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <span className="hidden md:inline">{client?.name || "Client"}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 hover:text-gray-300"
        >
          <FaSignOutAlt className="text-xl" />
          <span className="hidden md:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default ClientHeader;
