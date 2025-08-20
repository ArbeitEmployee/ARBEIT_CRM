import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSyncAlt, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Estimates = () => {
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewEstimate, setViewEstimate] = useState(null);
  const [editEstimate, setEditEstimate] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState({ 
    customer: "", 
    status: "Draft" 
  });

  // Fetch estimates
  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/estimates");
      setEstimates(data.data || data);
    } catch (err) {
      console.error("Error fetching estimates", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  // Export handler
  const handleExport = (type) => {
    if (!estimates.length) return;

    const exportData = estimates.map((e) => ({
      EstimateNumber: e.estimateNumber || "EST-" + e._id.slice(-6).toUpperCase(),
      Customer: e.customer,
      Amount: e.total,
      TotalTax: e.items ? e.items.reduce((sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0), 0) : 0,
      Project: e.reference || "-",
      Tags: e.tags || "-",
      Date: e.estimateDate ? new Date(e.estimateDate).toLocaleDateString() : "-",
      ExpiryDate: e.expiryDate ? new Date(e.expiryDate).toLocaleDateString() : "-",
      Reference: e.reference || "-",
      Status: e.status,
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) => Object.values(row).map((val) => `"${val}"`).join(","))
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "estimates.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Estimates");
        XLSXWriteFile(workbook, "estimates.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("estimates.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Estimates</title></head><body>");
        printWindow.document.write("<table border='1' style='border-collapse: collapse; width: 100%;'>");
        printWindow.document.write("<thead><tr>");
        Object.keys(exportData[0]).forEach((col) => {
          printWindow.document.write(`<th>${col}</th>`);
        });
        printWindow.document.write("</tr></thead><tbody>");
        exportData.forEach((row) => {
          printWindow.document.write("<tr>");
          Object.values(row).forEach((val) => {
            printWindow.document.write(`<td>${val}</td>`);
          });
          printWindow.document.write("</tr>");
        });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
        break;
      }

      default:
        console.log("Unknown export type:", type);
    }

    setShowExportMenu(false);
  };

  // Delete estimate
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this estimate?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/estimates/${id}`);
      setEstimates(estimates.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Error deleting estimate", err);
    }
  };

  // Update estimate
  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/estimates/${editEstimate._id}`, formData);
      setEditEstimate(null);
      fetchEstimates();
    } catch (err) {
      console.error("Error updating estimate", err);
    }
  };

  // Filter estimates
  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.estimateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastEstimate = currentPage * entriesPerPage;
  const indexOfFirstEstimate = indexOfLastEstimate - entriesPerPage;
  const currentEstimates = filteredEstimates.slice(indexOfFirstEstimate, indexOfLastEstimate);
  const totalPages = Math.ceil(filteredEstimates.length / entriesPerPage);

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading estimates...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-11 flex-wrap gap-2">
        <button
          onClick={() => navigate("../estimates/new")}
          className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
        >
          <FaPlus /> New Estimate
        </button>
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

      {/* White box */}
      <div
        className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Table controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
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

            {/* Export */}
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
                      onClick={() => handleExport(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              className="border px-2 py-1 rounded text-sm flex items-center"
              onClick={fetchEstimates}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Search estimates..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border rounded pl-2 pr-3 py-1 text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm(searchInput);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Estimate#</th>
                <th className="p-2 border">Amount</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Total Tax</th>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Project</th>
                    <th className="p-2 border">Tags</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Expiry Date</th>
                    <th className="p-2 border">Reference</th>
                    <th className="p-2 border">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentEstimates.length > 0 ? (
                currentEstimates.map((estimate) => {
                  const displayEstimateNumber = estimate.estimateNumber || "EST-" + estimate._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: estimate.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(estimate.total || 0);

                  const totalTax = estimate.items ? 
                    estimate.items.reduce((sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0), 0) : 0;

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={estimate._id}
                      className="hover:bg-gray-50 cursor-pointer relative"
                      onMouseEnter={() => setHoveredId(estimate._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="p-2 border font-mono relative">
                        {displayEstimateNumber}
                        {hoveredId === estimate._id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-md p-1 flex gap-2 text-xs z-10">
                            <button
                              onClick={() => setViewEstimate(estimate)}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditEstimate(estimate);
                                setFormData({
                                  customer: estimate.customer || "",
                                  status: estimate.status || "Draft",
                                });
                              }}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEdit /> Update
                            </button>
                            <button
                              onClick={() => handleDelete(estimate._id)}
                              className="px-2 py-1 flex items-center gap-1 text-red-600 hover:bg-gray-100 rounded"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border text-right">{displayAmount}</td>
                      {compactView ? (
                        <>
                          <td className="p-2 border">{estimate.customer || "-"}</td>
                          <td className="p-2 border">{formatDate(estimate.estimateDate)}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !estimate.status || estimate.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : estimate.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : estimate.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {estimate.status || "Draft"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 border text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: estimate.currency || "USD",
                              minimumFractionDigits: 2,
                            }).format(totalTax)}
                          </td>
                          <td className="p-2 border">{estimate.customer || "-"}</td>
                          <td className="p-2 border">{estimate.reference || "-"}</td>
                          <td className="p-2 border">{estimate.tags || "-"}</td>
                          <td className="p-2 border">{formatDate(estimate.estimateDate)}</td>
                          <td className="p-2 border">{formatDate(estimate.expiryDate)}</td>
                          <td className="p-2 border">{estimate.reference || "-"}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !estimate.status || estimate.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : estimate.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : estimate.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {estimate.status || "Draft"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 10} className="p-4 text-center text-gray-500">
                    No estimates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {indexOfFirstEstimate + 1} to {Math.min(indexOfLastEstimate, filteredEstimates.length)} of{" "}
            {filteredEstimates.length} entries
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
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-gray-200" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View & Edit Modals */}
      {viewEstimate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Estimate Details</h2>
            <p><b>Estimate #:</b> {viewEstimate.estimateNumber}</p>
            <p><b>Customer:</b> {viewEstimate.customer}</p>
            <p><b>Reference:</b> {viewEstimate.reference || "-"}</p>
            <p><b>Amount:</b> {viewEstimate.total}</p>
            <p><b>Status:</b> {viewEstimate.status}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewEstimate(null)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {editEstimate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Update Estimate</h2>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
              placeholder="Customer Name"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditEstimate(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimates;