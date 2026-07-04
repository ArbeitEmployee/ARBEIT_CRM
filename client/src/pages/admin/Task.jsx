/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaPauseCircle,
  FaBan,
  FaCheckSquare,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Custom hook for detecting outside clicks
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [ref, callback]);

  return ref;
};

const TaskPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    notStarted: 0,
    inProgress: 0,
    testing: 0,
    feedback: 0,
    complete: 0,
  });
  const [newTask, setNewTask] = useState({
    projectName: "",
    priority: "Medium",
    startDate: "",
    deadline: "",
    members: "",
    status: "Not Started",
    description: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const statusOptions = [
    "Not Started",
    "In Progress",
    "Testing",
    "Feedback",
    "Complete",
  ];

  const priorityOptions = ["Urgent", "High", "Medium", "Low"];

  // Use the custom hook for detecting outside clicks
  const exportRef = useOutsideClick(() => {
    setShowExportMenu(false);
  });

  const staffRef = useOutsideClick(() => {
    setShowStaffDropdown(false);
  });

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

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Format date from DD-MM-YYYY to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/tasks`, config);
      setTasks(data.tasks || []);
      setStats(
        data.stats || {
          totalTasks: 0,
          notStarted: 0,
          inProgress: 0,
          testing: 0,
          feedback: 0,
          complete: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      setTasks([]);
      setStats({
        totalTasks: 0,
        notStarted: 0,
        inProgress: 0,
        testing: 0,
        feedback: 0,
        complete: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Search staff by name
  const searchStaff = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setStaffSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/staffs?search=${searchTerm}`,
        config
      );
      setStaffSearchResults(data.staffs || []);
    } catch (error) {
      console.error("Error searching staff:", error);
      setStaffSearchResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (staffSearchTerm) {
        searchStaff(staffSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [staffSearchTerm]);

  // Search filter
  const filteredTasks = tasks.filter(
    (task) =>
      task._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredTasks.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleTaskSelection = (id) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]
    );
  };

  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));

    if (name === "members") {
      setStaffSearchTerm(value);
      setShowStaffDropdown(true);
    }
  };

  const handleSelectStaff = (staff) => {
    setNewTask((prev) => ({
      ...prev,
      members: prev.members ? `${prev.members}, ${staff.name}` : staff.name,
    }));
    setShowStaffDropdown(false);
    setStaffSearchTerm("");
  };

  const handleSaveTask = async () => {
    if (isSaving) return;

    if (!newTask.projectName) {
      alert("Please fill in all required fields (Subject)");
      return;
    }

    setIsSaving(true);

    // Format dates for backend
    const taskData = {
      ...newTask,
      startDate: formatDateForBackend(newTask.startDate),
      deadline: formatDateForBackend(newTask.deadline),
    };

    try {
      const config = createAxiosConfig();

      if (editingTask) {
        // Update existing task
        await axios.put(
          `${API_BASE_URL}/tasks/${editingTask._id}`,
          taskData,
          config
        );
        setShowNewTaskForm(false);
        setEditingTask(null);
        fetchTasks();
        alert("Task updated successfully!");
      } else {
        // Create new task
        await axios.post(`${API_BASE_URL}/tasks`, taskData, config);
        setShowNewTaskForm(false);
        fetchTasks();
        alert("Task created successfully!");
      }

      // Reset form
      setNewTask({
        projectName: "",
        priority: "Medium",
        startDate: "",
        deadline: "",
        members: "",
        status: "Not Started",
        description: "",
      });
    } catch (error) {
      console.error("Error saving task:", error);
      alert(
        `Error saving task: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      projectName: task.projectName,
      priority: task.priority,
      startDate: formatDateForInput(task.startDate),
      deadline: formatDateForInput(task.deadline),
      members: task.members || "",
      status: task.status,
      description: task.description || "",
    });
    setShowNewTaskForm(true);
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/tasks/${id}`, config);
        fetchTasks();
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
        alert(
          `Error deleting task: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleViewDescription = (description) => {
    setCurrentDescription(description);
    setShowDescriptionModal(true);
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredTasks.map((task) => ({
      ID: task._id,
      Subject: task.projectName,
      Priority: task.priority,
      "Start Date": task.startDate,
      Deadline: task.deadline,
      Members: task.members,
      Status: task.status,
      Description: task.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "Tasks.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredTasks.map((task) => ({
      ID: task._id,
      Subject: task.projectName,
      Priority: task.priority,
      "Start Date": task.startDate,
      Deadline: task.deadline,
      Members: task.members,
      Status: task.status,
      Description: task.description,
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Tasks.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "ID",
      "Subject",
      "Priority",
      "Start Date",
      "Deadline",
      "Members",
      "Status",
      "Description",
    ];

    const tableRows = filteredTasks.map((task) => [
      task._id,
      task.projectName,
      task.priority,
      task.startDate,
      task.deadline,
      task.members,
      task.status,
      task.description,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Tasks.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Tasks</title>");
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
    printWindow.document.write("<h1>Tasks</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    [
      "ID",
      "Subject",
      "Priority",
      "Start Date",
      "Deadline",
      "Members",
      "Status",
      "Description",
    ].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredTasks.forEach((task) => {
      printWindow.document.write("<tr>");
      [
        task._id,
        task.projectName,
        task.priority,
        task.startDate,
        task.deadline,
        task.members,
        task.status,
        task.description,
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Testing":
        return "bg-yellow-100 text-yellow-800";
      case "Feedback":
        return "bg-purple-100 text-purple-800";
      case "Complete":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateString;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-slate-600">
        Loading tasks...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Workspace
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {showNewTaskForm
            ? editingTask
              ? "Edit Task"
              : "Add New Task"
            : "Tasks"}
        </h1>
        <div className="flex items-center text-slate-500">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Tasks</span>
        </div>
      </div>

      {showNewTaskForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Task Details</h2>
            <button
              onClick={() => {
                setShowNewTaskForm(false);
                setEditingTask(null);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={newTask.projectName}
                  onChange={handleNewTaskChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleNewTaskChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleNewTaskChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newTask.startDate}
                  onChange={handleNewTaskChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={newTask.deadline}
                  onChange={handleNewTaskChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Members
                </label>
                <div className="relative" ref={staffRef}>
                  <input
                    type="text"
                    name="members"
                    value={newTask.members}
                    onChange={handleNewTaskChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Search staff by name..."
                  />
                  {showStaffDropdown && staffSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {staffSearchResults.map((staff, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleSelectStaff(staff)}
                        >
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-gray-600">
                            {staff.position} - {staff.department}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showStaffDropdown &&
                    staffSearchResults.length === 0 &&
                    staffSearchTerm.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                        <div className="px-3 py-2 text-gray-500">
                          No staff found
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={newTask.description}
              onChange={handleNewTaskChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Enter task description..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewTaskForm(false);
                setEditingTask(null);
              }}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTask}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
              disabled={!newTask.projectName || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tasks */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Total Tasks
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalTasks}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500">
                  <FaCheckSquare className="text-white" />
                </div>
              </div>
            </div>

            {/* Not Started */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Not Started
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.notStarted}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-400">
                  <FaClock className="text-white" />
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    In Progress
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
                  <FaSyncAlt className="text-white" />
                </div>
              </div>
            </div>

            {/* Testing */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Testing
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.testing}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500">
                  <FaPauseCircle className="text-white" />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Feedback
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.feedback}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500">
                  <FaBan className="text-white" />
                </div>
              </div>
            </div>

            {/* Complete */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Complete
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.complete}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500">
                  <FaCheckCircle className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-2"
                onClick={() => setShowNewTaskForm(true)}
              >
                <FaPlus /> New Task
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
                {selectedTasks.length > 0 && (
                  <button
                    className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Delete ${selectedTasks.length} selected tasks?`
                        )
                      ) {
                        try {
                          const config = createAxiosConfig();
                          await Promise.all(
                            selectedTasks.map((id) =>
                              axios.delete(
                                `${API_BASE_URL}/tasks/${id}`,
                                config
                              )
                            )
                          );
                          setSelectedTasks([]);
                          fetchTasks();
                          alert("Selected tasks deleted!");
                        } catch {
                          alert("Error deleting selected tasks.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedTasks.length})
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                {/* Export button */}
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div className="absolute mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg z-10 overflow-hidden">
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
                  onClick={fetchTasks}
                >
                  <FaSyncAlt />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="px-4 sm:px-6 py-3 rounded-l-xl bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedTasks.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(
                              currentData.map((task) => task._id)
                            );
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                    >
                      Subject
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                    >
                      Priority
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Status
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Deadline
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 rounded-r-xl bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Start Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Deadline
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Members
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Status
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 rounded-r-xl bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left"
                        >
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((task) => (
                      <tr
                        key={task._id}
                        className="bg-white/70 shadow-sm rounded-xl hover:bg-white relative text-slate-700"
                      >
                        <td className="px-4 sm:px-6 py-3 rounded-l-xl border-0 text-sm">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task._id)}
                              onChange={() => toggleTaskSelection(task._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm font-medium text-slate-900">
                          {task.projectName}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        {compactView ? (
                          <>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              {formatDate(task.deadline)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 rounded-r-xl border-0 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleViewDescription(task.description)
                                  }
                                  className="rounded-lg p-2 bg-slate-100 text-slate-700 hover:brightness-95"
                                  title="View Description"
                                >
                                  <FaEye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="rounded-lg p-2 bg-blue-100 text-blue-700 hover:brightness-95"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="rounded-lg p-2 bg-red-100 text-red-700 hover:brightness-95"
                                  title="Delete"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              {formatDate(task.startDate)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              {formatDate(task.deadline)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              {task.members || "-"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 rounded-r-xl border-0 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleViewDescription(task.description)
                                  }
                                  className="rounded-lg p-2 bg-slate-100 text-slate-700 hover:brightness-95"
                                  title="View Description"
                                >
                                  <FaEye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="rounded-lg p-2 bg-blue-100 text-blue-700 hover:brightness-95"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="rounded-lg p-2 bg-red-100 text-red-700 hover:brightness-95"
                                  title="Delete"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 9}
                        className="p-4 text-center text-gray-500"
                      >
                        {tasks.length === 0
                          ? "No tasks found. Create your first task!"
                          : "No tasks match your search criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredTasks.length)} of{" "}
                {filteredTasks.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                      currentPage === i + 1
                        ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white border-transparent"
                        : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl p-6 w-11/12 md:w-2/3 lg:w-1/2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Task Description
              </h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 h-64 overflow-y-auto text-sm text-slate-700">
              {currentDescription ? (
                <p className="whitespace-pre-wrap">{currentDescription}</p>
              ) : (
                <p className="text-slate-500 italic">No description provided</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
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

export default TaskPage;
