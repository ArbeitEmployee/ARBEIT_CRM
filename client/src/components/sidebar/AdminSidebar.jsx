/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiLogOut,
  FiUser,
  FiLayers,
  FiBook,
  FiGlobe,
  FiCalendar,
  FiFlag,
  FiEdit,
  FiBookOpen,
  FiPhoneCall,
  FiDollarSign,
  FiFileText,
  FiBriefcase,
  FiTarget,
  FiHelpCircle,
  FiBarChart,
  FiShoppingCart,
  FiClipboard,
  FiFile,
} from "react-icons/fi"; // Added FiFile for Document Templates
import {
  FaUserGraduate,
  FaProjectDiagram,
  FaHeadset,
  FaFileAlt,
} from "react-icons/fa";
import { TiBusinessCard } from "react-icons/ti";
import { MdOutlineLeaderboard } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const AdminSidebar = ({ isOpen, onToggle, userType = "admin" }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [userType]);

  const baseNavItems = [
    { name: "Dashboard", icon: <FiHome />, path: `/${userType}/dashboard` },
    {
      name: "Staffs",
      icon: <FiUsers />,
      path: `/${userType}/staffs`,
    },
    {
      name: "Staff Tasks",
      icon: <FiTarget />,
      path: `/${userType}/tasks`,
    },
    {
      name: "Leads",
      icon: <MdOutlineLeaderboard />,
      path: `/${userType}/leads`,
    },
    {
      name: "Customers",
      icon: <FiUsers />,
      path: `/${userType}/customers`,
    },
    {
      name: "Subscriptions",
      icon: <FiShoppingCart />,
      path: `/${userType}/subscriptions`,
    },
    {
      name: "Sales",
      icon: <FiDollarSign />,
      children: [
        { name: "Quotations", path: `/${userType}/sales/proposals` },
        { name: "Estimates", path: `/${userType}/sales/estimates` },
        { name: "Invoices", path: `/${userType}/sales/invoices` },
        { name: "Payments", path: `/${userType}/sales/payments` },
        { name: "Credit Notes", path: `/${userType}/sales/creditNotes` },
        { name: "Items", path: `/${userType}/sales/items` },
      ],
    },
    {
      name: "Expenses",
      icon: <FiFileText />,
      path: `/${userType}/expenses`,
    },
    {
      name: "Estimate Requests",
      icon: <FiEdit />,
      path: `/${userType}/estimate-request`,
    },
    {
      name: "Projects",
      icon: <FaProjectDiagram />,
      path: `/${userType}/projects`,
    },
    {
      name: "Contracts",
      icon: <FiClipboard />,
      path: `/${userType}/contracts`,
    },
    {
      name: "Knowledge Base",
      icon: <FiHelpCircle />,
      path: `/${userType}/knowledge-base`,
    },
    // ADDED: Document Templates
    {
      name: "Document Templates",
      icon: <FaFileAlt />,
      path: `/${userType}/document-templates`,
    },
    {
      name: "Utilities",
      icon: <FiSettings />,
      children: [
        { name: "Bulk PDF Export", path: `/${userType}/utilities/bulk-pdf` },
        { name: "CSV Export", path: `/${userType}/utilities/csv` },
        { name: "Calendar", path: `/${userType}/utilities/calendar` },
        { name: "Announcements", path: `/${userType}/utilities/announcements` },
        { name: "Goals", path: `/${userType}/utilities/goals` },
      ],
    },
    {
      name: "Reports",
      icon: <FiBarChart />,
      children: [
        { name: "Sales Reports", path: `/${userType}/reports/sales` },
        { name: "Expenses Reports", path: `/${userType}/reports/expenses` },
        {
          name: "Expenses vs Income",
          path: `/${userType}/reports/expenses-vs-income`,
        },
        { name: "Leads Reports", path: `/${userType}/reports/leads` },
        { name: "KB Articles", path: `/${userType}/reports/kb-articles` },
      ],
    },
    {
      name: "Support",
      icon: <FaHeadset />,
      path: `/${userType}/support`,
    },
  ];

  // Add Admin management for superAdmin
  if (userType === "admin" && user?.role === "superAdmin") {
    baseNavItems.splice(3, 0, {
      name: "Admins",
      icon: <FiUser />,
      children: [
        { name: "All Admins", path: "/admin/admins/all" },
        { name: "Pending Admins", path: "/admin/admins/pending" },
      ],
    });
  }

  // For staff, show limited menu
  const staffNavItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/staff/dashboard" },
    { name: "Tasks", icon: <FiTarget />, path: "/staff/tasks" },
  ];

  const navItems = userType === "staff" ? staffNavItems : baseNavItems;

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
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

  const isActivePath = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isParentActive = (item) => {
    if (item.path) return isActivePath(item.path);
    if (item.children) {
      return item.children.some((child) => isActivePath(child.path));
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -300,
          width: isOpen ? 280 : 0,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gradient-to-b from-gray-50 to-gray-100 h-screen flex flex-col border-r border-gray-200 shadow-xl overflow-hidden fixed lg:relative z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="h-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">ARBEIT CRM</h1>
              <p className="text-sm text-gray-600 capitalize">
                {userType} Portal
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <FiChevronDown className="w-5 h-5 transform rotate-90" />
          </button>
        </div>

        {/* Navigation - Added padding bottom for better scroll */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 pb-20">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = isParentActive(item);
              const isExpanded = expandedMenus[item.name];

              return (
                <li key={item.name}>
                  {item.children ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleMenu(item.name)}
                        className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-gray-50 text-gray-600 shadow-sm border border-gray-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-5 h-5 flex items-center justify-center">
                            {item.icon}
                          </span>
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </div>
                        {isExpanded ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </motion.button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <ul className="ml-8 border-l border-gray-200 pl-3 mt-2 space-y-1">
                              {item.children.map((child) => (
                                <motion.li
                                  key={child.name}
                                  whileHover={{ x: 2 }}
                                  className="mb-1"
                                >
                                  <Link
                                    to={child.path}
                                    className={`block text-sm py-2.5 px-3 rounded-lg transition-colors ${
                                      isActivePath(child.path)
                                        ? "bg-[#333333] text-white font-medium shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                  >
                                    {child.name}
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center w-full p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#333333] text-gray-100 shadow-sm border border-gray-100"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 flex items-center justify-center">
                          {item.icon}
                        </span>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
