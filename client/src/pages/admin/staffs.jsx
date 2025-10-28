import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const StaffsPage = () => {
  const [selectedStaffs, setSelectedStaffs] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewStaffForm, setShowNewStaffForm] = useState(false);
  const [staffs, setStaffs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalStaffs: 0,
    activeStaffs: 0,
    inactiveStaffs: 0,
  });
  const [newStaff, setNewStaff] = useState({
    staffCode: "", // ADDED: Staff code field
    name: "",
    position: "",
    department: "",
    phone: "",
    email: "",
    active: true,
  });
  const [editingStaff, setEditingStaff] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Get auth token from localStorage (using the correct key "crm_token")
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

  const [loading, setLoading] = useState(true);

  // Fetch staffs from API
  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        "http://localhost:5000/api/staffs",
        config
      );
      setStaffs(data.staffs || []);
      setStats({
        totalStaffs: data.stats?.totalStaffs ?? 0,
        activeStaffs: data.stats?.activeStaffs ?? 0,
        inactiveStaffs: data.stats?.inactiveStaffs ?? 0,
      });
    } catch (error) {
      console.error("Error fetching staffs:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        // Redirect to login page
        window.location.href = "/admin/login";
      }
      setStaffs([]);
      setStats({
        totalStaffs: 0,
        activeStaffs: 0,
        inactiveStaffs: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // Toggle staff active status
  const toggleStaffActive = async (id) => {
    try {
      const config = createAxiosConfig();
      await axios.patch(
        `http://localhost:5000/api/staffs/${id}/toggle-active`,
        {},
        config
      );
      fetchStaffs();
    } catch (error) {
      console.error("Error updating staff status:", error);
      alert(
        `Error updating staff status: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Search filter
  const filteredStaffs = (staffs || []).filter((s) =>
    Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredStaffs.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredStaffs.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleStaffSelection = (id) => {
    setSelectedStaffs((prev) =>
      prev.includes(id)
        ? prev.filter((staffId) => staffId !== id)
        : [...prev, id]
    );
  };

  const handleNewStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveStaff = async () => {
    if (isSaving) return;

    if (!newStaff.name || !newStaff.email) {
      alert("Please fill in all required fields (Name, Email)");
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();

      if (editingStaff) {
        // Update existing staff
        const response = await axios.put(
          `http://localhost:5000/api/staffs/${editingStaff._id}`,
          newStaff,
          config
        );
        if (response.status === 200) {
          setShowNewStaffForm(false);
          setEditingStaff(null);
          fetchStaffs();
          alert("Staff updated successfully!");
        }
      } else {
        // Create new staff
        const response = await axios.post(
          "http://localhost:5000/api/staffs",
          newStaff,
          config
        );
        if (response.status === 201) {
          setShowNewStaffForm(false);
          fetchStaffs();
          alert("Staff created successfully!");
        }
      }

      // Reset form
      setNewStaff({
        staffCode: "", // ADDED: Reset staff code
        name: "",
        position: "",
        department: "",
        phone: "",
        email: "",
        active: true,
      });
    } catch (error) {
      console.error("Error saving staff:", error);
      alert(
        `Error saving staff: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      staffCode: staff.staffCode || "", // ADDED: Include staff code
      name: staff.name,
      position: staff.position,
      department: staff.department,
      phone: staff.phone,
      email: staff.email,
      active: staff.active,
    });
    setShowNewStaffForm(true);
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`http://localhost:5000/api/staffs/${id}`, config);
        fetchStaffs();
        alert("Staff deleted successfully!");
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert(
          `Error deleting staff: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleImportClick = () => {
    setImportModalOpen(true);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      alert("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setImportProgress({ status: "uploading", message: "Uploading file..." });

      const token = getAuthToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.post(
        "http://localhost:5000/api/staffs/import",
        formData,
        config
      );

      setImportProgress(null);
      setImportResult({
        success: true,
        imported: data.importedCount,
        errorCount: data.errorMessages?.length || 0,
        errorMessages: data.errorMessages,
      });

      // Refresh staff list
      fetchStaffs();
    } catch (error) {
      console.error("Error importing staffs:", error);
      setImportProgress(null);
      setImportResult({
        success: false,
        message:
          error.response?.data?.message || error.message || "Import failed",
      });
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete selected staffs
  const handleDeleteSelected = async () => {
    if (window.confirm(`Delete ${selectedStaffs.length} selected staffs?`)) {
      try {
        const config = createAxiosConfig();
        await Promise.all(
          selectedStaffs.map((id) =>
            axios.delete(`http://localhost:5000/api/staffs/${id}`, config)
          )
        );
        setSelectedStaffs([]);
        fetchStaffs();
        alert("Selected staffs deleted!");
      } catch (error) {
        console.error("Error deleting selected staffs:", error);
        alert("Error deleting selected staffs.");
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredStaffs.map((staff) => ({
      "Staff Code": staff.staffCode, // ADDED: Staff code
      Name: staff.name,
      Position: staff.position,
      Department: staff.department,
      Email: staff.email,
      Phone: staff.phone,
      "Active Staff": staff.active ? "Yes" : "No",
      "Date Created": new Date(
        staff.dateCreated || staff.createdAt
      ).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staffs");
    XLSX.writeFile(workbook, "Staffs.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredStaffs.map((staff) => ({
      "Staff Code": staff.staffCode, // ADDED: Staff code
      Name: staff.name,
      Position: staff.position,
      Department: staff.department,
      Email: staff.email,
      Phone: staff.phone,
      "Active Staff": staff.active ? "Yes" : "No",
      "Date Created": new Date(
        staff.dateCreated || staff.createdAt
      ).toLocaleString(),
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Staffs.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Staff Code", // ADDED: Staff code
      "Name",
      "Position",
      "Department",
      "Email",
      "Phone",
      "Active Staff",
      "Date Created",
    ];

    const tableRows = filteredStaffs.map((staff) => [
      staff.staffCode || "N/A", // ADDED: Staff code
      staff.name,
      staff.position,
      staff.department,
      staff.email,
      staff.phone,
      staff.active ? "Yes" : "No",
      new Date(staff.dateCreated || staff.createdAt).toLocaleString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Staffs.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Staffs</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      @media print {
        body { margin: 0; padding: 20px; }
        .no-print { display: none; }
      }
    `);
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write("<h1>Staffs</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    [
      "Staff Code",
      "Name",
      "Position",
      "Department",
      "Email",
      "Phone",
      "Active Staff",
      "Date Created",
    ].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredStaffs.forEach((staff) => {
      printWindow.document.write("<tr>");
      [
        staff.staffCode || "N/A", // ADDED: Staff code
        staff.name,
        staff.position,
        staff.department,
        staff.email,
        staff.phone,
        staff.active ? "Yes" : "No",
        new Date(staff.dateCreated || staff.createdAt).toLocaleString(),
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
      <div className="bg-gray-100 min-h-screen p-4">Loading staffs...</div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {showNewStaffForm
            ? editingStaff
              ? "Edit Staff"
              : "Add New Staff"
            : "Staffs"}
        </h1>
        <div className="flex items-center text-gray-600">
          <span>Staff Management</span>
          <FaChevronRight className="mx-1 text-xs" />
        </div>
      </div>

      {showNewStaffForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Staff Details</h2>
            <button
              onClick={() => {
                setShowNewStaffForm(false);
                setEditingStaff(null);
                setNewStaff({
                  staffCode: "", // ADDED: Reset staff code
                  name: "",
                  position: "",
                  department: "",
                  phone: "",
                  email: "",
                  active: true,
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              {/* ADDED: Staff Code Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Code
                </label>
                <input
                  type="text"
                  name="staffCode"
                  placeholder="Leave blank to auto-generate"
                  value={newStaff.staffCode}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  readOnly={!!editingStaff} // Read-only when editing
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: STAFF-ABC123. Leave blank to auto-generate.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newStaff.name}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={newStaff.position}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={newStaff.department}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={newStaff.phone}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={newStaff.email}
                  onChange={handleNewStaffChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Status
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={newStaff.active}
                    onChange={(e) =>
                      setNewStaff((prev) => ({
                        ...prev,
                        active: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewStaffForm(false);
                setEditingStaff(null);
                setNewStaff({
                  staffCode: "", // ADDED: Reset staff code
                  name: "",
                  position: "",
                  department: "",
                  phone: "",
                  email: "",
                  active: true,
                });
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveStaff}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newStaff.name || !newStaff.email || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Staffs */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Staffs</p>
                  <p className="text-2xl font-bold">{stats.totalStaffs}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUser className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Staffs */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Staffs</p>
                  <p className="text-2xl font-bold">{stats.activeStaffs}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUserCheck className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Inactive Staffs */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Staffs</p>
                  <p className="text-2xl font-bold">{stats.inactiveStaffs}</p>
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
                style={{ backgroundColor: "#333333", color: "white" }}
                onClick={() => setShowNewStaffForm(true)}
              >
                <FaPlus /> New Staff
              </button>
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={handleImportClick}
              >
                Import Staffs
              </button>
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

          {/* White box for table */}
          <div
            className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
              compactView ? "w-1/2" : "w-full"
            }`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedStaffs.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected ({selectedStaffs.length})
                  </button>
                )}

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
                        onClick={exportToExcel}
                      >
                        Excel
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={exportToCSV}
                      >
                        CSV
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={exportToPDF}
                      >
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={printTable}
                      >
                        Print
                      </button>
                    </div>
                  )}
                </div>

                {/* Refresh button */}
                <button
                  className="border px-2.5 py-1.5 rounded text-sm flex items-center"
                  onClick={fetchStaffs}
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
                          selectedStaffs.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffs(currentData.map((s) => s._id));
                          } else {
                            setSelectedStaffs([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Staff Code
                    </th>{" "}
                    {/* ADDED: Staff Code column */}
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Name
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Position
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Email
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active
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
                          Department
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Phone
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date Created
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
                  {currentData.map((staff) => (
                    <tr
                      key={staff._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStaffs.includes(staff._id)}
                            onChange={() => toggleStaffSelection(staff._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      {/* ADDED: Staff Code cell */}
                      <td className="p-3 border-0">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                          {staff.staffCode}
                        </span>
                      </td>
                      <td className="p-3 border-0">{staff.name}</td>
                      <td className="p-3 border-0">{staff.position}</td>
                      <td className="p-3 border-0">{staff.email}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                                staff.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                              onClick={() => toggleStaffActive(staff._id)}
                              title="Toggle staff active status"
                            >
                              {staff.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditStaff(staff)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff._id)}
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
                          <td className="p-3 border-0">{staff.department}</td>
                          <td className="p-3 border-0">{staff.phone}</td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                                staff.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                              onClick={() => toggleStaffActive(staff._id)}
                              title="Toggle staff active status"
                            >
                              {staff.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {new Date(
                              staff.dateCreated || staff.createdAt
                            ).toLocaleString()}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditStaff(staff)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff._id)}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredStaffs.length)}{" "}
                of {filteredStaffs.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Import Staffs</h2>

            {importProgress ? (
              <div className="mb-4">
                <p className="text-sm">{importProgress.message}</p>
              </div>
            ) : importResult ? (
              <div
                className={`mb-4 p-3 rounded ${
                  importResult.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {importResult.success ? (
                  <>
                    <p className="font-semibold">Import completed!</p>
                    <p className="text-sm">Imported: {importResult.imported}</p>
                    <p className="text-sm">Errors: {importResult.errorCount}</p>
                    {importResult.errorMessages &&
                      importResult.errorMessages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold">
                            Error details:
                          </p>
                          <ul className="text-xs max-h-32 overflow-auto">
                            {importResult.errorMessages.map((error, index) => (
                              <li key={index} className="mt-1">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-sm">Error: {importResult.message}</p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm mb-2">
                  Select a CSV or Excel file to import staffs:
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              {!importResult && (
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>
              )}
              {!importProgress && !importResult && (
                <button
                  onClick={handleImportSubmit}
                  className="px-4 py-2 bg-black text-white rounded text-sm"
                  disabled={!importFile}
                >
                  Import
                </button>
              )}
              {importResult && (
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 bg-black text-white rounded text-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffsPage;
