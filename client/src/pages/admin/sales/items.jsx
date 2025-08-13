import { useState } from "react";
import { FaPlus, FaSearch, FaSyncAlt, FaUpload, FaTasks } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";

const Items = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mock data (replace with API later)
  const items = [
    {
      description: "Website Design",
      longDescription: "Full redesign of the website with modern UI",
      rate: "$1200",
      tax1: "5%",
      tax2: "2%",
      unit: "Service",
      groupName: "Design",
    },
    {
      description: "SEO Optimization",
      longDescription: "On-page and off-page SEO improvements",
      rate: "$800",
      tax1: "5%",
      tax2: "0%",
      unit: "Service",
      groupName: "Marketing",
    },
  ];

  // Filter by search
  const filteredItems = items.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredItems.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-8 flex-wrap gap-2">
        <div className="flex gap-2">
          <button className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaPlus /> New Item
          </button>
          <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaUpload /> Import Items
          </button>
        </div>
      </div>

      {/* White box for table & controls */}
      <div className="bg-white shadow-md rounded p-4 mt-4">
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

            {/* Bulk Action button */}
            <button className="border px-3 py-1 rounded text-sm flex items-center gap-2">
              <FaTasks /> Bulk Action
            </button>

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
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Long Description</th>
                <th className="p-2 border">Rate</th>
                <th className="p-2 border">Tax1</th>
                <th className="p-2 border">Tax2</th>
                <th className="p-2 border">Unit</th>
                <th className="p-2 border">Group Name</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.description}</td>
                  <td className="p-2 border">{item.longDescription}</td>
                  <td className="p-2 border">{item.rate}</td>
                  <td className="p-2 border">{item.tax1}</td>
                  <td className="p-2 border">{item.tax2}</td>
                  <td className="p-2 border">{item.unit}</td>
                  <td className="p-2 border">{item.groupName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredItems.length)} of{" "}
            {filteredItems.length} entries
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

export default Items;
