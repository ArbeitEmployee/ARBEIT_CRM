import { useState } from "react";
import { FaPlus, FaFilter, FaSearch, FaSyncAlt, FaUser, FaUserCheck, FaUserTimes, FaUserClock, FaChevronRight } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";

const CustomersPage = () => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Stats data
  const stats = {
    totalCustomers: 11,
    activeCustomers: 11,
    inactiveCustomers: 0,
    activeContacts: 11,
    inactiveContacts: 0,
    loggedInContacts: 2
  };

  // Customer data
  const customers = [
    {
      id: 1,
      company: "Abbott LLC",
      contact: "Samson Stokes",
      email: "ryan.summer@example.com",
      phone: "+1-616-601-9312",
      active: true,
      groups: ["Wholesaler", "VIP"],
      dateCreated: "2025-08-14 00:00:08"
    },
    {
      id: 2,
      company: "Bernier-Witting",
      contact: "Ben Roberts",
      email: "green37@example.net",
      phone: "+15343942904",
      active: true,
      groups: ["High Budget"],
      dateCreated: "2025-08-11 16:00:08"
    },
    // Add more customers as needed
  ];

  // Search filter
  const filteredCustomers = customers.filter((c) =>
    Object.values(c).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
  ));

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredCustomers.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleCustomerSelection = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(customerId => customerId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center text-gray-600">
          <span>Contacts</span>
          <FaChevronRight className="mx-1 text-xs" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUser className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Customers</p>
              <p className="text-2xl font-bold">{stats.activeCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaUserCheck className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Inactive Customers */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inactive Customers</p>
              <p className="text-2xl font-bold">{stats.inactiveCustomers}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaUserTimes className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Active Contacts */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Contacts</p>
              <p className="text-2xl font-bold">{stats.activeContacts}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaUserCheck className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Inactive Contacts */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inactive Contacts</p>
              <p className="text-2xl font-bold">{stats.inactiveContacts}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaUserTimes className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Contacts Logged In */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Contacts Logged In</p>
              <p className="text-2xl font-bold">{stats.loggedInContacts}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaUserClock className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaPlus /> New Customer
          </button>
          <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
            Import Customers
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"}
          </button>
          <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {/* White box for table */}
      <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Entries per page */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            
            {/* Export button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="border px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                <HiOutlineDownload /> Export
              </button>

              {/* Dropdown menu */}
              {showExportMenu && (
                <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
                  {["Excel", "CSV", "PDF", "Print"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        console.log(`${item} export triggered`);
                        setShowExportMenu(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              className="border px-2 py-1 rounded text-sm flex items-center"
              onClick={() => window.location.reload()}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded pl-8 pr-3 py-1 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border w-8"></th>
                <th className="p-2 border">Company</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Primary Contact</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Primary Contact</th>
                    <th className="p-2 border">Primary Email</th>
                    <th className="p-2 border">Phone</th>
                    <th className="p-2 border">Active</th>
                    <th className="p-2 border">Groups</th>
                    <th className="p-2 border">Date Created</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2 border">{customer.company}</td>
                  <td className="p-2 border">{customer.contact}</td>
                  <td className="p-2 border">{customer.email}</td>
                  {compactView ? (
                    <td className="p-2 border">
                      <span className={`inline-block w-3 h-3 rounded-full ${customer.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </td>
                  ) : (
                    <>
                      <td className="p-2 border">{customer.phone}</td>
                      <td className="p-2 border">
                        <span className={`inline-block w-3 h-3 rounded-full ${customer.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      </td>
                      <td className="p-2 border">
                        <div className="flex flex-wrap gap-1">
                          {customer.groups.map((group, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {group}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border whitespace-nowrap">{customer.dateCreated}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1 ? "bg-gray-200" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;