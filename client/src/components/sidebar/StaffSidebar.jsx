import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaProjectDiagram,
  FaTasks,
  FaHeadset,
  FaClipboardList,
  FaQuestionCircle,
  FaKey,
  FaUserCircle,
  FaChartLine,
  FaFileInvoiceDollar,
  FaShoppingCart,
} from "react-icons/fa";
import { MdOutlineLeaderboard } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";

const StaffSideBar = ({ isOpen }) => {
  const [activeMenu, setActiveMenu] = useState("");
  const [staff, setStaff] = useState(null);

  // Load logged-in staff details from localStorage
  useEffect(() => {
    const storedStaff = JSON.parse(localStorage.getItem("crm_staff"));
    if (storedStaff) setStaff(storedStaff);
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedStaff = JSON.parse(localStorage.getItem("crm_staff"));
      setStaff(storedStaff);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Base staff menu items
  const baseMenuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/staff/dashboard" },
    { label: "Customers", icon: <FaUsers />, path: "/staff/customers" },
    { label: "Leads", icon: <MdOutlineLeaderboard />, path: "/staff/leads" },
    { label: "Projects", icon: <FaProjectDiagram />, path: "/staff/projects" },
    { label: "Tasks", icon: <FaTasks />, path: "/staff/tasks" },
    { label: "Support", icon: <FaHeadset />, path: "/staff/support" },
    {
      label: "Estimate Request",
      icon: <FaClipboardList />,
      path: "/staff/estimate-request",
    },
    {
      label: "Knowledge Base",
      icon: <FaQuestionCircle />,
      path: "/staff/knowledge-base",
    },
  ];

  // Admin pages that staff can access
  const adminAccessMenuItems = [
    {
      label: "Sales",
      icon: <FaChartLine />,
      hasSub: true,
      subItems: [
        { name: "Proposals", path: "/admin/sales/proposals" },
        { name: "Estimates", path: "/admin/sales/estimates" },
        { name: "Invoices", path: "/admin/sales/invoices" },
      ],
    },
    {
      label: "Subscriptions",
      icon: <FaShoppingCart />,
      path: "/admin/subscriptions",
    },
    {
      label: "Expenses",
      icon: <FaFileInvoiceDollar />,
      path: "/admin/expenses",
    },
    {
      label: "Reports",
      icon: <FaChartLine />,
      hasSub: true,
      subItems: [
        { name: "Sales Reports", path: "/admin/reports/sales" },
        { name: "Expenses Reports", path: "/admin/reports/expenses" },
      ],
    },
  ];

  // Combine menus based on staff role/permissions
  const getMenuItems = () => {
    // Check if staff has permission to access admin pages
    const canAccessAdminPages =
      staff?.role === "manager" || staff?.permissions?.includes("admin_access");

    if (canAccessAdminPages) {
      return [...baseMenuItems, ...adminAccessMenuItems];
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`bg-blue-900 text-white h-[calc(100vh-56px)] fixed top-[56px] left-0 z-40 flex flex-col transition-all duration-300
        ${isOpen ? "w-60" : "w-0 overflow-hidden"}`}
    >
      {/* User profile */}
      <div className="flex items-center gap-3 p-4 border-b border-blue-700">
        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
          <FaUserCircle className="text-2xl text-blue-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            {staff?.name || "Unknown Staff"}
          </h2>
          <p className="text-xs text-blue-300">
            {staff?.email || "no-email@crm.com"}
          </p>
          <p className="text-xs text-blue-400">
            {staff?.role === "manager" ? "Manager" : "Staff Member"}
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <div key={idx}>
            {item.hasSub ? (
              <>
                <button
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-blue-800 transition-colors"
                  onClick={() =>
                    setActiveMenu(activeMenu === item.label ? "" : item.label)
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <IoIosArrowForward
                    className={`transition-transform ${
                      activeMenu === item.label ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {activeMenu === item.label && (
                  <div className="pl-12 bg-blue-800">
                    {item.subItems.map((sub, sIdx) => (
                      <Link
                        to={sub.path}
                        key={sIdx}
                        className="block py-1 text-xs text-blue-300 hover:text-white cursor-pointer"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                className="flex items-center gap-3 px-4 py-2 hover:bg-blue-800 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )}
          </div>
        ))}

        {/* Change Password - Always at bottom */}
        <div className="border-t border-blue-700 mt-4">
          <Link
            to="/staff/change-password"
            className="flex items-center gap-3 px-4 py-2 hover:bg-blue-800 transition-colors"
          >
            <FaKey className="text-lg" />
            <span className="text-sm">Change Password</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default StaffSideBar;
