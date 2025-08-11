import { FaBars, FaBell, FaUserCircle , FaCog} from "react-icons/fa";

const AdminHeader = ({ onToggleSidebar }) => {
  return (
    <header className="bg-gray-600 text-white flex items-center justify-between px-4 py-3 shadow-md">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-white text-xl md:hidden">
          <FaBars />
        </button>
        <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="inline-block h-7 mr-3" />
        <h1 className="text-lg font-bold">ARBEIT CRM</h1>
      </div>

      {/* Center: Search bar  */}
      <div className="hidden md:block w-1/3">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 py-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      
      <div className="flex items-center gap-4">
  {/* Customer Area Text */}
  <h1 className="text-sm text-gray-300">Customer Area</h1>

  {/* Settings */}
  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
    <FaCog className="text-xl" />
    <span className="hidden md:inline text-sm">Settings</span>
  </div>
</div>

      {/* Right - Notifications + User */}
      <div className="flex items-center gap-6">
        <button className="relative">
          <FaBell className="text-xl" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-2 bg-red-500 rounded-full text-xs px-1">
            3
          </span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <span className="hidden md:inline">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
 