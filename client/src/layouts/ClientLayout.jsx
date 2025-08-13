import { useState } from "react";
import ClientHeader from "../components/headers/ClientHeader";
import ClientSidebar from "../components/sidebar/ClientSidebar";

const ClientLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <ClientHeader onToggleSidebar={handleToggleSidebar} />

      <div className="flex flex-1 pt-14"> {/* Changed to pt-14 to match header height */}
        {/* Sidebar */}
        <ClientSidebar isOpen={isSidebarOpen} />

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

export default ClientLayout;