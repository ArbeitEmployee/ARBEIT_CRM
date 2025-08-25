import { useState, useEffect } from "react";
import { FaPlus, FaChevronRight, FaTimes, FaUser, FaUserCheck, FaUserTimes, FaUserClock, FaEdit, FaTrash, FaSyncAlt, FaSearch, FaEye } from "react-icons/fa";
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
  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);
  const [formData, setFormData] = useState({ 
    customer: "", 
    status: "Draft" 
  });

  // Stats data
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    issued: 0,
    cancelled: 0,
    pending: 0
  });

  // Fetch credit notes
  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/credit-notes");
      setCreditNotes(data.data || data);
      
      // Calculate stats
      const total = data.data?.length || data.length || 0;
      const draft = data.data?.filter(note => note.status === "Draft").length || 
                   data.filter(note => note.status === "Draft").length || 0;
      const issued = data.data?.filter(note => note.status === "Issued").length || 
                    data.filter(note => note.status === "Issued").length || 0;
      const cancelled = data.data?.filter(note => note.status === "Cancelled").length || 
                       data.filter(note => note.status === "Cancelled").length || 0;
      const pending = data.data?.filter(note => note.status === "Pending").length || 
                     data.filter(note => note.status === "Pending").length || 0;
      
      setStats({
        total,
        draft,
        issued,
        cancelled,
        pending
      });
    } catch (err) {
      console.error("Error fetching credit notes", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Toggle selection of credit notes
  const toggleCreditNoteSelection = (id) => {
    if (selectedCreditNotes.includes(id)) {
      setSelectedCreditNotes(selectedCreditNotes.filter(noteId => noteId !== id));
    } else {
      setSelectedCreditNotes([...selectedCreditNotes, id]);
    }
  };

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

  // Bulk delete credit notes
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCreditNotes.length} credit notes?`)) return;
    try {
      await Promise.all(selectedCreditNotes.map(id =>
        axios.delete(`http://localhost:5000/api/admin/credit-notes/${id}`)
      ));
      setCreditNotes(creditNotes.filter((cn) => !selectedCreditNotes.includes(cn._id)));
      setSelectedCreditNotes([]);
    } catch (err) {
      console.error("Error deleting credit notes", err);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Credit Notes</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Credit Notes</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Credit Notes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUser className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaUserClock className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Issued Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Issued</p>
              <p className="text-2xl font-bold">{stats.issued}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaUserCheck className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaUserClock className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Cancelled Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cancelled</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaUserTimes className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 text-sm rounded flex items-center gap-2" 
            style={{ backgroundColor: '#333333', color: 'white' }}
            onClick={() => navigate("../credit-notes/new")}
          >
            <FaPlus /> New Credit Note
          </button>
          
          {/* Bulk delete button */}
          {selectedCreditNotes.length > 0 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedCreditNotes.length})
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="border px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"}
          </button>
        </div>
      </div>

      {/* White box */}
      <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
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
              <option value={5}>5</option>
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
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Excel")}
                  >
                    Excel
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("CSV")}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("PDF")}
                  >
                    PDF
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Print")}
                  >
                    Print
                  </button>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              className="border px-2 py-1 rounded text-sm flex items-center"
              onClick={fetchCreditNotes}
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border rounded pl-8 pr-3 py-1 text-sm"
            />
            <button
              onClick={() => {
                setSearchTerm(searchInput);
                setCurrentPage(1);
              }}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                  <input
                    type="checkbox"
                    checked={selectedCreditNotes.length === currentCreditNotes.length && currentCreditNotes.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCreditNotes(currentCreditNotes.map(c => c._id));
                      } else {
                        setSelectedCreditNotes([]);
                      }
                    }}
                  />
                </th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Credit Note#</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                {compactView ? (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Reference</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
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

                  const getStatusColor = (status) => {
                    switch(status) {
                      case "Draft": return "bg-gray-100 text-gray-800";
                      case "Issued": return "bg-green-100 text-green-800";
                      case "Cancelled": return "bg-red-100 text-red-800";
                      case "Pending": return "bg-yellow-100 text-yellow-800";
                      default: return "bg-gray-100 text-gray-800";
                    }
                  };

                  return (
                    <tr
                      key={creditNote._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: 'black' }}
                      onMouseEnter={() => setHoveredId(creditNote._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCreditNotes.includes(creditNote._id)}
                            onChange={() => toggleCreditNoteSelection(creditNote._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0 font-mono">{displayCreditNoteNumber}</td>
                      <td className="p-3 border-0">{creditNote.customer || "-"}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0 text-right">{displayAmount}</td>
                          <td className="p-3 border-0">{formatDate(creditNote.creditNoteDate)}</td>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(creditNote.status)}`}>
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewCreditNote(creditNote)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditCreditNote(creditNote);
                                  setFormData({
                                    customer: creditNote.customer || "",
                                    status: creditNote.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(creditNote._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">{creditNote.project || "-"}</td>
                          <td className="p-3 border-0">{creditNote.reference || "-"}</td>
                          <td className="p-3 border-0 text-right">{displayAmount}</td>
                          <td className="p-3 border-0">{formatDate(creditNote.creditNoteDate)}</td>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(creditNote.status)}`}>
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewCreditNote(creditNote)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => {
                                  setEditCreditNote(creditNote);
                                  setFormData({
                                    customer: creditNote.customer || "",
                                    status: creditNote.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(creditNote._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={compactView ? 7 : 9} className="p-4 text-center text-gray-500">
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