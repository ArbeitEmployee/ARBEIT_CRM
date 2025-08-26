import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaUser, FaBuilding, FaEnvelope, FaPhone, FaDollarSign, FaTag, FaUserCheck,
  FaFileImport
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LeadsPage = () => {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [leads, setLeads] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    customer: 0,
    lost: 0
  });
  const [newLead, setNewLead] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    value: "",
    tags: "",
    assigned: "",
    status: "New",
    source: "",
    lastContact: "",
    created: ""
  });
  const [editingLead, setEditingLead] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const statusOptions = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Customer",
    "Lost"
  ];

  const sourceOptions = [
    "Website",
    "Referral",
    "Social Media",
    "Cold Call",
    "Event",
    "Other",
    ""
  ];

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/leads");
      setLeads(data.leads || []);
      setStats(data.stats || {
        totalLeads: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        proposal: 0,
        customer: 0,
        lost: 0
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
      setStats({
        totalLeads: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        proposal: 0,
        customer: 0,
        lost: 0
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Search filter
  const filteredLeads = leads.filter(lead =>
    lead._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.tags && lead.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lead.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.assigned && lead.assigned.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredLeads.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleLeadSelection = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id)
        ? prev.filter(leadId => leadId !== id)
        : [...prev, id]
    );
  };

  const handleNewLeadChange = (e) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveLead = async () => {
    if (isSaving) return;
    
    if (!newLead.name || !newLead.company || !newLead.email) {
      alert("Please fill in all required fields (Name, Company, Email)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingLead) {
        // Update existing lead
        await axios.put(`http://localhost:5000/api/leads/${editingLead._id}`, newLead);
        setShowNewLeadForm(false);
        setEditingLead(null);
        fetchLeads();
        alert("Lead updated successfully!");
      } else {
        // Create new lead
        await axios.post("http://localhost:5000/api/leads", newLead);
        setShowNewLeadForm(false);
        fetchLeads();
        alert("Lead created successfully!");
      }
      
      // Reset form
      setNewLead({
        name: "",
        company: "",
        email: "",
        phone: "",
        value: "",
        tags: "",
        assigned: "",
        status: "New",
        source: "",
        lastContact: "",
        created: ""
      });
    } catch (error) {
      console.error("Error saving lead:", error);
      alert(`Error saving lead: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone || "",
      value: lead.value || "",
      tags: lead.tags || "",
      assigned: lead.assigned || "",
      status: lead.status,
      source: lead.source || "",
      lastContact: lead.lastContact || "",
      created: lead.created || ""
    });
    setShowNewLeadForm(true);
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await axios.delete(`http://localhost:5000/api/leads/${id}`);
        fetchLeads();
        alert("Lead deleted successfully!");
      } catch (error) {
        console.error("Error deleting lead:", error);
        alert(`Error deleting lead: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads?`)) {
      try {
        await axios.post("http://localhost:5000/api/leads/bulk-delete", { ids: selectedLeads });
        setSelectedLeads([]);
        fetchLeads();
        alert("Selected leads deleted successfully!");
      } catch (error) {
        console.error("Error bulk deleting leads:", error);
        alert(`Error deleting leads: ${error.response?.data?.message || error.message}`);
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
      
      const { data } = await axios.post('http://localhost:5000/api/leads/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportProgress(null);
      setImportResult({
        success: true,
        imported: data.importedCount,
        errorCount: data.errorMessages?.length || 0,
        errorMessages: data.errorMessages
      });
      
      // Refresh lead list
      fetchLeads();
    } catch (error) {
      console.error("Error importing leads:", error);
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
    const dataToExport = filteredLeads.map(lead => ({
      ID: lead._id,
      Name: lead.name,
      Company: lead.company,
      Email: lead.email,
      Phone: lead.phone || "",
      Value: lead.value,
      Tags: lead.tags || "",
      Assigned: lead.assigned || "",
      Status: lead.status,
      Source: lead.source || "",
      "Last Contact": lead.lastContact || "",
      Created: lead.created || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "Leads.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredLeads.map(lead => ({
      ID: lead._id,
      Name: lead.name,
      Company: lead.company,
      Email: lead.email,
      Phone: lead.phone || "",
      Value: lead.value,
      Tags: lead.tags || "",
      Assigned: lead.assigned || "",
      Status: lead.status,
      Source: lead.source || "",
      "Last Contact": lead.lastContact || "",
      Created: lead.created || ""
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Leads.csv');
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
      "Name",
      "Company",
      "Email",
      "Phone",
      "Value",
      "Tags",
      "Assigned",
      "Status",
      "Source",
      "Last Contact",
      "Created"
    ];
    
    const tableRows = filteredLeads.map(lead => [
      lead._id,
      lead.name,
      lead.company,
      lead.email,
      lead.phone || "-",
      `$${lead.value.toLocaleString()}`,
      lead.tags || "-",
      lead.assigned || "-",
      lead.status,
      lead.source || "-",
      lead.lastContact || "-",
      lead.created || "-"
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Leads.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Leads</title>');
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
    printWindow.document.write('<h1>Leads</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Name', 'Company', 'Email', 'Phone', 'Value', 'Tags', 'Assigned', 'Status', 'Source', 'Last Contact', 'Created'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredLeads.forEach(lead => {
      printWindow.document.write('<tr>');
      [
        lead._id,
        lead.name,
        lead.company,
        lead.email,
        lead.phone || "-",
        `$${lead.value.toLocaleString()}`,
        lead.tags || "-",
        lead.assigned || "-",
        lead.status,
        lead.source || "-",
        lead.lastContact || "-",
        lead.created || "-"
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
      case "New": return "bg-gray-100 text-gray-800";
      case "Contacted": return "bg-blue-100 text-blue-800";
      case "Qualified": return "bg-yellow-100 text-yellow-800";
      case "Proposal": return "bg-purple-100 text-purple-800";
      case "Customer": return "bg-green-100 text-green-800";
      case "Lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewLeadForm ? (editingLead ? "Edit Lead" : "Add New Lead") : "Leads"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Leads</span>
        </div>
      </div>

      {showNewLeadForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Lead Details</h2>
            <button 
              onClick={() => {
                setShowNewLeadForm(false);
                setEditingLead(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newLead.name}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={newLead.company}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newLead.email}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={newLead.phone}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  name="value"
                  value={newLead.value}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={newLead.tags}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., warm, urgent, enterprise"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  name="assigned"
                  value={newLead.assigned}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newLead.status}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  name="source"
                  value={newLead.source}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Source</option>
                  {sourceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact</label>
                <input
                  type="date"
                  name="lastContact"
                  value={newLead.lastContact}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <input
                  type="date"
                  name="created"
                  value={newLead.created}
                  onChange={handleNewLeadChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewLeadForm(false);
                setEditingLead(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveLead}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : (editingLead ? "Update Lead" : "Create Lead")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100">
                  <FaUser className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-gray-100">
                  <FaClock className="text-gray-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">New</h3>
                  <p className="text-2xl font-bold">{stats.new}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100">
                  <FaUserCheck className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Contacted</h3>
                  <p className="text-2xl font-bold">{stats.contacted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-yellow-100">
                  <FaCheckCircle className="text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Qualified</h3>
                  <p className="text-2xl font-bold">{stats.qualified}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-purple-100">
                  <FaPauseCircle className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Proposal</h3>
                  <p className="text-2xl font-bold">{stats.proposal}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-green-100">
                  <FaCheckCircle className="text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Customer</h3>
                  <p className="text-2xl font-bold">{stats.customer}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-red-100">
                  <FaBan className="text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Lost</h3>
                  <p className="text-2xl font-bold">{stats.lost}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="compactView"
                    checked={compactView}
                    onChange={() => setCompactView(!compactView)}
                    className="rounded"
                  />
                  <label htmlFor="compactView" className="text-sm text-gray-600">
                    Compact View
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {selectedLeads.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Delete Selected ({selectedLeads.length})
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <HiOutlineDownload className="mr-2" />
                    Export
                    <FaChevronDown className="ml-2 text-xs" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={exportToExcel}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export to Excel
                        </button>
                        <button
                          onClick={exportToCSV}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export to CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Export to PDF
                        </button>
                        <button
                          onClick={printTable}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Print
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleImportClick}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <FaFileImport className="mr-2" />
                  Import
                </button>

                <button
                  onClick={() => setShowNewLeadForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <FaPlus className="mr-2" />
                  New Lead
                </button>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === currentData.length && currentData.length > 0}
                        onChange={() => {
                          if (selectedLeads.length === currentData.length) {
                            setSelectedLeads([]);
                          } else {
                            setSelectedLeads(currentData.map(lead => lead._id));
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    {!compactView && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {!compactView && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={compactView ? 6 : 9} className="px-6 py-4 text-center text-gray-500">
                        {leads.length === 0 ? "No leads found. Click 'New Lead' to get started." : "No matching leads found."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead._id)}
                            onChange={() => toggleLeadSelection(lead._id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUser className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              {lead.customer && (
                                <div className="text-xs text-green-600">Customer Linked</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.company}</div>
                        </td>
                        {!compactView && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{lead.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{lead.phone || "-"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(lead.value)}</div>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        {!compactView && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.source || "-"}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + entriesPerPage, filteredLeads.length)}
                </span>{" "}
                of <span className="font-medium">{filteredLeads.length}</span> results
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-2">Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700 ml-2">entries</span>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 border rounded text-sm">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Leads</h3>
              <button
                onClick={closeImportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {!importResult ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a CSV or Excel file with lead data. Required columns: Name, Company, Email
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="w-full border rounded p-2"
                  />
                </div>

                {importProgress && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">
                    {importProgress.message}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeImportModal}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!importFile || importProgress}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              </>
            ) : (
              <>
                {importResult.success ? (
                  <div className="mb-4">
                    <div className="p-3 bg-green-50 text-green-700 rounded mb-4">
                      <p className="font-semibold">Import completed successfully!</p>
                      <p>{importResult.imported} leads imported</p>
                      {importResult.errorCount > 0 && (
                        <p>{importResult.errorCount} errors occurred</p>
                      )}
                    </div>

                    {importResult.errorCount > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Errors:</h4>
                        <div className="max-h-40 overflow-y-auto text-sm">
                          {importResult.errorMessages.map((error, index) => (
                            <div key={index} className="text-red-600 mb-1">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                    <p className="font-semibold">Import failed!</p>
                    <p>{importResult.message}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeImportModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;