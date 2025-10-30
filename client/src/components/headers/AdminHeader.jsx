import { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaKey,
  FaSearch,
  FaTimes,
  FaBullhorn,
  FaCalendarAlt,
  FaBullseye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// CHANGED: Added userType prop to distinguish between admin and staff
const AdminHeader = ({
  onToggleSidebar,
  admin: propAdmin,
  onLogout,
  userType = "admin",
}) => {
  const [admin, setAdmin] = useState(propAdmin || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // CHANGED: Read from different localStorage based on userType
  useEffect(() => {
    if (!propAdmin) {
      if (userType === "staff") {
        const storedStaff = JSON.parse(localStorage.getItem("crm_staff"));
        if (storedStaff) setAdmin(storedStaff);
      } else {
        const storedAdmin = JSON.parse(localStorage.getItem("crm_admin"));
        if (storedAdmin) setAdmin(storedAdmin);
      }
    }
  }, [propAdmin, userType]);

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

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // CHANGED: Get different tokens based on userType
      const token =
        userType === "staff"
          ? localStorage.getItem("crm_staff_token")
          : localStorage.getItem("crm_token");

      if (!token) return;

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayISO = today.toISOString().split("T")[0];
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch today's announcements
      const { data: announcements } = await axios.get(
        `http://localhost:5000/api/admin/announcements?date=${todayISO}`,
        config
      );

      // Fetch today's goals (ending today)
      const { data: goals } = await axios.get(
        `http://localhost:5000/api/admin/goals?endDate=${todayISO}`,
        config
      );

      // Fetch today's events
      const { data: events } = await axios.get(
        `http://localhost:5000/api/admin/events/range?startDate=${startOfDay}&endDate=${endOfDay}`,
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

      // Combine all notifications
      const allNotifications = [
        ...announcementNotifications,
        ...goalNotifications,
        ...eventNotifications,
      ];

      // Sort by date (newest first)
      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch notifications on component mount and daily
  useEffect(() => {
    fetchNotifications();

    // Set up interval to check for new notifications daily
    const interval = setInterval(fetchNotifications, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userType]); // CHANGED: Added userType dependency

  // CHANGED: Handle logout for both admin and staff
  const handleLogout = () => {
    if (userType === "staff") {
      // Clear staff data from localStorage
      localStorage.removeItem("crm_staff_token");
      localStorage.removeItem("crm_staff");

      // Redirect to staff login
      navigate("/staff/login");
    } else {
      // Clear admin data from localStorage
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_admin");

      // If a custom logout function is provided as prop, call it
      if (onLogout && typeof onLogout === "function") {
        onLogout();
      }

      // Redirect to admin login
      navigate("/admin/login");
    }
  };

  // CHANGED: Navigate to different change password pages based on userType
  const handleChangePassword = () => {
    if (userType === "staff") {
      navigate("/staff/change-password");
    } else {
      navigate("/admin/change-password");
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    const updatedNotifications = notifications.map((n) =>
      n.id === notification.id ? { ...n, read: true } : n
    );

    setNotifications(updatedNotifications);
    setUnreadCount((prev) => prev - 1);
    setShowNotifications(false);

    // CHANGED: Navigate to different routes based on userType
    const basePath = userType === "staff" ? "/staff" : "/admin";

    switch (notification.type) {
      case "announcement":
        navigate(`${basePath}/utilities/announcements`);
        break;
      case "goal":
        navigate(`${basePath}/utilities/goals`);
        break;
      case "event":
        navigate(`${basePath}/utilities/calendar`);
        break;
      default:
        break;
    }
  };

  // CHANGED: Different menu items for admin vs staff
  const getMenuItems = () => {
    const adminMenu = [
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

    const staffMenu = [
      { label: "Dashboard", icon: "📊", path: "/staff/dashboard" },
      { label: "Customers", icon: "👥", path: "/staff/customers" },
      { label: "Leads", icon: "📈", path: "/staff/leads" },
      { label: "Projects", icon: "📂", path: "/staff/projects" },
      { label: "Tasks", icon: "✅", path: "/staff/tasks" },
      { label: "Support", icon: "🎧", path: "/staff/support" },
      {
        label: "Estimate Request",
        icon: "📋",
        path: "/staff/estimate-request",
      },
      { label: "Knowledge Base", icon: "❓", path: "/staff/knowledge-base" },
      { label: "Change Password", icon: "🔒", path: "/staff/change-password" },
    ];

    return userType === "staff" ? staffMenu : adminMenu;
  };

  // CHANGED: Get menu items based on userType
  let menuItems = getMenuItems();

  // Add admin menus if user is superAdmin (only for admin users)
  if (userType === "admin" && admin?.role === "superAdmin") {
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

  // Format date for display
  const formatNotificationDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "announcement":
        return <FaBullhorn className="text-blue-500" />;
      case "goal":
        return <FaBullseye className="text-green-500" />;
      case "event":
        return <FaCalendarAlt className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // CHANGED: Get header title based on userType
  const getHeaderTitle = () => {
    return userType === "staff" ? "Staff Portal" : "Admin Dashboard";
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
        {/* CHANGED: Dynamic title based on userType */}
        <div>
          <h1 className="text-lg font-bold">ARBEIT CRM</h1>
          <p className="text-xs text-gray-300 hidden md:block">
            {getHeaderTitle()}
          </p>
        </div>
      </div>

      {/* Center: Search bar with results */}
      <div className="hidden md:block w-1/3 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${userType} menu items...`}
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
        {showResults &&
          searchResults.length === 0 &&
          searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-md shadow-lg p-4 z-50">
              <p className="text-gray-300">
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
        <div className="relative" ref={notificationRef}>
          <button
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 rounded-full text-xs px-1 min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-gray-200 bg-gray-700 text-white">
                <h3 className="text-sm font-medium">Notifications</h3>
                {/* CHANGED: Show user type in notifications header */}
                <p className="text-xs text-gray-300 capitalize">
                  {userType} Portal
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        notification.read ? "bg-gray-50" : "bg-white"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1 mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatNotificationDate(notification.date)}
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
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-200 bg-gray-50">
                  <button
                    className="w-full text-center text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      // Mark all as read
                      const updatedNotifications = notifications.map((n) => ({
                        ...n,
                        read: true,
                      }));
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

        {/* User Name */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl" />
          <div className="hidden md:block text-right">
            <h2 className="text-sm font-semibold">
              {admin?.name || "Unknown User"}
            </h2>
            {/* CHANGED: Show user type */}
            <p className="text-xs text-gray-300 capitalize">{userType}</p>
          </div>
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

export default AdminHeader;
