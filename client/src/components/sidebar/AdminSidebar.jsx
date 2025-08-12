import { useState } from "react";
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

  const menuItems = [
    { label: "Dashboard", icon: <FaTachometerAlt /> },
    { label: "Customers", icon: <FaUsers /> },
    {
      label: "Sales",
      icon: <FaChartLine />,
      hasSub: true,
      subItems: [
        "Proposals",
        "Estimates",
        "Invoices",
        "Payments",
        "Credit Notes",
        "Items",
      ],
    },
    { label: "Subscriptions", icon: <FaShoppingCart /> },
    { label: "Expenses", icon: <FaFileInvoiceDollar /> },
    { label: "Contracts", icon: <FaFileContract /> },
    { label: "Projects", icon: <FaProjectDiagram /> },
    { label: "Tasks", icon: <FaTasks /> },
    { label: "Support", icon: <FaHeadset /> },
    { label: "Leads", icon: <MdOutlineLeaderboard /> },
    { label: "Estimate Request", icon: <FaClipboardList /> },
    { label: "Knowledge Base", icon: <FaQuestionCircle />},
    { label: "Utilities", icon: <FaToolbox />, hasSub: true,
         subItems: [
        "Media",
        "Bulk PDF Export",
        "CSV Export",
        "Calender",
        "Announcements",
        "Goals",
        "Activity Log",
        "Surveys",
        "Database Backup",
        "Ticket Pipe Log",
      ],
     },
    { label: "Reports", icon: <FaFileAlt />, hasSub: true,
         subItems: [
        "Sales",
        "Expenses",
        "Expenses vs Income",
        "Leads",
        "Timesheets overview",
        "KB Articles",
        
      ],
     },
    { label: "Setup", icon: <FaCog /> },
  ];

  return (
    <aside
      className={`bg-gray-900 text-white h-[calc(100vh-56px)] fixed top-[56px] left-0 z-40 flex flex-col transition-all duration-300
        ${isOpen ? "w-60" : "w-0 overflow-hidden"}`}
    >
      {/* User profile */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <img
          src="https://via.placeholder.com/40"
          alt="Profile"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h2 className="text-sm font-semibold">Nathasa Khan</h2>
          <p className="text-xs text-gray-400">admin@crm.com</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <div key={idx}>
            <button
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-800 transition-colors"
              onClick={() =>
                item.hasSub
                  ? setActiveMenu(activeMenu === item.label ? "" : item.label)
                  : null
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              {item.hasSub && (
                <IoIosArrowForward
                  className={`transition-transform ${
                    activeMenu === item.label ? "rotate-90" : ""
                  }`}
                />
              )}
            </button>

            {/* Submenu */}
            {item.hasSub && activeMenu === item.label && (
              <div className="pl-12 bg-gray-800">
                {item.subItems.map((sub, sIdx) => (
                  <p
                    key={sIdx}
                    className="py-1 text-xs text-gray-300 hover:text-white cursor-pointer"
                  >
                    {sub}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSideBar;
