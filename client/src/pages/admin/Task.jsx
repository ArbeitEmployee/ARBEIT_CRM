import { useState, useEffect} from "react";
import { 
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight, 
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TaskPage = () => {
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
    complete: 0
  });
  const [newTask, setNewTask] = useState({
    projectName: "",
    customerId: "",
    customerName: "",
    tags: "",
    startDate: "",
    deadline: "",
    members: "",
    status: "Not Started"
  });
  const [editingTask, setEditingTask] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const statusOptions = [
    "Not Started",
    "In Progress",
    "Testing",
    "Feedback",
    "Complete"
  ];

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Format date from DD-MM-YYYY to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      setTasks(data.tasks || []);
      setStats(data.stats || {
        totalTasks: 0,
        notStarted: 0,
        inProgress: 0,
        testing: 0,
        feedback: 0,
        complete: 0
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
      setStats({
        totalTasks: 0,
        notStarted: 0,
        inProgress: 0,
        testing: 0,
        feedback: 0,
        complete: 0
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCustomerSearchResults([]);
      return;
    }
    
    try {
      const { data } = await axios.get(`http://localhost:5000/api/tasks/customers/search?q=${searchTerm}`);
      setCustomerSearchResults(data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearchTerm) {
        searchCustomers(customerSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchTerm]);

  // Search filter
  const filteredTasks = tasks.filter(task => 
    task._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.customer && task.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (task.tags && task.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    task.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredTasks.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleTaskSelection = (id) => {
    setSelectedTasks(prev =>
      prev.includes(id)
        ? prev.filter(taskId => taskId !== id)
        : [...prev, id]
    );
  };

  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
    
    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewTask(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveTask = async () => {
    if (isSaving) return;
    
    if (!newTask.projectName || !newTask.customerId) {
      alert("Please fill in all required fields (Project Name, Customer)");
      return;
    }

    setIsSaving(true);
    
    // Format dates for backend
    const taskData = {
      ...newTask,
      startDate: formatDateForBackend(newTask.startDate),
      deadline: formatDateForBackend(newTask.deadline)
    };
    
    try {
      if (editingTask) {
        // Update existing task
        await axios.put(`http://localhost:5000/api/tasks/${editingTask._id}`, taskData);
        setShowNewTaskForm(false);
        setEditingTask(null);
        fetchTasks();
        alert("Task updated successfully!");
      } else {
        // Create new task
        await axios.post("http://localhost:5000/api/tasks", taskData);
        setShowNewTaskForm(false);
        fetchTasks();
        alert("Task created successfully!");
      }
      
      // Reset form
      setNewTask({
        projectName: "",
        customerId: "",
        customerName: "",
        tags: "",
        startDate: "",
        deadline: "",
        members: "",
        status: "Not Started"
      });
    } catch (error) {
      console.error("Error saving task:", error);
      alert(`Error saving task: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      projectName: task.projectName,
      customerId: task.customerId,
      customerName: task.customer ? task.customer.company : "",
      tags: task.tags || "",
      startDate: formatDateForInput(task.startDate),
      deadline: formatDateForInput(task.deadline),
      members: task.members || "",
      status: task.status
    });
    setShowNewTaskForm(true);
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        fetchTasks();
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
        alert(`Error deleting task: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredTasks.map(task => ({
      ID: task._id,
      "Project Name": task.projectName,
      Customer: task.customer ? task.customer.company : "N/A",
      Tags: task.tags,
      "Start Date": task.startDate,
      Deadline: task.deadline,
      Members: task.members,
      Status: task.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "Tasks.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredTasks.map(task => ({
      ID: task._id,
      "Project Name": task.projectName,
      Customer: task.customer ? task.customer.company : "N/A",
      Tags: task.tags,
      "Start Date": task.startDate,
      Deadline: task.deadline,
      Members: task.members,
      Status: task.status
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Tasks.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "ID",
      "Project Name",
      "Customer",
      "Tags",
      "Start Date",
      "Deadline",
      "Members",
      "Status"
    ];
    
    const tableRows = filteredTasks.map(task => [
      task._id,
      task.projectName,
      task.customer ? task.customer.company : "N/A",
      task.tags,
      task.startDate,
      task.deadline,
      task.members,
      task.status
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Tasks.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Tasks</title>');
    printWindow.document.write('<style>');
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
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Tasks</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Project Name', 'Customer', 'Tags', 'Start Date', 'Deadline', 'Members', 'Status'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredTasks.forEach(task => {
      printWindow.document.write('<tr>');
      [
        task._id,
        task.projectName,
        task.customer ? task.customer.company : "N/A",
        task.tags,
        task.startDate,
        task.deadline,
        task.members,
        task.status
      ].forEach(value => {
        printWindow.document.write(`<td>${value}</td>`);
      });
      printWindow.document.write('</tr>');
    });
    printWindow.document.write('</tbody>');
    
    printWindow.document.write('</table>');
    printWindow.document.write('<p class="no-print">Printed on: ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
    setShowExportMenu(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Not Started": return "bg-gray-100 text-gray-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Testing": return "bg-yellow-100 text-yellow-800";
      case "Feedback": return "bg-purple-100 text-purple-800";
      case "Complete": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateString;
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewTaskForm ? (editingTask ? "Edit Task" : "Add New Task") : "Tasks"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Tasks</span>
        </div>
      </div>

      {showNewTaskForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Task Details</h2>
            <button 
              onClick={() => {
                setShowNewTaskForm(false);
                setEditingTask(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  value={newTask.projectName}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={newTask.customerName}
                    onChange={handleNewTaskChange}
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="Search customer by company name..."
                  />
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {customerSearchResults.map((customer, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.company}</div>
                          <div className="text-sm text-gray-600">{customer.contact} - {customer.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown && customerSearchResults.length === 0 && customerSearchTerm.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                      <div className="px-3 py-2 text-gray-500">No customers found</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={newTask.tags}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., warm, urgent, design"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={newTask.startDate}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={newTask.deadline}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                <input
                  type="text"
                  name="members"
                  value={newTask.members}
                  onChange={handleNewTaskChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 🌬️🌬️🌬️"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewTaskForm(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTask}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newTask.projectName || !newTask.customerId || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Tasks */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaCheckSquare className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Not Started */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Not Started</p>
                  <p className="text-2xl font-bold">{stats.notStarted}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaClock className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaSyncAlt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Testing */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Testing</p>
                  <p className="text-2xl font-bold">{stats.testing}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaPauseCircle className="text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Feedback</p>
                  <p className="text-2xl font-bold">{stats.feedback}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaBan className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Complete */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Complete</p>
                  <p className="text-2xl font-bold">{stats.complete}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaCheckCircle className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewTaskForm(true)}
              >
                <FaPlus /> New Task
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
          <div className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
              {selectedTasks.length > 0 && (
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={async () => {
                    if (window.confirm(`Delete ${selectedTasks.length} selected tasks?`)) {
                      try {
                        await Promise.all(selectedTasks.map(id =>
                          axios.delete(`http://localhost:5000/api/tasks/${id}`)
                        ));
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
                    <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
                  className="border px-2 py-1 rounded text-sm flex items-center"
                  onClick={fetchTasks}
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
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(currentData.map((task) => task._id));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project Name</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Deadline</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Start Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Deadline</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Members</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((task) => (
                      <tr
                        key={task._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                        style={{ color: 'black' }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task._id)}
                              onChange={() => toggleTaskSelection(task._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0 font-medium">{task.projectName}</td>
                        <td className="p-3 border-0">
                          {task.customer ? (
                            <div>
                              <div className="font-medium">{task.customer.company}</div>
                              <div className="text-xs text-gray-500">
                                {task.customer.contact} • {task.customer.email}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="p-3 border-0">
                              {formatDate(task.deadline)}
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
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
                            <td className="p-3 border-0">{task.tags || "-"}</td>
                            <td className="p-3 border-0">{formatDate(task.startDate)}</td>
                            <td className="p-3 border-0">{formatDate(task.deadline)}</td>
                            <td className="p-3 border-0">{task.members || "-"}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={compactView ? 6 : 9} className="p-4 text-center text-gray-500">
                        {tasks.length === 0 ? "No tasks found. Create your first task!" : "No tasks match your search criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredTasks.length)} of{" "}
                {filteredTasks.length} entries
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
        </>
      )}
    </div>
  );
};

export default TaskPage;