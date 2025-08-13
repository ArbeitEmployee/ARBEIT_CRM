// ClientSidebar.jsx
import { useState } from "react";
import {
  FaQuestionCircle,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaFileContract,
  FaClipboardList,
  FaFileAlt,
  FaHeadset,
  FaHome
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { NavLink } from "react-router-dom";

const ClientSidebar = ({ isOpen }) => {
  const [activeMenu, setActiveMenu] = useState("");

  const menuItems = [
    { label: "Home", icon: <FaHome />, path: "/client/home" },
    { label: "Knowledge Base", icon: <FaQuestionCircle />, path: "/client/knowledge-base" },
    { label: "Projects", icon: <FaProjectDiagram />, path: "/client/projects" },
    { 
      label: "Invoices", 
      icon: <FaFileInvoiceDollar />,
      hasSub: true,
      subItems: [
        { label: "All Invoices", path: "/client/invoices" },
        { label: "Paid", path: "/client/invoices/paid" },
        { label: "Unpaid", path: "/client/invoices/unpaid" },
        { label: "Overdue", path: "/client/invoices/overdue" }
      ]
    },
    { label: "Contracts", icon: <FaFileContract />, path: "/client/contracts" },
    { label: "Estimates", icon: <FaClipboardList />, path: "/client/estimates" },
    { label: "Proposals", icon: <FaFileAlt />, path: "/client/proposals" },
    { label: "Support", icon: <FaHeadset />, path: "/client/support" }
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
          <h2 className="text-sm font-semibold">Client Name</h2>
          <p className="text-xs text-gray-400">client@example.com</p>
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

                {/* Submenu */}
                {activeMenu === item.label && (
                  <div className="pl-12 bg-gray-800">
                    {item.subItems.map((sub, sIdx) => (
                      <NavLink
                        key={sIdx}
                        to={sub.path}
                        className={({ isActive }) => 
                          `block py-1 text-xs hover:text-white cursor-pointer ${
                            isActive ? "text-white font-medium" : "text-gray-300"
                          }`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-800 transition-colors ${
                    isActive ? "bg-gray-800 text-white" : ""
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default ClientSidebar;