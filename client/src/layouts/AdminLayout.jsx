import { useState } from "react";
import AdminHeader from "../components/headers/AdminHeader";
import AdminSideBar from "../components/sidebar/AdminSidebar";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <AdminHeader onToggleSidebar={handleToggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <AdminSideBar isOpen={isSidebarOpen} />

        {/* Main content with push effect */}
        <main
          className={`flex-1 p-4 transition-all duration-300 ${
            isSidebarOpen ? "ml-60" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
