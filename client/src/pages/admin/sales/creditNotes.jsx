import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSyncAlt, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CreditNotes = () => {
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewCreditNote, setViewCreditNote] = useState(null);
  const [editCreditNote, setEditCreditNote] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState({ 
    customer: "", 
    status: "Draft" 
  });

  // Fetch credit notes
  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/credit-notes");
      setCreditNotes(data.data || data);
    } catch (err) {
      console.error("Error fetching credit notes", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Export handler
  const handleExport = (type) => {
    if (!creditNotes.length) return;

    const exportData = creditNotes.map((cn) => ({
      CreditNoteNumber: cn.creditNoteNumber || "CN-" + cn._id.slice(-6).toUpperCase(),
      Customer: cn.customer,
      Amount: cn.total,
      CreditNoteDate: cn.creditNoteDate ? new Date(cn.creditNoteDate).toLocaleDateString() : "-",
      Status: cn.status,
      Reference: cn.reference || "-",
      Project: cn.project || "-",
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
        link.setAttribute("download", "credit_notes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Credit Notes");
        XLSXWriteFile(workbook, "credit_notes.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("credit_notes.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Credit Notes</title></head><body>");
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

  // Delete credit note
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this credit note?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/credit-notes/${id}`);
      setCreditNotes(creditNotes.filter((cn) => cn._id !== id));
    } catch (err) {
      console.error("Error deleting credit note", err);
    }
  };

  // Update credit note
  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/credit-notes/${editCreditNote._id}`, formData);
      setEditCreditNote(null);
      fetchCreditNotes();
    } catch (err) {
      console.error("Error updating credit note", err);
    }
  };

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter(
    (creditNote) =>
      creditNote.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creditNote.creditNoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creditNote.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastCreditNote = currentPage * entriesPerPage;
  const indexOfFirstCreditNote = indexOfLastCreditNote - entriesPerPage;
  const currentCreditNotes = filteredCreditNotes.slice(indexOfFirstCreditNote, indexOfLastCreditNote);
  const totalPages = Math.ceil(filteredCreditNotes.length / entriesPerPage);

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading credit notes...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-11 flex-wrap gap-2">
        <button
          onClick={() => navigate("../credit-notes/new")}
          className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
        >
          <FaPlus /> New Credit Note
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
              onClick={fetchCreditNotes}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Search credit notes..."
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
                <th className="p-2 border">Credit Note#</th>
                <th className="p-2 border">Amount</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Project</th>
                    <th className="p-2 border">Reference</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentCreditNotes.length > 0 ? (
                currentCreditNotes.map((creditNote) => {
                  const displayCreditNoteNumber = creditNote.creditNoteNumber || "CN-" + creditNote._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: creditNote.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(creditNote.total || 0);

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={creditNote._id}
                      className="hover:bg-gray-50 cursor-pointer relative"
                      onMouseEnter={() => setHoveredId(creditNote._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="p-2 border font-mono relative">
                        {displayCreditNoteNumber}
                        {hoveredId === creditNote._id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-md p-1 flex gap-2 text-xs z-10">
                            <button
                              onClick={() => setViewCreditNote(creditNote)}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditCreditNote(creditNote);
                                setFormData({
                                  customer: creditNote.customer || "",
                                  status: creditNote.status || "Draft",
                                });
                              }}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEdit /> Update
                            </button>
                            <button
                              onClick={() => handleDelete(creditNote._id)}
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
                          <td className="p-2 border">{creditNote.customer || "-"}</td>
                          <td className="p-2 border">{formatDate(creditNote.creditNoteDate)}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !creditNote.status || creditNote.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : creditNote.status === "Issued"
                                  ? "bg-green-100 text-green-800"
                                  : creditNote.status === "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 border">{creditNote.customer || "-"}</td>
                          <td className="p-2 border">{creditNote.project || "-"}</td>
                          <td className="p-2 border">{creditNote.reference || "-"}</td>
                          <td className="p-2 border">{formatDate(creditNote.creditNoteDate)}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !creditNote.status || creditNote.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : creditNote.status === "Issued"
                                  ? "bg-green-100 text-green-800"
                                  : creditNote.status === "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 7} className="p-4 text-center text-gray-500">
                    No credit notes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {indexOfFirstCreditNote + 1} to {Math.min(indexOfLastCreditNote, filteredCreditNotes.length)} of{" "}
            {filteredCreditNotes.length} entries
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
      {viewCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Credit Note Details</h2>
            <p><b>Credit Note #:</b> {viewCreditNote.creditNoteNumber}</p>
            <p><b>Customer:</b> {viewCreditNote.customer}</p>
            <p><b>Reference:</b> {viewCreditNote.reference || "-"}</p>
            <p><b>Amount:</b> {viewCreditNote.total}</p>
            <p><b>Status:</b> {viewCreditNote.status}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewCreditNote(null)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {editCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Update Credit Note</h2>
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
              <option value="Issued">Issued</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditCreditNote(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNotes;