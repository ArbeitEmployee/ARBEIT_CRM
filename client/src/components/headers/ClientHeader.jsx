import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const ClientHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left: Logo/Brand */}
        <div className="text-xl font-bold text-blue-600">
          <img src="/arbeit-logo.png" alt="ARBEIT Logo" className="inline-block h-7 mr-3" />
             ARBEIT
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
          <NavLink to="/" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Knowledge Base</NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Projects</NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Invoices</NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Contracts</NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Estimates</NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Proposals</NavLink>
          <NavLink to="/support" className={({ isActive }) => isActive ? "text-blue-600" : ""}>Support</NavLink>
        </nav>

        {/* Right: User Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <FaUserCircle className="text-2xl text-gray-600" />
          <span className="text-sm text-gray-700 hidden sm:inline">Client Name</span>
          
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
