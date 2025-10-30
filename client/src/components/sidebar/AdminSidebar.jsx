import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiShoppingBag,
  FiCheckSquare,
  FiHelpCircle,
  FiTarget,
  FiBarChart2,
  FiSettings,
  FiUserPlus,
  FiClipboard,
  FiMail,
  FiBook,
  FiCalendar,
  FiDownload,
  FiBell,
  FiFlag,
  FiLayers,
  FiTrendingUp,
  FiPieChart,
} from "react-icons/fi";

// CHANGED: Added userType prop
const AdminSideBar = ({ isOpen, userType = "admin" }) => {
  const location = useLocation();
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  // CHANGED: Different menu items for admin vs staff
  const getMenuItems = () => {
    const adminMenu = [
      {
        title: "Main",
        items: [{ path: "/admin/dashboard", label: "Dashboard", icon: FiHome }],
      },
      {
        title: "People",
        items: [
          { path: "/admin/customers", label: "Customers", icon: FiUsers },
          { path: "/admin/staffs", label: "Staff", icon: FiUserPlus },
          { path: "/admin/leads", label: "Leads", icon: FiTarget },
        ],
      },
      {
        title: "Sales",
        items: [
          {
            path: "/admin/sales/proposals",
            label: "Proposals",
            icon: FiFileText,
          },
          {
            path: "/admin/sales/estimates",
            label: "Estimates",
            icon: FiClipboard,
          },
          {
            path: "/admin/sales/invoices",
            label: "Invoices",
            icon: FiDollarSign,
          },
          {
            path: "/admin/sales/payments",
            label: "Payments",
            icon: FiTrendingUp,
          },
          {
            path: "/admin/sales/creditNotes",
            label: "Credit Notes",
            icon: FiFileText,
          },
          { path: "/admin/sales/items", label: "Items", icon: FiShoppingBag },
        ],
      },
      {
        title: "Projects & Tasks",
        items: [
          { path: "/admin/projects", label: "Projects", icon: FiLayers },
          { path: "/admin/tasks", label: "Tasks", icon: FiCheckSquare },
        ],
      },
      {
        title: "Support & Knowledge",
        items: [
          { path: "/admin/support", label: "Support", icon: FiHelpCircle },
          {
            path: "/admin/estimate-request",
            label: "Estimate Requests",
            icon: FiMail,
          },
          {
            path: "/admin/knowledge-base",
            label: "Knowledge Base",
            icon: FiBook,
          },
        ],
      },
      {
        title: "Finance",
        items: [
          {
            path: "/admin/subscriptions",
            label: "Subscriptions",
            icon: FiDollarSign,
          },
          { path: "/admin/expenses", label: "Expenses", icon: FiTrendingUp },
          { path: "/admin/contracts", label: "Contracts", icon: FiFileText },
        ],
      },
      {
        title: "Reports",
        items: [
          {
            path: "/admin/reports/sales",
            label: "Sales Reports",
            icon: FiBarChart2,
          },
          {
            path: "/admin/reports/expenses",
            label: "Expense Reports",
            icon: FiPieChart,
          },
          {
            path: "/admin/reports/expenses-vs-income",
            label: "Expenses vs Income",
            icon: FiTrendingUp,
          },
          {
            path: "/admin/reports/leads",
            label: "Leads Report",
            icon: FiTarget,
          },
          {
            path: "/admin/reports/kb-articles",
            label: "KB Articles",
            icon: FiBook,
          },
        ],
      },
      {
        title: "Administration",
        items: [
          { path: "/admin/admins/all", label: "All Admins", icon: FiUserPlus },
          {
            path: "/admin/admins/pending",
            label: "Pending Admins",
            icon: FiUserPlus,
          },
        ],
      },
      {
        title: "Utilities",
        items: [
          {
            path: "/admin/utilities/bulk-pdf",
            label: "Bulk PDF Export",
            icon: FiDownload,
          },
          {
            path: "/admin/utilities/csv",
            label: "CSV Export",
            icon: FiDownload,
          },
          {
            path: "/admin/utilities/calendar",
            label: "Calendar",
            icon: FiCalendar,
          },
          {
            path: "/admin/utilities/announcements",
            label: "Announcements",
            icon: FiBell,
          },
          { path: "/admin/utilities/goals", label: "Goals", icon: FiFlag },
        ],
      },
    ];

    const staffMenu = [
      {
        title: "Main",
        items: [{ path: "/staff/dashboard", label: "Dashboard", icon: FiHome }],
      },
      {
        title: "People",
        items: [
          { path: "/staff/customers", label: "Customers", icon: FiUsers },
          { path: "/staff/leads", label: "Leads", icon: FiTarget },
        ],
      },
      {
        title: "Projects & Tasks",
        items: [
          { path: "/staff/projects", label: "Projects", icon: FiLayers },
          { path: "/staff/tasks", label: "Tasks", icon: FiCheckSquare },
        ],
      },
      {
        title: "Support & Knowledge",
        items: [
          { path: "/staff/support", label: "Support", icon: FiHelpCircle },
          {
            path: "/staff/estimate-request",
            label: "Estimate Requests",
            icon: FiMail,
          },
          {
            path: "/staff/knowledge-base",
            label: "Knowledge Base",
            icon: FiBook,
          },
        ],
      },
      {
        title: "Settings",
        items: [
          {
            path: "/staff/change-password",
            label: "Change Password",
            icon: FiSettings,
          },
        ],
      },
    ];

    return userType === "staff" ? staffMenu : adminMenu;
  };

  const menuItems = getMenuItems();

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-16 bg-white border-r shadow-sm z-40"></div>
    );
  }

  return (
    <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 bg-white border-r shadow-sm z-40 overflow-y-auto">
      <div className="p-4">
        {menuItems.map((section, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`mr-3 ${
                          isActive ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSideBar;
