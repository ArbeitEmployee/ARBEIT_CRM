import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaEye, // Added FaEye
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaExclamationTriangle, FaExclamationCircle
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SupportPage = () => {
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    open: 0,
    answered: 0,
    onHold: 0,
    closed: 0,
    inProgress: 0
  });
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    tags: "",
    service: "",
    department: "",
    customerId: "",
    customerName: "",
    priority: "Medium",
    status: "Open"
  });
  const [editingTicket, setEditingTicket] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false); // New state for description modal
  const [currentDescription, setCurrentDescription] = useState(""); // New state for current description

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];
  const statusOptions = ["Open", "Answered", "On Hold", "Closed", "In Progress"];
  const serviceOptions = ["FIELD", "STRATEGY", "TECHNICAL", "BILLING", "GENERAL"];
  const departmentOptions = ["Marketing", "Sales", "Support", "Development", "Operations"];

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

  const [loading, setLoading] = useState(true);

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/support");
      setTickets(data.tickets || []);
      setStats(data.stats || {
        totalTickets: 0,
        open: 0,
        answered: 0,
        onHold: 0,
        closed: 0,
        inProgress: 0
      });
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      setTickets([]);
      setStats({
        totalTickets: 0,
        open: 0,
        answered: 0,
        onHold: 0,
        closed: 0,
        inProgress: 0
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCustomerSearchResults([]);
      return;
    }
    
    try {
      const { data } = await axios.get(`http://localhost:5000/api/support/customers/search?q=${searchTerm}`);
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
  const filteredTickets = tickets.filter(ticket =>
    // ticket._id.toLowerCase().includes(searchTerm.toLowerCase()) || // Removed ID from search
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.tags && ticket.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ticket.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.customer && ticket.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ticket.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredTickets.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleTicketSelection = (id) => {
    setSelectedTickets(prev =>
      prev.includes(id)
        ? prev.filter(ticketId => ticketId !== id)
        : [...prev, id]
    );
  };

  const handleNewTicketChange = (e) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
    
    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewTicket(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveTicket = async () => {
    if (isSaving) return;
    
    if (!newTicket.subject || !newTicket.description || !newTicket.customerId) {
      alert("Please fill in all required fields (Subject, Description, Customer)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingTicket) {
        // Update existing ticket
        await axios.put(`http://localhost:5000/api/support/${editingTicket._id}`, newTicket);
        setShowNewTicketForm(false);
        setEditingTicket(null);
        fetchTickets();
        alert("Ticket updated successfully!");
      } else {
        // Create new ticket
        await axios.post("http://localhost:5000/api/support", newTicket);
        setShowNewTicketForm(false);
        fetchTickets();
        alert("Ticket created successfully!");
      }
      
      // Reset form
      setNewTicket({
        subject: "",
        description: "",
        tags: "",
        service: "",
        department: "",
        customerId: "",
        customerName: "",
        priority: "Medium",
        status: "Open"
      });
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert(`Error saving ticket: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setNewTicket({
      subject: ticket.subject,
      description: ticket.description,
      tags: ticket.tags || "",
      service: ticket.service,
      department: ticket.department,
      customerId: ticket.customerId,
      customerName: ticket.customer ? ticket.customer.company : "",
      priority: ticket.priority,
      status: ticket.status
    });
    setShowNewTicketForm(true);
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await axios.delete(`http://localhost:5000/api/support/${id}`);
        fetchTickets();
        alert("Ticket deleted successfully!");
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert(`Error deleting ticket: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleViewDescription = (description) => {
    setCurrentDescription(description);
    setShowDescriptionModal(true);
  };

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredTickets.map(ticket => ({
      // ID: ticket._id, // Removed ID from export
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Customer: ticket.customer ? ticket.customer.company : "N/A",
      Priority: ticket.priority,
      Status: ticket.status,
      Created: formatDateTime(ticket.created), // Formatted date
      "Last Reply": ticket.lastReply
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Support Tickets");
    XLSX.writeFile(workbook, "Support_Tickets.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredTickets.map(ticket => ({
      // ID: ticket._id, // Removed ID from export
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Customer: ticket.customer ? ticket.customer.company : "N/A",
      Priority: ticket.priority,
      Status: ticket.status,
      Created: formatDateTime(ticket.created), // Formatted date
      "Last Reply": ticket.lastReply
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Support_Tickets.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      // "ID", // Removed ID from PDF export
      "Subject",
      "Tags",
      "Service",
      "Department",
      "Customer",
      "Priority",
      "Status",
      "Created",
      "Last Reply"
    ];
    
    const tableRows = filteredTickets.map(ticket => [
      // ticket._id, // Removed ID from PDF export
      ticket.subject.length > 20 ? ticket.subject.substring(0, 20) + '...' : ticket.subject,
      ticket.tags,
      ticket.service,
      ticket.department,
      ticket.customer ? ticket.customer.company : "N/A",
      ticket.priority,
      ticket.status,
      formatDateTime(ticket.created), // Formatted date
      ticket.lastReply
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Support_Tickets.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Support Tickets</title>');
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
    printWindow.document.write('<h1>Support Tickets</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    // ['ID', 'Subject', 'Tags', 'Service', 'Department', 'Customer', 'Priority', 'Status', 'Created', 'Last Reply'].forEach(header => { // Removed ID from print
    ['Subject', 'Tags', 'Service', 'Department', 'Customer', 'Priority', 'Status', 'Created', 'Last Reply'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredTickets.forEach(ticket => {
      printWindow.document.write('<tr>');
      [
        // ticket._id, // Removed ID from print
        ticket.subject,
        ticket.tags,
        ticket.service,
        ticket.department,
        ticket.customer ? ticket.customer.company : "N/A",
        ticket.priority,
        ticket.status,
        formatDateTime(ticket.created), // Formatted date
        ticket.lastReply
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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "Low": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Open": return "bg-gray-100 text-gray-800";
      case "Answered": return "bg-blue-100 text-blue-800";
      case "On Hold": return "bg-yellow-100 text-yellow-800";
      case "Closed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading supports...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewTicketForm ? (editingTicket ? "Edit Ticket" : "Add New Ticket") : "Support Tickets"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Support</span>
        </div>
      </div>

      {showNewTicketForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Ticket Details</h2>
            <button 
              onClick={() => {
                setShowNewTicketForm(false);
                setEditingTicket(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={newTicket.subject}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={newTicket.description}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2 h-32"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={newTicket.customerName}
                    onChange={handleNewTicketChange}
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
                  value={newTicket.tags}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., UI, BUG, URGENT"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  name="service"
                  value={newTicket.service}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Service</option>
                  {serviceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={newTicket.department}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={newTicket.priority}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {priorityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newTicket.status}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewTicketForm(false);
                setEditingTicket(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTicket}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newTicket.subject || !newTicket.description || !newTicket.customerId || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Tickets */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.totalTickets}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaCheckSquare className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Open */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Open</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaClock className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Answered */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Answered</p>
                  <p className="text-2xl font-bold">{stats.answered}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaCheckCircle className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* On Hold */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">On Hold</p>
                  <p className="text-2xl font-bold">{stats.onHold}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaPauseCircle className="text-yellow-600" />
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
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaSyncAlt className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Closed */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Closed</p>
                  <p className="text-2xl font-bold">{stats.closed}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaBan className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewTicketForm(true)}
              >
                <FaPlus /> New Ticket
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
              {selectedTickets.length > 0 && (
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={async () => {
                    if (window.confirm(`Delete ${selectedTickets.length} selected tickets?`)) {
                      try {
                        await axios.post("http://localhost:5000/api/support/bulk-delete", {
                          ticketIds: selectedTickets
                        });
                        setSelectedTickets([]);
                        fetchTickets();
                        alert("Selected tickets deleted!");
                      } catch {
                        alert("Error deleting selected tickets.");
                      }
                    }
                  }}
                >
                  Delete Selected ({selectedTickets.length})
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
                  {showExportMenu && (
                    <div ref={exportMenuRef} className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-md z-10">
                      <button
                        onClick={exportToExcel}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        Excel
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        CSV
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        PDF
                      </button>
                      <button
                        onClick={printTable}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        Print
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="border rounded pl-8 pr-3 py-1 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-2 top-2.5 transform text-gray-400 text-sm" />
                </div>
                
                {/* Refresh button */}
                <button
                  onClick={fetchTickets}
                  className="border px-2 py-1 rounded text-sm flex items-center"
                >
                  <FaSyncAlt />
                </button>
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
                        checked={selectedTickets.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets(currentData.map(ticket => ticket._id));
                          } else {
                            setSelectedTickets([]);
                          }
                        }}
                      />
                    </th>
                    {/* <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>ID</th> */} {/* Removed ID column */}
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subject</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Service</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Department</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Priority</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Last Reply</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((ticket) => (
                      <tr key={ticket._id} className="bg-white shadow rounded-lg hover:bg-gray-50 relative" style={{ color: 'black' }}>
                        <td className="p-3 rounded-l-lg border-0">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket._id)}
                            onChange={() => toggleTicketSelection(ticket._id)}
                            className="h-4 w-4"
                          />
                        </td>
                        {/* <td className="p-3 border-0 text-sm">{ticket._id}</td> */} {/* Removed ID cell */}
                        <td className="p-3 border-0 text-sm">{ticket.subject}</td>
                        <td className="p-3 border-0 text-sm">{ticket.tags}</td>
                        <td className="p-3 border-0 text-sm">{ticket.service}</td>
                        <td className="p-3 border-0 text-sm">{ticket.department}</td>
                        <td className="p-3 border-0 text-sm">
                          {ticket.customer ? (
                            <div>
                              <div className="font-medium">{ticket.customer.company}</div>
                              <div className="text-xs text-gray-500">{ticket.customer.contact}</div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 text-sm">{formatDateTime(ticket.created)}</td> {/* Formatted date */}
                        <td className="p-3 border-0 text-sm">{ticket.lastReply}</td>
                        <td className="p-3 rounded-r-lg border-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDescription(ticket.description)}
                              className="text-gray-500 hover:text-gray-700"
                              title="View Description"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket._id)}
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
                      <td colSpan="11" className="p-4 text-center text-gray-500"> {/* Adjusted colspan */}
                        {searchTerm ? "No matching tickets found" : "No support tickets available"}
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
                {Math.min(startIndex + entriesPerPage, filteredTickets.length)} of{" "}
                {filteredTickets.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => {
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
                      className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-gray-200" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ticket Description</h2>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{currentDescription}</p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="px-4 py-2 bg-black text-white rounded text-sm"
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

export default SupportPage;
