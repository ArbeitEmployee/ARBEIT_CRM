import { useState } from "react";
import StaffHeader from "../components/headers/StaffHeader";
import StaffSideBar from "../components/sidebar/StaffSidebar";

const StaffLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <StaffHeader onToggleSidebar={handleToggleSidebar} />

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <StaffSideBar isOpen={isSidebarOpen} />
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

export default StaffLayout;
