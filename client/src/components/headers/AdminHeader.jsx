import { FaBars, FaBell, FaUserCircle, FaCog } from "react-icons/fa";

const AdminHeader = ({ onToggleSidebar }) => {
  return (
    <header className="bg-[#f8f9fa] text-black flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 h-14">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-black text-xl hover:text-gray-700 transition-colors"
        >
          <FaBars />
        </button>
        <img
          src="/arbeit-logo.png"
          alt="ARBEIT Logo"
          className="inline-block h-7 mr-3"
        />
        <h1 className="text-lg font-bold tracking-wide">ARBEIT CRM</h1>
      </div>

      {/* Center: Search bar */}
      <div className="hidden md:block w-1/3">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 py-1 rounded-md bg-white text-black placeholder-gray-500 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Customer Area + Settings */}
        <div className="flex items-center gap-4">
          <h1 className="text-sm text-gray-600">Customer Area</h1>
          <div className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors">
            <FaCog className="text-xl" />
            <span className="hidden md:inline text-sm">Settings</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative hover:text-indigo-600 transition-colors">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full text-xs px-1">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
          <FaUserCircle className="text-2xl" />
          <span className="hidden md:inline font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
