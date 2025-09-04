import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaChartLine,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaFileContract,
  FaProjectDiagram,
  FaTasks,
  FaHeadset,
  FaClipboardList,
  FaQuestionCircle,
  FaToolbox,
  FaFileAlt,
  FaCog,
} from "react-icons/fa";
import { MdOutlineLeaderboard } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";

const AdminSideBar = ({ isOpen }) => {
  const [activeMenu, setActiveMenu] = useState("");
  const [admin, setAdmin] = useState(null);

  // Load logged-in admin details from localStorage
  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("crm_admin"));
    console.log("Loaded admin from storage:", storedAdmin); // 👈 Add logging
    if (storedAdmin) setAdmin(storedAdmin);
  }, []);

  // Add this useEffect to listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAdmin = JSON.parse(localStorage.getItem("crm_admin"));
      setAdmin(storedAdmin);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  // Load logged-in admin details from localStorage (after login/signup)
  useEffect(() => {
    const storedAdmin = JSON.parse(localStorage.getItem("crm_admin")); // 👈 save this in login/signup
    if (storedAdmin) setAdmin(storedAdmin);
  }, []);

  const defaultImage = "https://via.placeholder.com/40"; // fallback avatar

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: "/admin/dashboard" },
    { label: "Customers", icon: <FaUsers />, path: "/admin/customers" },
    { label: "Staffs", icon: <FaUsers />, path: "/admin/staffs" },
    {
      label: "Sales",
      icon: <FaChartLine />,
      hasSub: true,
      subItems: [
        { name: "Proposals", path: "/admin/sales/proposals" },
        { name: "Estimates", path: "/admin/sales/estimates" },
        { name: "Invoices", path: "/admin/sales/invoices" },
        { name: "Payments", path: "/admin/sales/payments" },
        { name: "Credit Notes", path: "/admin/sales/creditNotes" },
        { name: "Items", path: "/admin/sales/items" },
      ],
    },
    { label: "Subscriptions", icon: <FaShoppingCart />, path: "/admin/subscriptions" },
    { label: "Expenses", icon: <FaFileInvoiceDollar />, path: "/admin/expenses" },
    { label: "Contracts", icon: <FaFileContract />, path: "/admin/contracts" },
    { label: "Projects", icon: <FaProjectDiagram />, path: "/admin/projects" },
    { label: "Tasks", icon: <FaTasks />, path: "/admin/tasks" },
    { label: "Support", icon: <FaHeadset />, path: "/admin/support" },
    { label: "Leads", icon: <MdOutlineLeaderboard />, path: "/admin/leads" },
    { label: "Estimate Request", icon: <FaClipboardList />, path: "/admin/estimate-request" },
    { label: "Knowledge Base", icon: <FaQuestionCircle />, path: "/admin/knowledge-base" },
    {
      label: "Utilities",
      icon: <FaToolbox />,
      hasSub: true,
      subItems: [
        { name: "Bulk PDF Export", path: "/admin/utilities/bulk-pdf" },
        { name: "CSV Export", path: "/admin/utilities/csv" },
        { name: "Calendar", path: "/admin/utilities/calendar" },
        { name: "Announcements", path: "/admin/utilities/announcements" },
        { name: "Goals", path: "/admin/utilities/goals" },
      ],
    },
    {
      label: "Reports",
      icon: <FaFileAlt />,
      hasSub: true,
      subItems: [
        { name: "Sales", path: "/admin/reports/sales" },
        { name: "Expenses", path: "/admin/reports/expenses" },
        { name: "Expenses vs Income", path: "/admin/reports/expenses-vs-income" },
        { name: "Leads", path: "/admin/reports/leads" },
        { name: "KB Articles", path: "/admin/reports/kb-articles" },
      ],
    },
  ];

  // If superAdmin → add "Admins" menu
  if (admin?.role === "superAdmin") {
    menuItems.push({
      label: "Admins",
      icon: <FaUsers />,
      hasSub: true,
      subItems: [
        { name: "All Admins", path: "/admin/admins/all" },
        { name: "Pending Admins", path: "/admin/admins/pending" },
      ],
    });
  }

  return (
    <aside
      className={`bg-gray-900 text-white h-[calc(100vh-56px)] fixed top-[56px] left-0 z-40 flex flex-col transition-all duration-300
        ${isOpen ? "w-60" : "w-0 overflow-hidden"}`}
    >
      {/* User profile */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <img
          src={admin?.image || defaultImage}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h2 className="text-sm font-semibold">{admin?.name || "Unknown User"}</h2>
          <p className="text-xs text-gray-400">{admin?.email || "no-email@crm.com"}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <div key={idx}>
            {item.hasSub ? (
              <>
                <button
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-800 transition-colors"
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
                  <div className="pl-12 bg-gray-800">
                    {item.subItems.map((sub, sIdx) => (
                      <Link
                        to={sub.path}
                        key={sIdx}
                        className="block py-1 text-xs text-gray-300 hover:text-white cursor-pointer"
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
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSideBar;
