import { useState } from "react";
import AdminHeader from "../components/headers/AdminHeader";
import AdminSideBar from "../components/sidebar/AdminSidebar";

const AdminLayout = ({ children, userType = "admin" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <AdminHeader onToggleSidebar={handleToggleSidebar} userType={userType} />

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <AdminSideBar isOpen={isSidebarOpen} userType={userType} />

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
