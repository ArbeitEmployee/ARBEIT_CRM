import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaFileAlt,
  FaFilter,
  FaEye,
  FaBullhorn,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const AnnouncementsPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedAnnouncements, setSelectedAnnouncements] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewAnnouncementForm, setShowNewAnnouncementForm] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    date: "",
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/admin/announcements`, {
        ...config,
        params: {
          search: searchTerm,
        },
      });
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [searchTerm]);

  // Search filter
  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredAnnouncements.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleAnnouncementSelection = (id) => {
    setSelectedAnnouncements((prev) =>
      prev.includes(id)
        ? prev.filter((announcementId) => announcementId !== id)
        : [...prev, id]
    );
  };

  const handleNewAnnouncementChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAnnouncement = async () => {
    if (isSaving) return;

    if (
      !newAnnouncement.title ||
      !newAnnouncement.content ||
      !newAnnouncement.date
    ) {
      alert("Please fill in all required fields (Title, Content, Date)");
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();

      if (editingAnnouncement) {
        // Update existing announcement
        await axios.put(
          `${API_BASE_URL}/admin/announcements/${editingAnnouncement._id}`,
          newAnnouncement,
          config
        );
        setShowNewAnnouncementForm(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
        alert("Announcement updated successfully!");
      } else {
        // Create new announcement
        await axios.post(
          `${API_BASE_URL}/admin/announcements`,
          newAnnouncement,
          config
        );
        setShowNewAnnouncementForm(false);
        fetchAnnouncements();
        alert("Announcement created successfully!");
      }

      // Reset form
      setNewAnnouncement({
        title: "",
        content: "",
        date: "",
      });
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert(
        `Error saving announcement: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      date: formatDateForInput(announcement.date),
    });
    setShowNewAnnouncementForm(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/admin/announcements/${id}`, config);
        fetchAnnouncements();
        alert("Announcement deleted successfully!");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        alert(
          `Error deleting announcement: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredAnnouncements.map((announcement) => ({
      ID: announcement._id,
      "Announcement Name": announcement.title,
      Date: formatDate(announcement.date),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Announcements");
    XLSX.writeFile(workbook, "Announcements.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredAnnouncements.map((announcement) => ({
      ID: announcement._id,
      "Announcement Name": announcement.title,
      Date: formatDate(announcement.date),
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Announcements.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = ["ID", "Announcement Name", "Date"];

    const tableRows = filteredAnnouncements.map((announcement) => [
      announcement._id,
      announcement.title,
      formatDate(announcement.date),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Announcements.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Announcements</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #111827; color: white; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      @media print {
        body { margin: 0; padding: 20px; }
        .no-print { display: none; }
      }
    `);
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write("<h1>Announcements</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    ["ID", "Announcement Name", "Date"].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredAnnouncements.forEach((announcement) => {
      printWindow.document.write("<tr>");
      [
        announcement._id,
        announcement.title,
        formatDate(announcement.date),
      ].forEach((value) => {
        printWindow.document.write(`<td>${value}</td>`);
      });
      printWindow.document.write("</tr>");
    });
    printWindow.document.write("</tbody>");

    printWindow.document.write("</table>");
    printWindow.document.write(
      '<p class="no-print">Printed on: ' + new Date().toLocaleString() + "</p>"
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
    setShowExportMenu(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          Loading Announcements...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Utilities
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {showNewAnnouncementForm
            ? editingAnnouncement
              ? "Edit Announcement"
              : "Add New Announcement"
            : "Announcements"}
        </h1>
        <div className="mt-1 flex items-center text-slate-500 text-sm">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Announcements</span>
        </div>
      </div>

      {showNewAnnouncementForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Announcement
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Announcement Details
              </h2>
            </div>
            <button
              onClick={() => {
                setShowNewAnnouncementForm(false);
                setEditingAnnouncement(null);
              }}
              className="text-slate-400 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={newAnnouncement.title}
                onChange={handleNewAnnouncementChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Content *
              </label>
              <textarea
                name="content"
                value={newAnnouncement.content}
                onChange={handleNewAnnouncementChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={newAnnouncement.date}
                onChange={handleNewAnnouncementChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewAnnouncementForm(false);
                setEditingAnnouncement(null);
              }}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAnnouncement}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
              disabled={
                !newAnnouncement.title ||
                !newAnnouncement.content ||
                !newAnnouncement.date ||
                isSaving
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-2"
                onClick={() => setShowNewAnnouncementForm(true)}
              >
                <FaPlus /> New Announcement
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-2"
                onClick={() => setCompactView(!compactView)}
              >
                {compactView ? "<<" : ">>"}
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div
            className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 ${
              compactView ? "w-1/2" : "w-full"
            }`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedAnnouncements.length > 0 && (
                  <button
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Delete ${selectedAnnouncements.length} selected announcements?`
                        )
                      ) {
                        try {
                          const config = createAxiosConfig();
                          await axios.post(
                            `${API_BASE_URL}/admin/announcements/bulk-delete`,
                            {
                              announcementIds: selectedAnnouncements,
                            },
                            config
                          );
                          setSelectedAnnouncements([]);
                          fetchAnnouncements();
                          alert("Selected announcements deleted!");
                        } catch {
                          alert("Error deleting selected announcements.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedAnnouncements.length})
                  </button>
                )}
                {/* Entries per page */}
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                </select>

                {/* Export button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div
                      ref={exportMenuRef}
                      className="absolute mt-1 w-32 rounded-2xl border border-white/60 bg-white shadow-2xl z-10 overflow-hidden"
                    >
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToExcel}
                      >
                        Excel
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToCSV}
                      >
                        CSV
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToPDF}
                      >
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={printTable}
                      >
                        Print
                      </button>
                    </div>
                  )}
                </div>

                {/* Refresh button */}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
                  onClick={fetchAnnouncements}
                >
                  <FaSyncAlt />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-wider font-semibold text-slate-500">
                    <th className="px-4 sm:px-6 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedAnnouncements.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAnnouncements(
                              currentData.map(
                                (announcement) => announcement._id
                              )
                            );
                          } else {
                            setSelectedAnnouncements([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 sm:px-6 py-3">Announcement Name</th>
                    <th className="px-4 sm:px-6 py-3">Date</th>
                    <th className="px-4 sm:px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {currentData.length > 0 ? (
                    currentData.map((announcement) => (
                      <tr
                        key={announcement._id}
                        className="hover:bg-white/70 relative"
                        style={{ color: "black" }}
                      >
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedAnnouncements.includes(
                                announcement._id
                              )}
                              onChange={() =>
                                toggleAnnouncementSelection(announcement._id)
                              }
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                          {announcement.title}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-slate-600">
                          {formatDate(announcement.date)}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex space-x-2">
                            {/* View Button */}
                            <button
                              onClick={() =>
                                setViewingAnnouncement(announcement)
                              }
                              className="text-blue-500 hover:text-blue-700"
                              title="View"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleEditAnnouncement(announcement)
                              }
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAnnouncement(announcement._id)
                              }
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 sm:px-6 py-4 text-center text-slate-500">
                        {announcements.length === 0
                          ? "No announcements found. Create your first announcement!"
                          : "No announcements match your search criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
              <span className="tabular-nums">
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredAnnouncements.length
                )}{" "}
                of {filteredAnnouncements.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`rounded-xl border px-3 py-2 font-semibold tabular-nums ${
                      currentPage === i + 1
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Announcement Modal */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50 p-4">
          <div className="rounded-2xl border border-white/60 bg-white p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {viewingAnnouncement.title}
              </h2>
              <button
                onClick={() => setViewingAnnouncement(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3 text-slate-700">
              <p>
                <b>Date:</b> {formatDate(viewingAnnouncement.date)}
              </p>
              <p>
                <b>Content:</b>
              </p>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/80 max-h-60 overflow-y-auto text-sm">
                {viewingAnnouncement.content}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingAnnouncement(null)}
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
