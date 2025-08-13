// ClientHeader.jsx
import { FaUserCircle, FaBars, FaBell, FaCog } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const ClientHeader = ({ onToggleSidebar }) => {
  return (
    <header className="bg-gray-600 text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-white text-xl">
          <FaBars />
        </button>
        <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="inline-block h-7 mr-3" />
        <h1 className="text-lg font-bold">ARBEIT Client</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Settings */}
        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
          <FaCog className="text-xl" />
          <span className="hidden md:inline text-sm">Settings</span>
        </div>

        {/* Notifications */}
        <button className="relative">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-2 bg-red-500 rounded-full text-xs px-1">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <span className="hidden md:inline">Client</span>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;