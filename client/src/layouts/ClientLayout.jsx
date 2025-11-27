import React, { useState, useEffect, useRef } from "react";
import ClientSidebar from "../components/sidebar/ClientSidebar";
import {
  FiMenu,
  FiBell,
  FiUser,
  FiLogOut,
  FiKey,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ClientLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [client, setClient] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { label: "Home", path: "/client/home" },
    { label: "Knowledge Base", path: "/client/knowledge-base" },
    { label: "Projects", path: "/client/projects" },
    { label: "Invoices", path: "/client/clientInvoice" },
    { label: "Payments", path: "/client/clientPayment" },
    { label: "Contracts", path: "/client/contracts" },
    { label: "Estimate Request", path: "/client/estimates" },
    { label: "Estimates", path: "/client/clientEstimate" },
    { label: "Proposals", path: "/client/clientProposal" },
    { label: "Support", path: "/client/support" },
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const storedClient = JSON.parse(localStorage.getItem("crm_client"));
    setClient(storedClient);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_client_token");
    localStorage.removeItem("crm_client");
    navigate("/client/login");
  };

  const handleChangePassword = () => {
    navigate("/client/change-password");
    setShowUserMenu(false);
  };

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

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const navigateToResult = (path) => {
    navigate(path);
    clearSearch();
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-2 md:p-4 relative">
      {/* Main Content Container */}
      <div
        className={`flex w-full bg-white rounded-3xl md:rounded-3xl shadow-sm sm:shadow-lg border border-gray-200 overflow-hidden relative ${
          isMobile ? "mt-16 mb-2 h-[calc(100vh-5rem)]" : "h-[95vh]"
        }`}
      >
        {/* Sidebar */}
        <div className={isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}>
          <ClientSidebar
            isOpen={isSidebarOpen}
            onToggle={handleToggleSidebar}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-auto relative">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm z-30 sticky top-0">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleToggleSidebar}
                  className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <FiMenu className="w-5 h-5" />
                </button>
              </div>

              {/* Center: Search bar with results */}
              <div className="hidden md:block w-1/3 relative" ref={searchRef}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search client menu items..."
                    className="w-full px-3 py-2 pl-10 pr-10 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-gray-400 border border-gray-200"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() =>
                      searchQuery.length > 1 && setShowResults(true)
                    }
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white mt-1 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                    {searchResults.map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center border-b border-gray-100 last:border-b-0"
                        onClick={() => navigateToResult(item.path)}
                      >
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showResults &&
                  searchResults.length === 0 &&
                  searchQuery.length > 1 && (
                    <div className="absolute top-full left-0 right-0 bg-white mt-1 rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                      <p className="text-gray-500 text-center">
                        No results found for "{searchQuery}"
                      </p>
                    </div>
                  )}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Mobile search button */}
                <button className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <FiSearch className="w-5 h-5" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#333333] text-white flex items-center justify-center font-bold text-sm">
                      {client?.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {client?.name || "Client"}
                      </p>
                      <p className="text-xs text-gray-600">Client</p>
                    </div>
                    <FiUser className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                      <button
                        onClick={handleChangePassword}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FiKey className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="relative z-10">
            <div className="mx-auto p-6">{children}</div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showUserMenu || showResults) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowUserMenu(false);
            setShowResults(false);
          }}
        />
      )}
    </div>
  );
};

export default ClientLayout;
