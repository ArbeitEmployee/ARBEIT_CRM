import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown, FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaUser, FaBuilding, FaEnvelope, FaPhone, FaDollarSign, FaTag, FaUserCheck,
  FaFileImport, FaFilter
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Custom hook for detecting outside clicks
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [ref, callback]);

  return ref;
};

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
  const [chartData, setChartData] = useState([]);
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

  // Use the custom hook for detecting outside clicks
  const exportRef = useOutsideClick(() => {
    setShowExportMenu(false);
  });

  const [loading, setLoading] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('crm_token');
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch leads from API
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get("http://localhost:5000/api/leads", config);
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
      setChartData(data.chartData || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
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
      setChartData([]);
    }
    setLoading(false);
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
      const config = createAxiosConfig();
      
      if (editingLead) {
        // Update existing lead
        await axios.put(`http://localhost:5000/api/leads/${editingLead._id}`, newLead, config);
        setShowNewLeadForm(false);
        setEditingLead(null);
        fetchLeads();
        alert("Lead updated successfully!");
      } else {
        // Create new lead
        await axios.post("http://localhost:5000/api/leads", newLead, config);
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
        const config = createAxiosConfig();
        await axios.delete(`http://localhost:5000/api/leads/${id}`, config);
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
        const config = createAxiosConfig();
        await axios.post("http://localhost:5000/api/leads/bulk-delete", { ids: selectedLeads }, config);
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

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      };

      const { data } = await axios.post('http://localhost:5000/api/leads/import', formData, config);

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

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading leads...</div>;

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

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowNewLeadForm(false);
                setEditingLead(null);
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLead}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (editingLead ? 'Update Lead' : 'Save Lead')}
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

          {/* Leads by Source Chart */}
          {chartData.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Leads by Source</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Number of Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewLeadForm(true)}
              >
                <FaPlus /> New Lead
              </button>
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={handleImportClick}
              >
                Import Leads
              </button>
            </div>
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

          {/* White box for table */}
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedLeads.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected ({selectedLeads.length})
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
                <div className="relative" ref={exportRef}>
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
                  className="border px-2.5 py-1.5 rounded text-sm flex items-center"
                  onClick={fetchLeads}
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
                        checked={selectedLeads.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(currentData.map(c => c._id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Name</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Company</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Email</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Phone</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Value</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Source</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={compactView ? 5 : 9} className="p-3 text-center text-gray-500">
                        {leads.length === 0 ? "No leads found. Click 'New Lead' to get started." : "No matching leads found."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((lead) => (
                      <tr
                        key={lead._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50"
                        style={{ color: 'black' }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead._id)}
                              onChange={() => toggleLeadSelection(lead._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUser className="text-blue-600 text-sm" />
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              {lead.customer && (
                                <div className="text-xs text-gray-500">Customer</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-0">
                          <div className="flex items-center">
                            <FaBuilding className="text-gray-400 mr-1" />
                            <span>{lead.company}</span>
                          </div>
                        </td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex items-center space-x-2">
                                <button
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => handleDeleteLead(lead._id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 border-0">
                              <div className="flex items-center">
                                <FaEnvelope className="text-gray-400 mr-1" />
                                <span>{lead.email}</span>
                              </div>
                            </td>
                            <td className="p-3 border-0">
                              <div className="flex items-center">
                                <FaPhone className="text-gray-400 mr-1" />
                                <span>{lead.phone || "-"}</span>
                              </div>
                            </td>
                            <td className="p-3 border-0">
                              <div className="flex items-center">
                                <FaDollarSign className="text-gray-400 mr-1" />
                                <span>{formatCurrency(lead.value || 0)}</span>
                              </div>
                            </td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-3 border-0">
                              <div className="flex items-center">
                                <FaTag className="text-gray-400 mr-1" />
                                <span>{lead.source || "-"}</span>
                              </div>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex items-center space-x-2">
                                <button
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => handleDeleteLead(lead._id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredLeads.length)} of {filteredLeads.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-1 border rounded text-sm ${currentPage === pageNum ? 'bg-gray-200' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Leads</h2>
              <button
                onClick={closeImportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Upload an Excel or CSV file with lead data. The file should include columns for Name, Company, Email, and optionally Phone, Value, Tags, Assigned, Status, Source.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="w-full border rounded p-2"
              />
            </div>

            {importProgress && (
              <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded">
                <p>{importProgress.message}</p>
              </div>
            )}

            {importResult && (
              <div className={`mb-4 p-2 rounded ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {importResult.success ? (
                  <div>
                    <p>Import completed successfully!</p>
                    <p>{importResult.imported} leads imported.</p>
                    {importResult.errorCount > 0 && (
                      <p>{importResult.errorCount} rows had errors.</p>
                    )}
                    {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Error details:</p>
                        <ul className="text-xs">
                          {importResult.errorMessages.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Error: {importResult.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={importProgress || !importFile}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;