import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaFileAlt, FaFilter, FaEye, FaBullhorn
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GoalsPage = () => {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    goalType: "Invoiced Amount",
    targetValue: "",
    currentValue: "",
    startDate: "",
    endDate: "",
    status: "Not Started"
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [viewingGoal, setViewingGoal] = useState(null);

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
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
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Calculate progress percentage
  const calculateProgress = (current, target) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const [loading, setLoading] = useState(true);

  // Fetch goals from API
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/goals", {
        params: {
          search: searchTerm,
          status: statusFilter !== "All" ? statusFilter : undefined,
          goalType: typeFilter !== "All" ? typeFilter : undefined
        }
      });
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      setGoals([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [searchTerm, statusFilter, typeFilter]);

  // Search filter
  const filteredGoals = goals.filter(goal => 
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredGoals.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredGoals.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleGoalSelection = (id) => {
    setSelectedGoals(prev =>
      prev.includes(id)
        ? prev.filter(goalId => goalId !== id)
        : [...prev, id]
    );
  };

  const handleNewGoalChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveGoal = async () => {
    if (isSaving) return;
    
    if (!newGoal.title || !newGoal.goalType || !newGoal.targetValue || !newGoal.startDate || !newGoal.endDate) {
      alert("Please fill in all required fields (Title, Goal Type, Target Value, Start Date, End Date)");
      return;
    }

    if (new Date(newGoal.startDate) > new Date(newGoal.endDate)) {
      alert("End date must be after start date");
      return;
    }

    setIsSaving(true);
    
    try {
      const goalData = {
        ...newGoal,
        targetValue: parseFloat(newGoal.targetValue),
        currentValue: parseFloat(newGoal.currentValue) || 0
      };

      if (editingGoal) {
        // Update existing goal
        await axios.put(`http://localhost:5000/api/admin/goals/${editingGoal._id}`, goalData);
        setShowNewGoalForm(false);
        setEditingGoal(null);
        fetchGoals();
        alert("Goal updated successfully!");
      } else {
        // Create new goal
        await axios.post("http://localhost:5000/api/admin/goals", goalData);
        setShowNewGoalForm(false);
        fetchGoals();
        alert("Goal created successfully!");
      }
      
      // Reset form
      setNewGoal({
        title: "",
        description: "",
        goalType: "Invoiced Amount",
        targetValue: "",
        currentValue: "",
        startDate: "",
        endDate: "",
        status: "Not Started"
      });
    } catch (error) {
      console.error("Error saving goal:", error);
      alert(`Error saving goal: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description || "",
      goalType: goal.goalType,
      targetValue: goal.targetValue.toString(),
      currentValue: goal.currentValue.toString(),
      startDate: formatDateForInput(goal.startDate),
      endDate: formatDateForInput(goal.endDate),
      status: goal.status
    });
    setShowNewGoalForm(true);
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/goals/${id}`);
        fetchGoals();
        alert("Goal deleted successfully!");
      } catch (error) {
        console.error("Error deleting goal:", error);
        alert(`Error deleting goal: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredGoals.map(goal => ({
      ID: goal._id,
      "Goal Name": goal.title,
      "Goal Type": goal.goalType,
      "Target Value": goal.targetValue,
      "Current Value": goal.currentValue,
      "Progress": `${calculateProgress(goal.currentValue, goal.targetValue)}%`,
      "Start Date": formatDate(goal.startDate),
      "End Date": formatDate(goal.endDate),
      "Status": goal.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Goals");
    XLSX.writeFile(workbook, "Goals.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredGoals.map(goal => ({
      ID: goal._id,
      "Goal Name": goal.title,
      "Goal Type": goal.goalType,
      "Target Value": goal.targetValue,
      "Current Value": goal.currentValue,
      "Progress": `${calculateProgress(goal.currentValue, goal.targetValue)}%`,
      "Start Date": formatDate(goal.startDate),
      "End Date": formatDate(goal.endDate),
      "Status": goal.status
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Goals.csv');
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
      "Goal Name",
      "Goal Type",
      "Target Value",
      "Current Value",
      "Progress",
      "Start Date",
      "End Date",
      "Status"
    ];
    
    const tableRows = filteredGoals.map(goal => [
      goal._id,
      goal.title,
      goal.goalType,
      goal.targetValue.toString(),
      goal.currentValue.toString(),
      `${calculateProgress(goal.currentValue, goal.targetValue)}%`,
      formatDate(goal.startDate),
      formatDate(goal.endDate),
      goal.status
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Goals.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=1000');
    printWindow.document.write('<html><head><title>Goals</title>');
    printWindow.document.write('<style>');
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
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Goals</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Goal Name', 'Goal Type', 'Target Value', 'Current Value', 'Progress', 'Start Date', 'End Date', 'Status'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredGoals.forEach(goal => {
      printWindow.document.write('<tr>');
      [
        goal._id,
        goal.title,
        goal.goalType,
        goal.targetValue,
        goal.currentValue,
        `${calculateProgress(goal.currentValue, goal.targetValue)}%`,
        formatDate(goal.startDate),
        formatDate(goal.endDate),
        goal.status
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

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading Goals...</div>

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewGoalForm ? (editingGoal ? "Edit Goal" : "Add New Goal") : "Goals"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Goals</span>
        </div>
      </div>

      {showNewGoalForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Goal Details</h2>
            <button 
              onClick={() => {
                setShowNewGoalForm(false);
                setEditingGoal(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={newGoal.title}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type *</label>
              <select
                name="goalType"
                value={newGoal.goalType}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="Invoiced Amount">Invoiced Amount</option>
                <option value="Make Contracts By Type">Make Contracts By Type</option>
                <option value="Achieve Total Income">Achieve Total Income</option>
                <option value="Increase Customer Number">Increase Customer Number</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
              <input
                type="number"
                name="targetValue"
                value={newGoal.targetValue}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
              <input
                type="number"
                name="currentValue"
                value={newGoal.currentValue}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={newGoal.startDate}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={newGoal.endDate}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={newGoal.status}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={newGoal.description}
                onChange={handleNewGoalChange}
                className="w-full border rounded px-3 py-2 h-32"
                placeholder="Optional description of the goal"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewGoalForm(false);
                setEditingGoal(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveGoal}
              className="px-4 py-2 bg-gray-900 text-white rounded text-sm"
              disabled={!newGoal.title || !newGoal.goalType || !newGoal.targetValue || !newGoal.startDate || !newGoal.endDate || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2 bg-gray-900 text-white"
                onClick={() => setShowNewGoalForm(true)}
              >
                <FaPlus /> New Goal
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
                {selectedGoals.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedGoals.length} selected goals?`)) {
                        try {
                          await axios.post("http://localhost:5000/api/admin/goals/bulk-delete", {
                            goalIds: selectedGoals
                          });
                          setSelectedGoals([]);
                          fetchGoals();
                          alert("Selected goals deleted!");
                        } catch {
                          alert("Error deleting selected goals.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedGoals.length})
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                
                {/* Status filter */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                
                {/* Type filter */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Invoiced Amount">Invoiced Amount</option>
                  <option value="Make Contracts By Type">Make Contracts By Type</option>
                  <option value="Achieve Total Income">Achieve Total Income</option>
                  <option value="Increase Customer Number">Increase Customer Number</option>
                </select>
                
                {/* Export button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="border px-2 py-1 rounded text-sm flex items-center gap-1 bg-gray-900 text-white"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div ref={exportMenuRef} className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
                  className="border px-2.5 py-1.5 rounded text-sm flex items-center bg-gray-900 text-white"
                  onClick={fetchGoals}
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
                    <th className="p-3 rounded-l-lg bg-gray-900 text-white">
                      <input
                        type="checkbox"
                        checked={selectedGoals.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoals(currentData.map((goal) => goal._id));
                          } else {
                            setSelectedGoals([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3 bg-gray-900 text-white">Goal Name</th>
                    <th className="p-3 bg-gray-900 text-white">Type</th>
                    <th className="p-3 bg-gray-900 text-white">Target</th>
                    <th className="p-3 bg-gray-900 text-white">Current</th>
                    <th className="p-3 bg-gray-900 text-white">Progress</th>
                    <th className="p-3 bg-gray-900 text-white">Start Date</th>
                    <th className="p-3 bg-gray-900 text-white">End Date</th>
                    <th className="p-3 bg-gray-900 text-white">Status</th>
                    <th className="p-3 rounded-r-lg bg-gray-900 text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((goal) => {
                      const progress = calculateProgress(goal.currentValue, goal.targetValue);
                      return (
                        <tr
                          key={goal._id}
                          className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                          style={{ color: 'black' }}
                        >
                          <td className="p-3 rounded-l-lg border-0">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedGoals.includes(goal._id)}
                                onChange={() => toggleGoalSelection(goal._id)}
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                          <td className="p-3 border-0 font-medium">{goal.title}</td>
                          <td className="p-3 border-0">{goal.goalType}</td>
                          <td className="p-3 border-0">{goal.targetValue}</td>
                          <td className="p-3 border-0">{goal.currentValue}</td>
                          <td className="p-3 border-0">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  progress < 50 ? 'bg-red-600' : 
                                  progress < 80 ? 'bg-yellow-500' : 'bg-green-600'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{progress}%</span>
                          </td>
                          <td className="p-3 border-0">{formatDate(goal.startDate)}</td>
                          <td className="p-3 border-0">{formatDate(goal.endDate)}</td>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              goal.status === "Completed" ? "bg-green-100 text-green-800" :
                              goal.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              goal.status === "Cancelled" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {goal.status}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              {/* View Button */}
                              <button
                                onClick={() => setViewingGoal(goal)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditGoal(goal)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-gray-500">
                        {goals.length === 0 ? "No goals found. Create your first goal!" : "No goals match your search criteria."}
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
                {Math.min(startIndex + entriesPerPage, filteredGoals.length)} of{" "}
                {filteredGoals.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Goal Modal */}
      {viewingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Goal Details</h2>
              <button 
                onClick={() => setViewingGoal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{viewingGoal.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{viewingGoal.goalType}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{viewingGoal.targetValue}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{viewingGoal.currentValue}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{formatDate(viewingGoal.startDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{formatDate(viewingGoal.endDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="border rounded px-3 py-2 bg-gray-50">{viewingGoal.status}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div 
                      className={`h-2.5 rounded-full ${
                        viewingGoal.progress < 50 ? 'bg-red-600' : 
                        viewingGoal.progress < 80 ? 'bg-yellow-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${viewingGoal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{viewingGoal.progress}%</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="border rounded px-3 py-2 bg-gray-50 min-h-32">{viewingGoal.description || "No description provided"}</p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setViewingGoal(null);
                  handleEditGoal(viewingGoal);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded text-sm"
              >
                Edit Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;