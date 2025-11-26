import React, { useState, useEffect, useRef } from "react";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import {
  FiMenu,
  FiBell,
  FiUser,
  FiLogOut,
  FiKey,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { FaBullhorn, FaCalendarAlt, FaBullseye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminLayout = ({ children, userType = "admin" }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Menu items structure - different for staff and admin
  const getMenuItems = () => {
    if (userType === "staff") {
      return [
        { label: "Dashboard", icon: "📊", path: "/staff/dashboard" },
        { label: "Tasks", icon: "✅", path: "/staff/tasks" },
      ];
    } else {
      return [
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
        {
          label: "Estimate Request",
          icon: "📋",
          path: "/admin/estimate-request",
        },
        { label: "Knowledge Base", icon: "❓", path: "/admin/knowledge-base" },
        {
          label: "Bulk PDF Export",
          icon: "📄",
          path: "/admin/utilities/bulk-pdf",
        },
        { label: "CSV Export", icon: "📊", path: "/admin/utilities/csv" },
        { label: "Calendar", icon: "📅", path: "/admin/utilities/calendar" },
        {
          label: "Announcements",
          icon: "📢",
          path: "/admin/utilities/announcements",
        },
        { label: "Goals", icon: "🎯", path: "/admin/utilities/goals" },
        { label: "Sales Reports", icon: "📈", path: "/admin/reports/sales" },
        {
          label: "Expenses Reports",
          icon: "💰",
          path: "/admin/reports/expenses",
        },
        {
          label: "Expenses vs Income",
          icon: "⚖️",
          path: "/admin/reports/expenses-vs-income",
        },
        { label: "Leads Reports", icon: "📊", path: "/admin/reports/leads" },
        {
          label: "KB Articles Reports",
          icon: "📝",
          path: "/admin/reports/kb-articles",
        },
      ];
    }
  };

  // Add admin menus if user is superAdmin
  let menuItems = getMenuItems();
  if (userType === "admin" && user?.role === "superAdmin") {
    menuItems.push(
      { label: "All Admins", icon: "👥", path: "/admin/admins/all" },
      { label: "Pending Admins", icon: "⏳", path: "/admin/admins/pending" }
    );
  }

  useEffect(() => {
    // Check screen size on mount and resize
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

    // Load user data
    if (userType === "staff") {
      const storedStaff = JSON.parse(
        localStorage.getItem("crm_staff") || "null"
      );
      setUser(storedStaff);
    } else {
      const storedAdmin = JSON.parse(
        localStorage.getItem("crm_admin") || "null"
      );
      setUser(storedAdmin);
    }

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [userType]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications (only for admin)
  const fetchNotifications = async () => {
    if (userType === "staff") return;

    try {
      const token =
        userType === "admin"
          ? localStorage.getItem("crm_token")
          : localStorage.getItem("crm_staff_token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const today = new Date();
      const todayISO = today.toISOString().split("T")[0];
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch data
      const { data: announcements } = await axios.get(
        `${API_BASE_URL}/admin/announcements?date=${todayISO}`,
        config
      );

      const { data: goals } = await axios.get(
        `${API_BASE_URL}/admin/goals?endDate=${todayISO}`,
        config
      );

      const { data: events } = await axios.get(
        `${API_BASE_URL}/admin/events/range?startDate=${startOfDay}&endDate=${endOfDay}`,
        config
      );

      // Format notifications
      const announcementNotifications =
        announcements.announcements?.map((announcement) => ({
          id: announcement._id,
          type: "announcement",
          title: announcement.title,
          message: announcement.content.substring(0, 100) + "...",
          date: announcement.date,
          read: false,
        })) || [];

      const goalNotifications =
        goals.goals?.map((goal) => ({
          id: goal._id,
          type: "goal",
          title: goal.title,
          message: `Progress: ${goal.progress}% - ${goal.status}`,
          date: goal.endDate,
          read: false,
        })) || [];

      const eventNotifications =
        events.map((event) => ({
          id: event._id,
          type: "event",
          title: event.title,
          message: event.description
            ? event.description.substring(0, 100) + "..."
            : "No description",
          date: event.startDate,
          read: false,
        })) || [];

      const allNotifications = [
        ...announcementNotifications,
        ...goalNotifications,
        ...eventNotifications,
      ];

      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch notifications on component mount and daily (admin only)
  useEffect(() => {
    if (userType === "admin") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userType]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    if (userType === "staff") {
      localStorage.removeItem("crm_staff_token");
      localStorage.removeItem("crm_staff");
      navigate("/staff/login");
    } else {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_admin");
      navigate("/admin/login");
    }
  };

  const handleChangePassword = () => {
    navigate(`/${userType}/change-password`);
    setShowUserMenu(false);
  };

  // Search functionality
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

  // Notification functionality
  const handleNotificationClick = (notification) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === notification.id ? { ...n, read: true } : n
    );

    setNotifications(updatedNotifications);
    setUnreadCount((prev) => prev - 1);
    setShowNotifications(false);

    switch (notification.type) {
      case "announcement":
        navigate("/admin/utilities/announcements");
        break;
      case "goal":
        navigate("/admin/utilities/goals");
        break;
      case "event":
        navigate("/admin/utilities/calendar");
        break;
      default:
        break;
    }
  };

  const formatNotificationDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "announcement":
        return <FaBullhorn className="text-blue-500" />;
      case "goal":
        return <FaBullseye className="text-green-500" />;
      case "event":
        return <FaCalendarAlt className="text-purple-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
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
          <AdminSidebar
            isOpen={isSidebarOpen}
            onToggle={handleToggleSidebar}
            userType={userType}
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
                    placeholder={`Search ${userType} menu items...`}
                    className="w-full px-3 py-2 pl-10 pr-10 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white border border-gray-200"
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
                        <span className="mr-3 text-lg">{item.icon}</span>
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

                {/* Notifications - Only for admin */}
                {userType === "admin" && (
                  <div className="relative" ref={notificationRef}>
                    <button
                      className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <FiBell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 rounded-full text-xs text-white w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Notifications
                          </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                  notification.read ? "bg-gray-50" : "bg-white"
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 pt-1 mr-3">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {formatNotificationDate(
                                        notification.date
                                      )}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="flex-shrink-0 ml-2">
                                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No notifications</p>
                            </div>
                          )}
                        </div>

                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <button
                              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => {
                                const updatedNotifications = notifications.map(
                                  (n) => ({
                                    ...n,
                                    read: true,
                                  })
                                );
                                setNotifications(updatedNotifications);
                                setUnreadCount(0);
                              }}
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {userType}
                      </p>
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
            <div className="mx-auto">{children}</div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showUserMenu || showNotifications || showResults) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
            setShowResults(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;
