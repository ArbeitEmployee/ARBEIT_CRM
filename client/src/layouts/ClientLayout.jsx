// ClientLayout.jsx
import { useState } from "react";
import ClientHeader from "../components/headers/ClientHeader";
import ClientSidebar from "../components/sidebar/ClientSidebar";

const ClientLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <ClientHeader onToggleSidebar={handleToggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <ClientSidebar isOpen={isSidebarOpen} />

        {/* Main content with push effect */}
        <main
          className={`flex-1 p-4 transition-all duration-300 ${
            isSidebarOpen ? "ml-60" : "ml-0"
          }`}
          style={{ marginTop: '56px' }} // To account for fixed header
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;