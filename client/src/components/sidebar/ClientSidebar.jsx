/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiHelpCircle,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiClipboard,
  FiEdit,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaHeadset, FaProjectDiagram } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ClientSidebar = ({ isOpen, onToggle }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [client, setClient] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedClient = JSON.parse(localStorage.getItem("crm_client"));
    if (storedClient) {
      setClient(storedClient);
    }
  }, []);

  const navItems = [
    { name: "Home", icon: <FiHome />, path: "/client/home" },
    {
      name: "Knowledge Base",
      icon: <FiHelpCircle />,
      path: "/client/knowledge-base",
    },
    { name: "Projects", icon: <FaProjectDiagram />, path: "/client/projects" },
    {
      name: "Financials",
      icon: <FiDollarSign />,
      children: [
        { name: "Invoices", path: "/client/clientInvoice" },
        { name: "Payments", path: "/client/clientPayment" },
        { name: "Estimates", path: "/client/clientEstimate" },
        { name: "Proposals", path: "/client/clientProposal" },
      ],
    },
    { name: "Contracts", icon: <FiFileText />, path: "/client/contracts" },
    { name: "Estimate Request", icon: <FiEdit />, path: "/client/estimates" },
    { name: "Support", icon: <FaHeadset />, path: "/client/support" },
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_client_token");
    localStorage.removeItem("crm_client");
    navigate("/client/login");
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
              <p className="text-sm text-gray-600">Client Portal</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <FiChevronDown className="w-5 h-5 transform rotate-90" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
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

export default ClientSidebar;
