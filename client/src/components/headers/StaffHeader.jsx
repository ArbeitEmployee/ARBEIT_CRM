import { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
  FaKey,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const StaffHeader = ({ onToggleSidebar, staff: propStaff, onLogout }) => {
  const [staff, setStaff] = useState(propStaff || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Read from localStorage if not passed as prop
  useEffect(() => {
    if (!propStaff) {
      const storedStaff = JSON.parse(localStorage.getItem("crm_staff"));
      if (storedStaff) setStaff(storedStaff);
    }
  }, [propStaff]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout functionality
  const handleLogout = () => {
    // Clear staff data from localStorage
    localStorage.removeItem("crm_staff_token");
    localStorage.removeItem("crm_staff");

    // If a custom logout function is provided as prop, call it
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    }

    // Redirect to staff login page
    navigate("/staff/login");
  };

  // Navigate to change password page
  const handleChangePassword = () => {
    navigate("/staff/change-password");
  };

  // Staff menu items structure
  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/staff/dashboard" },
    { label: "Customers", icon: "👥", path: "/staff/customers" },
    { label: "Leads", icon: "📈", path: "/staff/leads" },
    { label: "Projects", icon: "📂", path: "/staff/projects" },
    { label: "Tasks", icon: "✅", path: "/staff/tasks" },
    { label: "Support", icon: "🎧", path: "/staff/support" },
    { label: "Estimate Request", icon: "📋", path: "/staff/estimate-request" },
    { label: "Knowledge Base", icon: "❓", path: "/staff/knowledge-base" },
    { label: "Change Password", icon: "🔒", path: "/staff/change-password" },
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      const results = menuItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Navigate to search result
  const navigateToResult = (path) => {
    navigate(path);
    clearSearch();
  };

  return (
    <header className="bg-blue-600 text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 h-14">
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
        <div>
          <h1 className="text-lg font-bold">ARBEIT CRM</h1>
          <p className="text-xs text-blue-200 hidden md:block">Staff Portal</p>
        </div>
      </div>

      {/* Center: Search bar with results */}
      <div className="hidden md:block w-1/3 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search staff menu items..."
            className="w-full px-3 py-1 pl-8 pr-8 rounded bg-blue-700 text-white placeholder-blue-300 focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length > 1 && setShowResults(true)}
          />
          <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-300" />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-blue-700 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
            {searchResults.map((item, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-blue-600 cursor-pointer flex items-center"
                onClick={() => navigateToResult(item.path)}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showResults &&
          searchResults.length === 0 &&
          searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 bg-blue-700 mt-1 rounded-md shadow-lg p-4 z-50">
              <p className="text-blue-300">
                No results found for "{searchQuery}"
              </p>
            </div>
          )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Mobile search button */}
        <button className="md:hidden text-white">
          <FaSearch />
        </button>

        {/* Change Password */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-blue-200"
            onClick={handleChangePassword}
          >
            <FaKey className="text-xl" />
            <span className="hidden md:inline text-sm">Change Password</span>
          </div>
        </div>

        {/* User Name */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <div className="hidden md:block text-right">
            <h2 className="text-sm font-semibold">
              {staff?.name || "Unknown Staff"}
            </h2>
            <p className="text-xs text-blue-200">Staff</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 hover:text-blue-200"
        >
          <FaSignOutAlt className="text-xl" />
          <span className="hidden md:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default StaffHeader;
