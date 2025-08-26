import { useState, useEffect } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaExclamationTriangle, FaExclamationCircle
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
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
    contact: "",
    priority: "Medium"
  });
  const [editingTicket, setEditingTicket] = useState(null);

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];
  const statusOptions = ["Open", "Answered", "On Hold", "Closed", "In Progress"];
  const serviceOptions = ["FIELD", "STRATEGY", "TECHNICAL", "BILLING", "GENERAL"];
  const departmentOptions = ["Marketing", "Sales", "Support", "Development", "Operations"];

  // Dummy data for tickets
  const dummyTickets = [
    {
      _id: "#001",
      subject: "Website loading issues",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "UI,BUG,URGENT",
      service: "FIELD",
      department: "Marketing",
      contact: "John Doe - john@example.com",
      priority: "High",
      status: "Open",
      created: "21-08-2025",
      lastReply: "No Reply Yet"
    },
    {
      _id: "#002",
      subject: "Payment processing error",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "BILLING,ISSUE",
      service: "STRATEGY",
      department: "Sales",
      contact: "Jane Smith - jane@example.com",
      priority: "Urgent",
      status: "Answered",
      created: "20-08-2025",
      lastReply: "22-08-2025"
    },
    {
      _id: "#003",
      subject: "Feature request - Dark mode",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "ENHANCEMENT,UI",
      service: "TECHNICAL",
      department: "Development",
      contact: "Mike Johnson - mike@example.com",
      priority: "Medium",
      status: "On Hold",
      created: "19-08-2025",
      lastReply: "20-08-2025"
    },
    {
      _id: "#004",
      subject: "Password reset not working",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "SECURITY,BUG",
      service: "TECHNICAL",
      department: "Support",
      contact: "Sarah Wilson - sarah@example.com",
      priority: "High",
      status: "In Progress",
      created: "18-08-2025",
      lastReply: "19-08-2025"
    },
    {
      _id: "#005",
      subject: "Invoice discrepancy",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "BILLING",
      service: "BILLING",
      department: "Operations",
      contact: "Robert Brown - robert@example.com",
      priority: "Low",
      status: "Closed",
      created: "17-08-2025",
      lastReply: "18-08-2025"
    },
    {
      _id: "#006",
      subject: "Mobile app crash on iOS",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "BUG,MOBILE,URGENT",
      service: "TECHNICAL",
      department: "Development",
      contact: "Lisa Davis - lisa@example.com",
      priority: "Urgent",
      status: "Open",
      created: "16-08-2025",
      lastReply: "No Reply Yet"
    },
    {
      _id: "#007",
      subject: "API integration documentation",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "DOCUMENTATION,API",
      service: "TECHNICAL",
      department: "Development",
      contact: "David Miller - david@example.com",
      priority: "Medium",
      status: "Answered",
      created: "15-08-2025",
      lastReply: "16-08-2025"
    },
    {
      _id: "#008",
      subject: "Subscription upgrade issue",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "BILLING,UPGRADE",
      service: "BILLING",
      department: "Sales",
      contact: "Amy Wilson - amy@example.com",
      priority: "High",
      status: "On Hold",
      created: "14-08-2025",
      lastReply: "15-08-2025"
    },
    {
      _id: "#009",
      subject: "Performance optimization",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "PERFORMANCE",
      service: "TECHNICAL",
      department: "Development",
      contact: "Chris Taylor - chris@example.com",
      priority: "Medium",
      status: "In Progress",
      created: "13-08-2025",
      lastReply: "14-08-2025"
    },
    {
      _id: "#010",
      subject: "Training materials request",
      description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
      tags: "DOCUMENTATION,TRAINING",
      service: "GENERAL",
      department: "Support",
      contact: "Emily Clark - emily@example.com",
      priority: "Low",
      status: "Closed",
      created: "12-08-2025",
      lastReply: "13-08-2025"
    }
  ];

  // Initialize with dummy data
  useEffect(() => {
    setTickets(dummyTickets);
    calculateStats(dummyTickets);
  }, []);

  // Calculate statistics
  const calculateStats = (ticketsData) => {
    const stats = {
      totalTickets: ticketsData.length,
      open: ticketsData.filter(t => t.status === "Open").length,
      answered: ticketsData.filter(t => t.status === "Answered").length,
      onHold: ticketsData.filter(t => t.status === "On Hold").length,
      closed: ticketsData.filter(t => t.status === "Closed").length,
      inProgress: ticketsData.filter(t => t.status === "In Progress").length
    };
    setStats(stats);
  };

  // Search filter
  const filteredTickets = tickets.filter(ticket =>
    ticket._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.tags && ticket.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ticket.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  };

  const handleSaveTicket = async () => {
    if (isSaving) return;
    
    if (!newTicket.subject || !newTicket.description) {
      alert("Please fill in all required fields (Subject, Description)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingTicket) {
        // Update existing ticket
        const updatedTickets = tickets.map(ticket =>
          ticket._id === editingTicket._id
            ? { ...editingTicket, ...newTicket }
            : ticket
        );
        setTickets(updatedTickets);
        calculateStats(updatedTickets);
        setShowNewTicketForm(false);
        setEditingTicket(null);
        alert("Ticket updated successfully!");
      } else {
        // Create new ticket
        const newId = `#${String(tickets.length + 1).padStart(3, '0')}`;
        const newTicketData = {
          _id: newId,
          ...newTicket,
          created: new Date().toLocaleDateString('en-GB'),
          lastReply: "No Reply Yet"
        };
        const updatedTickets = [...tickets, newTicketData];
        setTickets(updatedTickets);
        calculateStats(updatedTickets);
        setShowNewTicketForm(false);
        alert("Ticket created successfully!");
      }
      
      // Reset form
      setNewTicket({
        subject: "",
        description: "",
        tags: "",
        service: "",
        department: "",
        contact: "",
        priority: "Medium"
      });
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert(`Error saving ticket: ${error.message}`);
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
      contact: ticket.contact,
      priority: ticket.priority
    });
    setShowNewTicketForm(true);
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        const updatedTickets = tickets.filter(ticket => ticket._id !== id);
        setTickets(updatedTickets);
        calculateStats(updatedTickets);
        alert("Ticket deleted successfully!");
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert(`Error deleting ticket: ${error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredTickets.map(ticket => ({
      ID: ticket._id,
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Contact: ticket.contact,
      Priority: ticket.priority,
      Status: ticket.status,
      Created: ticket.created,
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
      ID: ticket._id,
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Contact: ticket.contact,
      Priority: ticket.priority,
      Status: ticket.status,
      Created: ticket.created,
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
      "ID",
      "Subject",
      "Tags",
      "Service",
      "Department",
      "Contact",
      "Priority",
      "Status",
      "Created",
      "Last Reply"
    ];
    
    const tableRows = filteredTickets.map(ticket => [
      ticket._id,
      ticket.subject.length > 20 ? ticket.subject.substring(0, 20) + '...' : ticket.subject,
      ticket.tags,
      ticket.service,
      ticket.department,
      ticket.contact.length > 20 ? ticket.contact.substring(0, 20) + '...' : ticket.contact,
      ticket.priority,
      ticket.status,
      ticket.created,
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
    ['ID', 'Subject', 'Tags', 'Service', 'Department', 'Contact', 'Priority', 'Status', 'Created', 'Last Reply'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredTickets.forEach(ticket => {
      printWindow.document.write('<tr>');
      [
        ticket._id,
        ticket.subject,
        ticket.tags,
        ticket.service,
        ticket.department,
        ticket.contact,
        ticket.priority,
        ticket.status,
        ticket.created,
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={newTicket.contact}
                  onChange={handleNewTicketChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Name - email@example.com"
                />
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
              disabled={!newTicket.subject || !newTicket.description || isSaving}
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
                        const updatedTickets = tickets.filter(ticket => !selectedTickets.includes(ticket._id));
                        setTickets(updatedTickets);
                        calculateStats(updatedTickets);
                        setSelectedTickets([]);
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
                    setTickets(dummyTickets);
                    calculateStats(dummyTickets);
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
                        checked={selectedTickets.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets(currentData.map((ticket) => ticket._id));
                          } else {
                            setSelectedTickets([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>ID</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subject</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Priority</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Service</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Department</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contact</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Priority</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Last Reply</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((ticket) => (
                      <tr
                        key={ticket._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                        style={{ color: 'black' }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket._id)}
                              onChange={() => toggleTicketSelection(ticket._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0 font-medium">{ticket._id}</td>
                        <td className="p-3 border-0">
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {ticket.description}
                          </div>
                        </td>
                        {compactView ? (
                          <>
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
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
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
                          </>
                        ) : (
                          <>
                            <td className="p-3 border-0">{ticket.tags || "-"}</td>
                            <td className="p-3 border-0">{ticket.service}</td>
                            <td className="p-3 border-0">{ticket.department}</td>
                            <td className="p-3 border-0">{ticket.contact}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="p-3 border-0">{ticket.created}</td>
                            <td className="p-3 border-0">{ticket.lastReply}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
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
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={compactView ? 6 : 13} className="p-4 text-center">
                        No tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredTickets.length)} of {filteredTickets.length} entries
              </div>
              <div className="flex gap-1">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
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
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === pageNum ? "bg-black text-white" : ""
                      }`}
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
                <button
                  className="px-3 py-1 border rounded text-sm"
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
    </div>
  );
};

export default SupportPage;