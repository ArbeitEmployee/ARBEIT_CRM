import { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaFilter, FaSearch, FaSyncAlt, FaChevronRight, 
  FaTimes, FaEdit, FaTrash, FaChevronDown, FaFileImport 
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProjectPage = () => {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    customer: "",
    tags: "",
    startDate: "",
    deadline: "",
    members: "",
    status: "Progress"
  });
  const [editingProject, setEditingProject] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const statusOptions = [
    "Progress",
    "Last Started",
    "On Hold",
    "Cancelled",
    "Finished"
  ];

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      // For demo purposes, using dummy data
      setProjects([
        {
          _id: "001",
          name: "Build Website",
          customer: "Arbite, Muslime",
          tags: "warm",
          startDate: "20-08-2025",
          deadline: "20-09-2025",
          members: "🌬️ 🌬️ 🌬️",
          status: "Progress"
        },
        {
          _id: "002",
          name: "Mobile App Development",
          customer: "John Smith",
          tags: "hot",
          startDate: "15-07-2025",
          deadline: "15-10-2025",
          members: "🌬️ 🌬️",
          status: "Last Started"
        },
        {
          _id: "003",
          name: "SEO Optimization",
          customer: "Sarah Johnson",
          tags: "cold",
          startDate: "01-06-2025",
          deadline: "01-12-2025",
          members: "🌬️ 🌬️ 🌬️ 🌬️",
          status: "On Hold"
        },
        {
          _id: "004",
          name: "E-commerce Platform",
          customer: "Mike Brown",
          tags: "warm",
          startDate: "10-08-2025",
          deadline: "10-11-2025",
          members: "🌬️ 🌬️ 🌬️",
          status: "Progress"
        },
        {
          _id: "005",
          name: "Content Marketing",
          customer: "Emily Davis",
          tags: "hot",
          startDate: "05-09-2025",
          deadline: "05-12-2025",
          members: "🌬️",
          status: "Finished"
        },
        {
          _id: "006",
          name: "Social Media Campaign",
          customer: "David Wilson",
          tags: "warm",
          startDate: "25-07-2025",
          deadline: "25-10-2025",
          members: "🌬️ 🌬️",
          status: "Cancelled"
        },
        {
          _id: "007",
          name: "UI/UX Redesign",
          customer: "Lisa Taylor",
          tags: "hot",
          startDate: "12-08-2025",
          deadline: "12-11-2025",
          members: "🌬️ 🌬️ 🌬️ 🌬️",
          status: "Progress"
        },
        {
          _id: "008",
          name: "Data Analytics Dashboard",
          customer: "Robert Miller",
          tags: "cold",
          startDate: "30-06-2025",
          deadline: "30-09-2025",
          members: "🌬️ 🌬️",
          status: "Last Started"
        },
        {
          _id: "009",
          name: "Email Marketing System",
          customer: "Jennifer Brown",
          tags: "warm",
          startDate: "18-07-2025",
          deadline: "18-10-2025",
          members: "🌬️ 🌬️ 🌬️",
          status: "On Hold"
        },
        {
          _id: "010",
          name: "Brand Identity Design",
          customer: "Thomas Anderson",
          tags: "hot",
          startDate: "22-08-2025",
          deadline: "22-11-2025",
          members: "🌬️ 🌬️",
          status: "Finished"
        }
      ]);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Search filter
  const filteredProjects = projects.filter(project => 
    project._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.tags.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredProjects.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleProjectSelection = (id) => {
    setSelectedProjects(prev =>
      prev.includes(id)
        ? prev.filter(projectId => projectId !== id)
        : [...prev, id]
    );
  };

  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProject = async () => {
    if (isSaving) return;
    
    if (!newProject.name || !newProject.customer) {
      alert("Please fill in all required fields (Name, Customer)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingProject) {
        // Update existing project
        setShowNewProjectForm(false);
        setEditingProject(null);
        fetchProjects();
        alert("Project updated successfully!");
      } else {
        // Create new project
        setShowNewProjectForm(false);
        fetchProjects();
        alert("Project created successfully!");
      }
      
      // Reset form
      setNewProject({
        name: "",
        customer: "",
        tags: "",
        startDate: "",
        deadline: "",
        members: "",
        status: "Progress"
      });
    } catch (error) {
      console.error("Error saving project:", error);
      alert(`Error saving project: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      customer: project.customer,
      tags: project.tags,
      startDate: project.startDate,
      deadline: project.deadline,
      members: project.members,
      status: project.status
    });
    setShowNewProjectForm(true);
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        fetchProjects();
        alert("Project deleted successfully!");
      } catch (error) {
        console.error("Error deleting project:", error);
        alert(`Error deleting project: ${error.response?.data?.message || error.message}`);
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
    formData.append('file', importFile);

    try {
      setImportProgress({ status: 'uploading', message: 'Uploading file...' });
      
      // Simulate API call
      setTimeout(() => {
        setImportProgress(null);
        setImportResult({
          success: true,
          imported: 5,
          errorCount: 0,
          errorMessages: []
        });
        
        // Refresh project list
        fetchProjects();
      }, 1500);
    } catch (error) {
      console.error("Error importing projects:", error);
      setImportProgress(null);
      setImportResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Import failed'
      });
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredProjects.map(project => ({
      ID: project._id,
      Name: project.name,
      Customer: project.customer,
      Tags: project.tags,
      'Start Date': project.startDate,
      Deadline: project.deadline,
      Members: project.members,
      Status: project.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    XLSX.writeFile(workbook, "Projects.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredProjects.map(project => ({
      ID: project._id,
      Name: project.name,
      Customer: project.customer,
      Tags: project.tags,
      'Start Date': project.startDate,
      Deadline: project.deadline,
      Members: project.members,
      Status: project.status
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Projects.csv');
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
    
    const tableRows = filteredProjects.map(project => [
      project._id,
      project.name,
      project.customer,
      project.tags,
      project.startDate,
      project.deadline,
      project.members,
      project.status
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Projects.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Projects</title>');
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
    printWindow.document.write('<h1>Projects</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Project Name', 'Customer', 'Tags', 'Start Date', 'Deadline', 'Members', 'Status'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredProjects.forEach(project => {
      printWindow.document.write('<tr>');
      [
        project._id,
        project.name,
        project.customer,
        project.tags,
        project.startDate,
        project.deadline,
        project.members,
        project.status
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
      case "Progress": return "bg-blue-100 text-blue-800";
      case "Last Started": return "bg-green-100 text-green-800";
      case "On Hold": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Finished": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewProjectForm ? (editingProject ? "Edit Project" : "Add New Project") : "Projects"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Projects</span>
        </div>
      </div>

      {showNewProjectForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Project Details</h2>
            <button 
              onClick={() => {
                setShowNewProjectForm(false);
                setEditingProject(null);
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
                  name="name"
                  value={newProject.name}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <input
                  type="text"
                  name="customer"
                  value={newProject.customer}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={newProject.tags}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newProject.status}
                  onChange={handleNewProjectChange}
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
                  type="text"
                  name="startDate"
                  value={newProject.startDate}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="text"
                  name="deadline"
                  value={newProject.deadline}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                <input
                  type="text"
                  name="members"
                  value={newProject.members}
                  onChange={handleNewProjectChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="🌬️ 🌬️ 🌬️"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewProjectForm(false);
                setEditingProject(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProject}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newProject.name || !newProject.customer || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* White box for table */}
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`} 
               style={{ borderRadius: '8px', border: '1px solid #E0E0E0', backgroundColor: '#F2F4F7' }}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Entries per page */}
                <div className="flex items-center gap-2">
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
                </div>
                
                {/* Filter button */}
                <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
                  <FaFilter /> Filter
                </button>
                
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

              <div className="flex items-center gap-2">
                {/* Arrow button */}
                <button
                  className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                  onClick={() => setCompactView(!compactView)}
                >
                  {compactView ? "<<" : ">>"}
                </button>

                {/* New Project button */}
                <button 
                  className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                  onClick={() => setShowNewProjectForm(true)}
                >
                  <FaPlus /> New Project
                </button>
                
                {/* Import Projects button */}
                <button 
                  className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                  onClick={handleImportClick}
                >
                  <FaFileImport /> Import Projects
                </button>
                
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
                  onClick={fetchProjects}
                >
                  <FaSyncAlt />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Bulk delete button */}
              {selectedProjects.length > 0 && (
                <div className="p-2 border bg-red-50 mb-2 rounded-lg">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedProjects.length} selected projects?`)) {
                        try {
                          setSelectedProjects([]);
                          fetchProjects();
                          alert("Selected projects deleted!");
                        } catch {
                          alert("Error deleting selected projects.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedProjects.length})
                  </button>
                </div>
              )}
              
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects(currentData.map(c => c._id));
                          } else {
                            setSelectedProjects([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>#ID</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project Name</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Start Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Deadline</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Members</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                
                <tbody>
                  {currentData.map((project) => (
                    <tr 
                      key={project._id} 
                      className="hover:bg-gray-50 relative"
                      onMouseEnter={() => setHoveredRow(project._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: 'white', color: 'black' }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project._id)}
                            onChange={() => toggleProjectSelection(project._id)}
                            className="h-4 w-4"
                          />
                          {hoveredRow === project._id && (
                            <div className="absolute left-8 flex space-x-1 bg-white shadow-md rounded p-1 z-10">
                              <button 
                                onClick={() => handleEditProject(project)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProject(project._id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-0">#{project._id}</td>
                      <td className="p-3 border-0">{project.name}</td>
                      <td className="p-3 border-0">{project.customer}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 rounded-r-lg border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">{project.tags}</td>
                          <td className="p-3 border-0">{project.startDate}</td>
                          <td className="p-3 border-0">{project.deadline}</td>
                          <td className="p-3 border-0">{project.members}</td>
                          <td className="p-3 rounded-r-lg border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredProjects.length)} of{" "}
                {filteredProjects.length} entries
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

      {/* Import Projects Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Projects</h2>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your CSV data should include <strong>Name</strong> and <strong>Customer</strong> columns.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer block"
                >
                  {importFile ? (
                    <div className="text-green-600">
                      <p>Selected file: {importFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <HiOutlineDownload className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Only CSV files are accepted
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {importProgress && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p>{importProgress.message}</p>
              </div>
            )}

            {importResult && (
              <div className={`mb-4 p-3 rounded text-sm ${
                  importResult.success && (!importResult.errorCount || importResult.errorCount === 0)
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}>
                {importResult.success ? (
                  <>
                    <p>Import completed with {importResult.imported} successful and {importResult.errorCount} failed.</p>
                    {importResult.errorCount > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Show error details</summary>
                        <div className="bg-white p-2 mt-1 rounded border text-xs max-h-32 overflow-auto">
                          {importResult.errorMessages?.map((msg, i) => (
                            <p key={i}>{msg}</p>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <p>Error: {importResult.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importProgress}
                className={`px-4 py-2 rounded text-sm ${
                  !importFile || importProgress
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white'
                }`}
              >
                {importProgress ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;