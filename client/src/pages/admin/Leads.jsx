import { useState, useEffect } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaUser, FaBuilding, FaEnvelope, FaPhone, FaDollarSign, FaTag, FaUserCheck
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
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
    customer: 0
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

  const statusOptions = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Customer"
  ];

  const sourceOptions = [
    "Website",
    "Referral",
    "Social Media",
    "Cold Call",
    "Event",
    "Other"
  ];

  // Dummy data for leads
  const dummyLeads = [
    {
      _id: "001",
      name: "Makibul Hossain Tamim",
      company: "Arbite Technology",
      email: "mhtamimm29@gmail.com",
      phone: "01777914331",
      value: 23269.00,
      tags: "adjust up frequency",
      assigned: "John Doe",
      status: "New",
      source: "Website",
      lastContact: "27-07-2025",
      created: "27-08-2025"
    },
    {
      _id: "002",
      name: "Sarah Johnson",
      company: "Tech Solutions Inc",
      email: "sarah@techsolutions.com",
      phone: "555-123-4567",
      value: 45000.00,
      tags: "enterprise, urgent",
      assigned: "Jane Smith",
      status: "Contacted",
      source: "Referral",
      lastContact: "15-08-2025",
      created: "10-08-2025"
    },
    {
      _id: "003",
      name: "Michael Chen",
      company: "Data Analytics Co",
      email: "michael@dataanalytics.com",
      phone: "555-987-6543",
      value: 18500.00,
      tags: "SMB, follow-up",
      assigned: "John Doe",
      status: "Qualified",
      source: "Social Media",
      lastContact: "20-08-2025",
      created: "05-08-2025"
    },
    {
      _id: "004",
      name: "Emily Williams",
      company: "Creative Designs LLC",
      email: "emily@creativedesigns.com",
      phone: "555-456-7890",
      value: 27500.00,
      tags: "design, premium",
      assigned: "Robert Brown",
      status: "Proposal",
      source: "Website",
      lastContact: "25-08-2025",
      created: "15-08-2025"
    },
    {
      _id: "005",
      name: "David Miller",
      company: "Global Enterprises",
      email: "david@globalent.com",
      phone: "555-789-0123",
      value: 65000.00,
      tags: "enterprise, priority",
      assigned: "Jane Smith",
      status: "Customer",
      source: "Event",
      lastContact: "28-08-2025",
      created: "01-08-2025"
    }
  ];

  // Initialize with dummy data
  useEffect(() => {
    setLeads(dummyLeads);
    calculateStats(dummyLeads);
  }, []);

  const calculateStats = (leadsData) => {
    const statsData = {
      totalLeads: leadsData.length,
      new: leadsData.filter(lead => lead.status === "New").length,
      contacted: leadsData.filter(lead => lead.status === "Contacted").length,
      qualified: leadsData.filter(lead => lead.status === "Qualified").length,
      proposal: leadsData.filter(lead => lead.status === "Proposal").length,
      customer: leadsData.filter(lead => lead.status === "Customer").length
    };
    setStats(statsData);
  };

  // Search filter
  const filteredLeads = leads.filter(lead =>
    lead._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.tags && lead.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lead.status.toLowerCase().includes(searchTerm.toLowerCase())
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
        const updatedLeads = leads.map(lead => 
          lead._id === editingLead._id ? { ...newLead, _id: editingLead._id } : lead
        );
        setLeads(updatedLeads);
        calculateStats(updatedLeads);
        setShowNewLeadForm(false);
        setEditingLead(null);
        alert("Lead updated successfully!");
      } else {
        // Create new lead
        const newId = String(leads.length + 1).padStart(3, '0');
        const newLeadWithId = { ...newLead, _id: newId };
        const updatedLeads = [...leads, newLeadWithId];
        setLeads(updatedLeads);
        calculateStats(updatedLeads);
        setShowNewLeadForm(false);
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
      alert(`Error saving lead: ${error.message}`);
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
      phone: lead.phone,
      value: lead.value,
      tags: lead.tags,
      assigned: lead.assigned,
      status: lead.status,
      source: lead.source,
      lastContact: lead.lastContact,
      created: lead.created
    });
    setShowNewLeadForm(true);
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        const updatedLeads = leads.filter(lead => lead._id !== id);
        setLeads(updatedLeads);
        calculateStats(updatedLeads);
        setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
        alert("Lead deleted successfully!");
      } catch (error) {
        console.error("Error deleting lead:", error);
        alert(`Error deleting lead: ${error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredLeads.map(lead => ({
      ID: lead._id,
      Name: lead.name,
      Company: lead.company,
      Email: lead.email,
      Phone: lead.phone,
      Value: lead.value,
      Tags: lead.tags,
      Assigned: lead.assigned,
      Status: lead.status,
      Source: lead.source,
      "Last Contact": lead.lastContact,
      Created: lead.created
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
      Phone: lead.phone,
      Value: lead.value,
      Tags: lead.tags,
      Assigned: lead.assigned,
      Status: lead.status,
      Source: lead.source,
      "Last Contact": lead.lastContact,
      Created: lead.created
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
      lead.phone,
      `$${lead.value.toLocaleString()}`,
      lead.tags,
      lead.assigned,
      lead.status,
      lead.source,
      lead.lastContact,
      lead.created
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
        lead.phone,
        `$${lead.value.toLocaleString()}`,
        lead.tags,
        lead.assigned,
        lead.status,
        lead.source,
        lead.lastContact,
        lead.created
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
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveLead}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newLead.name || !newLead.company || !newLead.email || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Leads */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUser className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* New */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">New</p>
                  <p className="text-2xl font-bold">{stats.new}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaClock className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Contacted */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Contacted</p>
                  <p className="text-2xl font-bold">{stats.contacted}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaPhone className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Qualified */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Qualified</p>
                  <p className="text-2xl font-bold">{stats.qualified}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaCheckCircle className="text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Proposal */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Proposal</p>
                  <p className="text-2xl font-bold">{stats.proposal}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaPauseCircle className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Customer</p>
                  <p className="text-2xl font-bold">{stats.customer}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUserCheck className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewLeadForm(true)}
              >
                <FaPlus /> New Lead
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
              {selectedLeads.length > 0 && (
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedLeads.length} selected leads?`)) {
                      const updatedLeads = leads.filter(lead => !selectedLeads.includes(lead._id));
                      setLeads(updatedLeads);
                      calculateStats(updatedLeads);
                      setSelectedLeads([]);
                      alert("Selected leads deleted!");
                    }
                  }}
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
                  onClick={() => {
                    setLeads(dummyLeads);
                    calculateStats(dummyLeads);
                  }}
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
                            setSelectedLeads(currentData.map((lead) => lead._id));
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
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Email</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Value</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Email</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Phone</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Value</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Assigned</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Source</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Last Contact</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((lead) => (
                      <tr
                        key={lead._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
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
                        <td className="p-3 border-0 font-medium">{lead.name}</td>
                        <td className="p-3 border-0">{lead.company}</td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">{lead.email}</td>
                            <td className="p-3 border-0">{formatCurrency(lead.value)}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditLead(lead)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLead(lead._id)}
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
                            <td className="p-3 border-0">{lead.email}</td>
                            <td className="p-3 border-0">{lead.phone}</td>
                            <td className="p-3 border-0">{formatCurrency(lead.value)}</td>
                            <td className="p-3 border-0">{lead.tags || "-"}</td>
                            <td className="p-3 border-0">{lead.assigned || "-"}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-3 border-0">{lead.source || "-"}</td>
                            <td className="p-3 border-0">{lead.lastContact || "-"}</td>
                            <td className="p-3 border-0">{lead.created || "-"}</td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditLead(lead)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLead(lead._id)}
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
                      <td colSpan={compactView ? 7 : 13} className="p-4 text-center text-gray-500">
                        {leads.length === 0 ? "No leads found. Create your first lead!" : "No leads match your search criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredLeads.length)} of {filteredLeads.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
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

export default LeadsPage;