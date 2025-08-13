import { useState } from "react";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";

const Payments = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mock data (replace with API data later)
  const payments = [
    {
      paymentId: "P001",
      invoiceId: "INV101",
      paymentMode: "Credit Card",
      transactionId: "TXN123456",
      customer: "John Doe",
      amount: "$1,200",
      date: "2025-08-01",
    },
    {
      paymentId: "P002",
      invoiceId: "INV102",
      paymentMode: "Bank Transfer",
      transactionId: "TXN654321",
      customer: "Jane Smith",
      amount: "$800",
      date: "2025-08-05",
    },
  ];

  // Search filter
  const filteredPayments = payments.filter((pay) =>
    Object.values(pay).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredPayments.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 pt-28">
      {/* pt-28 pushes white box below header like invoice page */}

      {/* White box for table & controls */}
      <div className="bg-white shadow-md rounded p-4 transition-all duration-300 w-full">
        {/* Table controls */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Payment #</th>
                <th className="p-2 border">Invoice #</th>
                <th className="p-2 border">Payment Mode</th>
                <th className="p-2 border">Transaction ID</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((pay) => (
                <tr key={pay.paymentId}>
                  <td className="p-2 border">{pay.paymentId}</td>
                  <td className="p-2 border">{pay.invoiceId}</td>
                  <td className="p-2 border">{pay.paymentMode}</td>
                  <td className="p-2 border">{pay.transactionId}</td>
                  <td className="p-2 border">{pay.customer}</td>
                  <td className="p-2 border">{pay.amount}</td>
                  <td className="p-2 border">{pay.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredPayments.length)} of{" "}
            {filteredPayments.length} entries
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

export default Payments;
