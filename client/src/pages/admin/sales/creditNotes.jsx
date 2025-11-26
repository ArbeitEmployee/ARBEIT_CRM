import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaChevronRight,
  FaTimes,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaEye,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CreditNotes = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);
  const [viewCreditNote, setViewCreditNote] = useState(null);
  const [editCreditNote, setEditCreditNote] = useState(null);
  const [formData, setFormData] = useState({
    customer: "",
    status: "Draft",
  });

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("crm_token");
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch credit notes for the logged-in admin only
  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/credit-notes`,
        config
      );

      // Ensure we're getting the data in the correct format
      if (data.data) {
        setCreditNotes(data.data); // If response has data property
      } else if (Array.isArray(data)) {
        setCreditNotes(data); // If response is directly an array
      } else {
        console.error("Unexpected API response format:", data);
        setCreditNotes([]);
      }
    } catch (err) {
      console.error("Error fetching credit notes", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setCreditNotes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Toggle credit note selection
  const toggleCreditNoteSelection = (id) => {
    if (selectedCreditNotes.includes(id)) {
      setSelectedCreditNotes(
        selectedCreditNotes.filter((creditNoteId) => creditNoteId !== id)
      );
    } else {
      setSelectedCreditNotes([...selectedCreditNotes, id]);
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!creditNotes.length) return;

    const exportData = creditNotes.map((cn) => ({
      CreditNoteNumber:
        cn.creditNoteNumber || "CN-" + cn._id.slice(-6).toUpperCase(),
      Customer: cn.customer,
      Amount: cn.total,
      CreditNoteDate: cn.creditNoteDate
        ? new Date(cn.creditNoteDate).toLocaleDateString()
        : "-",
      Status: cn.status,
      Reference: cn.reference || "-",
      Project: cn.project || "-",
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) =>
            Object.values(row)
              .map((val) => `"${val}"`)
              .join(",")
          )
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("credit_notes.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Credit Notes</title></head><body>"
        );
        printWindow.document.write(
          "<table border='1' style='border-collapse: collapse; width: 100%;'>"
        );
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
    if (!window.confirm("Are you sure you want to delete this credit note?"))
      return;
    try {
      const config = createAxiosConfig();
      await axios.delete(`${API_BASE_URL}/admin/credit-notes/${id}`, config);
      setCreditNotes(creditNotes.filter((cn) => cn._id !== id));
      // Remove from selected if it was selected
      setSelectedCreditNotes(
        selectedCreditNotes.filter((creditNoteId) => creditNoteId !== id)
      );
    } catch (err) {
      console.error("Error deleting credit note", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Bulk delete credit notes
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCreditNotes.length} credit notes?`
      )
    )
      return;
    try {
      const config = createAxiosConfig();
      await Promise.all(
        selectedCreditNotes.map((id) =>
          axios.delete(`${API_BASE_URL}/admin/credit-notes/${id}`, config)
        )
      );
      setCreditNotes(
        creditNotes.filter((cn) => !selectedCreditNotes.includes(cn._id))
      );
      setSelectedCreditNotes([]);
      alert("Selected credit notes deleted successfully!");
    } catch (err) {
      console.error("Error deleting credit notes", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting selected credit notes.");
    }
  };

  // Update credit note
  const handleUpdate = async () => {
    try {
      const config = createAxiosConfig();
      await axios.put(
        `${API_BASE_URL}/admin/credit-notes/${editCreditNote._id}`,
        formData,
        config
      );
      setEditCreditNote(null);
      fetchCreditNotes();
    } catch (err) {
      console.error("Error updating credit note", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter(
    (creditNote) =>
      creditNote.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (
        creditNote.creditNoteNumber ||
        "CN-" + creditNote._id.slice(-6).toUpperCase()
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      creditNote.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastCreditNote = currentPage * entriesPerPage;
  const indexOfFirstCreditNote = indexOfLastCreditNote - entriesPerPage;
  const currentCreditNotes = filteredCreditNotes.slice(
    indexOfFirstCreditNote,
    indexOfLastCreditNote
  );
  const totalPages = Math.ceil(filteredCreditNotes.length / entriesPerPage);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Issued":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="bg-gray-100 min-h-screen p-4">
        Loading credit notes...
      </div>
    );

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
              <p className="text-2xl font-bold">{creditNotes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Draft").length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaEdit className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Pending Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Pending").length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Issued Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Issued</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Issued").length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaEye className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Cancelled Credit Notes */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cancelled</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Cancelled").length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm rounded flex items-center gap-2"
            style={{ backgroundColor: "#333333", color: "white" }}
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
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10"
                >
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
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
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
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedCreditNotes.length ===
                        currentCreditNotes.length &&
                      currentCreditNotes.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCreditNotes(
                          currentCreditNotes.map((c) => c._id)
                        );
                      } else {
                        setSelectedCreditNotes([]);
                      }
                    }}
                  />
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Credit Note#
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Customer
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Project
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Reference
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentCreditNotes.length > 0 ? (
                currentCreditNotes.map((creditNote) => {
                  const displayCreditNoteNumber =
                    creditNote.creditNoteNumber ||
                    "CN-" + creditNote._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: creditNote.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(creditNote.total || 0);

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime())
                      ? "-"
                      : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={creditNote._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCreditNotes.includes(
                              creditNote._id
                            )}
                            onChange={() =>
                              toggleCreditNoteSelection(creditNote._id)
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0 ">
                        {displayCreditNoteNumber}
                      </td>
                      <td className="p-3 border-0">
                        {creditNote.customer || "-"}
                      </td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">{displayAmount}</td>
                          <td className="p-3 border-0">
                            {formatDate(creditNote.creditNoteDate)}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                creditNote.status
                              )}`}
                            >
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
                                <FaEye size={16} />
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
                          <td className="p-3 border-0">
                            {creditNote.project || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {creditNote.reference || "-"}
                          </td>
                          <td className="p-3 border-0">{displayAmount}</td>
                          <td className="p-3 border-0">
                            {formatDate(creditNote.creditNoteDate)}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                creditNote.status
                              )}`}
                            >
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
                                <FaEye size={16} />
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
                  <td
                    colSpan={compactView ? 7 : 9}
                    className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                  >
                    {creditNotes.length === 0
                      ? "No credit notes found. Create your first credit note!"
                      : "No credit notes match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCreditNotes.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstCreditNote + 1} to{" "}
              {Math.min(indexOfLastCreditNote, filteredCreditNotes.length)} of{" "}
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
        )}
      </div>

      {/* View & Edit Modals */}
      {viewCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Credit Note Details</h2>
              <button
                onClick={() => setViewCreditNote(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <b>Credit Note #:</b>{" "}
                {viewCreditNote.creditNoteNumber ||
                  "CN-" + viewCreditNote._id.slice(-6).toUpperCase()}
              </p>
              <p>
                <b>Customer:</b> {viewCreditNote.customer || "-"}
              </p>
              <p>
                <b>Reference:</b> {viewCreditNote.reference || "-"}
              </p>
              <p>
                <b>Amount:</b>{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: viewCreditNote.currency || "USD",
                  minimumFractionDigits: 2,
                }).format(viewCreditNote.total || 0)}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    viewCreditNote.status
                  )}`}
                >
                  {viewCreditNote.status || "Draft"}
                </span>
              </p>
              {viewCreditNote.creditNoteDate && (
                <p>
                  <b>Date:</b>{" "}
                  {new Date(viewCreditNote.creditNoteDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewCreditNote(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Credit Note</h2>
              <button
                onClick={() => setEditCreditNote(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Issued">Issued</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditCreditNote(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-black text-white rounded text-sm"
              >
                Update Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNotes;
