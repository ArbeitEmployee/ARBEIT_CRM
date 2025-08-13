import { useState } from "react";
import { FaPlus, FaFilter, FaSearch, FaSyncAlt } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";

const Invoices = () => {
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false); 

  // Mock data (replace with API later)
  const invoices = [
    {
      id: 101,
      amount: "$1,200",
      totalTax: "$120",
      date: "2025-08-01",
      customer: "John Doe",
      project: "Website Revamp",
      tags: "Design",
      dueDate: "2025-08-20",
      status: "Pending",
    },
    {
      id: 102,
      amount: "$800",
      totalTax: "$80",
      date: "2025-08-03",
      customer: "Jane Smith",
      project: "SEO Project",
      tags: "Marketing",
      dueDate: "2025-08-25",
      status: "Paid",
    },
  ];

  // Filter by search
  const filteredInvoices = invoices.filter((inv) =>
    Object.values(inv).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredInvoices.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-8 flex-wrap gap-2">
        <button className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2">
          <FaPlus /> New Invoice
        </button>
        <div className="flex items-center gap-2">
          <button
            className="border px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"} Toggle Table
          </button>
          <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {/* White box for table & controls */}
      <div
        className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Table controls */}
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

          {/* Search bar */}
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
                <th className="p-2 border">Invoice #</th>
                <th className="p-2 border">Amount</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Total Tax</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Project</th>
                    <th className="p-2 border">Tags</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-2 border">{inv.id}</td>
                  <td className="p-2 border">{inv.amount}</td>
                  {compactView ? (
                    <>
                      <td className="p-2 border">{inv.date}</td>
                      <td className="p-2 border">{inv.customer}</td>
                      <td className="p-2 border">{inv.status}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 border">{inv.totalTax}</td>
                      <td className="p-2 border">{inv.date}</td>
                      <td className="p-2 border">{inv.customer}</td>
                      <td className="p-2 border">{inv.project}</td>
                      <td className="p-2 border">{inv.tags}</td>
                      <td className="p-2 border">{inv.dueDate}</td>
                      <td className="p-2 border">{inv.status}</td>
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
            {Math.min(startIndex + entriesPerPage, filteredInvoices.length)} of{" "}
            {filteredInvoices.length} entries
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

export default Invoices;
