import { useState, useEffect, useRef } from "react";
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaKey, FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ onToggleSidebar, admin: propAdmin, onLogout }) => {
  const [admin, setAdmin] = useState(propAdmin || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Read from localStorage if not passed as prop
  useEffect(() => {
    if (!propAdmin) {
      const storedAdmin = JSON.parse(localStorage.getItem("crm_admin"));
      if (storedAdmin) setAdmin(storedAdmin);
    }
  }, [propAdmin]);

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

  // Menu items structure (should match your sidebar)
  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/admin/dashboard" },
    { label: "Customers", icon: "👥", path: "/admin/customers" },
    { label: "Staffs", icon: "👥", path: "/admin/staffs" },
    { label: "Proposals", icon: "📋", path: "/admin/sales/proposals" },
    { label: "Estimates", icon: "📊", path: "/admin/sales/estimates" },
    { label: "Invoices", icon: "🧾", path: "/admin/sales/invoices" },
    { label: "Payments", icon: "💳", path: "/admin/sales/payments" },
    { label: "Credit Notes", icon: "📝", path: "/admin/sales/creditNotes" },
    { label: "Items", icon: "📦", path: "/admin/sales/items" },
    { label: "Subscriptions", icon: "🛒", path: "/admin/subscriptions" },
    { label: "Expenses", icon: "💰", path: "/admin/expenses" },
    { label: "Contracts", icon: "📄", path: "/admin/contracts" },
    { label: "Projects", icon: "📂", path: "/admin/projects" },
    { label: "Tasks", icon: "✅", path: "/admin/tasks" },
    { label: "Support", icon: "🎧", path: "/admin/support" },
    { label: "Leads", icon: "📈", path: "/admin/leads" },
    { label: "Estimate Request", icon: "📋", path: "/admin/estimate-request" },
    { label: "Knowledge Base", icon: "❓", path: "/admin/knowledge-base" },
    { label: "Bulk PDF Export", icon: "📄", path: "/admin/utilities/bulk-pdf" },
    { label: "CSV Export", icon: "📊", path: "/admin/utilities/csv" },
    { label: "Calendar", icon: "📅", path: "/admin/utilities/calendar" },
    { label: "Announcements", icon: "📢", path: "/admin/utilities/announcements" },
    { label: "Goals", icon: "🎯", path: "/admin/utilities/goals" },
    { label: "Sales Reports", icon: "📈", path: "/admin/reports/sales" },
    { label: "Expenses Reports", icon: "💰", path: "/admin/reports/expenses" },
    { label: "Expenses vs Income", icon: "⚖️", path: "/admin/reports/expenses-vs-income" },
    { label: "Leads Reports", icon: "📊", path: "/admin/reports/leads" },
    { label: "KB Articles Reports", icon: "📝", path: "/admin/reports/kb-articles" },
  ];

  // Add admin menus if user is superAdmin
  if (admin?.role === "superAdmin") {
    menuItems.push(
      { label: "All Admins", icon: "👥", path: "/admin/admins/all" },
      { label: "Pending Admins", icon: "⏳", path: "/admin/admins/pending" }
    );
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      const results = menuItems.filter(item =>
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
    <header className="bg-gray-600 text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 h-14">
      {/* Left - Sidebar Toggle + Brand */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="text-white text-xl">
          <FaBars />
        </button>
        <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="inline-block h-7 mr-3" />
        <h1 className="text-lg font-bold">ARBEIT CRM</h1>
      </div>

      {/* Center: Search bar with results */}
      <div className="hidden md:block w-1/3 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full px-3 py-1 pl-8 pr-8 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length > 1 && setShowResults(true)}
          />
          <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
            {searchResults.map((item, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center"
                onClick={() => navigateToResult(item.path)}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {showResults && searchResults.length === 0 && searchQuery.length > 1 && (
          <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-md shadow-lg p-4 z-50">
            <p className="text-gray-300">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Mobile search button */}
        <button className="md:hidden text-white">
          <FaSearch />
        </button>

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