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
  FaExclamationTriangle,
  FaExclamationCircle,
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

const SupportPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    inProgress: 0,
  });
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    tags: "",
    service: "",
    department: "",
    customerId: "",
    customerName: "",
    customerCode: "",
    priority: "Medium",
    status: "Open",
  });
  const [editingTicket, setEditingTicket] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];
  const statusOptions = [
    "Open",
    "Answered",
    "On Hold",
    "Closed",
    "In Progress",
  ];
  const serviceOptions = [
    "FIELD",
    "STRATEGY",
    "TECHNICAL",
    "BILLING",
    "GENERAL",
  ];
  const departmentOptions = [
    "Marketing",
    "Sales",
    "Support",
    "Development",
    "Operations",
  ];

  // Use the custom hook for detecting outside clicks
  const exportRef = useOutsideClick(() => {
    setShowExportMenu(false);
  });

  const customerRef = useOutsideClick(() => {
    setShowCustomerDropdown(false);
  });

  const [loading, setLoading] = useState(true);

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

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/support`, config);
      setTickets(data.tickets || []);
      setStats(
        data.stats || {
          totalTickets: 0,
          open: 0,
          answered: 0,
          onHold: 0,
          closed: 0,
          inProgress: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      setTickets([]);
      setStats({
        totalTickets: 0,
        open: 0,
        answered: 0,
        onHold: 0,
        closed: 0,
        inProgress: 0,
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
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/support/customers/search?q=${searchTerm}`,
        config
      );
      setCustomerSearchResults(data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
    }
  };

  // Search customer by code
  const searchCustomerByCode = async (customerCode) => {
    if (!customerCode || customerCode.length < 4) {
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/support/customers/by-code/${customerCode}`,
        config
      );
      if (data.customer) {
        setNewTicket((prev) => ({
          ...prev,
          customerId: data.customer._id,
          customerName: data.customer.company,
          customerCode: data.customer.customerCode,
        }));
      }
    } catch (error) {
      console.error("Error searching customer by code:", error);
      // Clear customer info if code is not found
      setNewTicket((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
      }));
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

  // Debounce customer code search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (newTicket.customerCode && newTicket.customerCode.length >= 4) {
        searchCustomerByCode(newTicket.customerCode);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newTicket.customerCode]);

  // Search filter
  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.description &&
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.tags &&
        ticket.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.customer &&
        ticket.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
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
    setSelectedTickets((prev) =>
      prev.includes(id)
        ? prev.filter((ticketId) => ticketId !== id)
        : [...prev, id]
    );
  };

  const handleNewTicketChange = (e) => {
    const { name, value } = e.target;
    setNewTicket((prev) => ({ ...prev, [name]: value }));

    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewTicket((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company,
      customerCode: customer.customerCode,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveTicket = async () => {
    if (isSaving) return;

    if (!newTicket.subject || !newTicket.description || !newTicket.customerId) {
      alert(
        "Please fill in all required fields (Subject, Description, Customer)"
      );
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();

      if (editingTicket) {
        // Update existing ticket
        await axios.put(
          `${API_BASE_URL}/support/${editingTicket._id}`,
          newTicket,
          config
        );
        setShowNewTicketForm(false);
        setEditingTicket(null);
        fetchTickets();
        alert("Ticket updated successfully!");
      } else {
        // Create new ticket
        await axios.post(`${API_BASE_URL}/support`, newTicket, config);
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
        customerCode: "",
        priority: "Medium",
        status: "Open",
      });
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert(
        `Error saving ticket: ${error.response?.data?.message || error.message}`
      );
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
      customerCode: ticket.customer ? ticket.customer.customerCode : "",
      priority: ticket.priority,
      status: ticket.status,
    });
    setShowNewTicketForm(true);
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/support/${id}`, config);
        fetchTickets();
        alert("Ticket deleted successfully!");
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert(
          `Error deleting ticket: ${
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

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredTickets.map((ticket) => ({
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Customer: ticket.customer ? ticket.customer.company : "N/A",
      Priority: ticket.priority,
      Status: ticket.status,
      Created: formatDateTime(ticket.created),
      "Last Reply": ticket.lastReply,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Support Tickets");
    XLSX.writeFile(workbook, "Support_Tickets.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredTickets.map((ticket) => ({
      Subject: ticket.subject,
      Description: ticket.description,
      Tags: ticket.tags,
      Service: ticket.service,
      Department: ticket.department,
      Customer: ticket.customer ? ticket.customer.company : "N/A",
      Priority: ticket.priority,
      Status: ticket.status,
      Created: formatDateTime(ticket.created),
      "Last Reply": ticket.lastReply,
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Support_Tickets.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Subject",
      "Tags",
      "Service",
      "Department",
      "Customer",
      "Priority",
      "Status",
      "Created",
      "Last Reply",
    ];

    const tableRows = filteredTickets.map((ticket) => [
      ticket.subject.length > 20
        ? ticket.subject.substring(0, 20) + "..."
        : ticket.subject,
      ticket.tags,
      ticket.service,
      ticket.department,
      ticket.customer ? ticket.customer.company : "N/A",
      ticket.priority,
      ticket.status,
      formatDateTime(ticket.created),
      ticket.lastReply,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Support_Tickets.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Support Tickets</title>");
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
    printWindow.document.write("<h1>Support Tickets</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    [
      "Subject",
      "Tags",
      "Service",
      "Department",
      "Customer",
      "Priority",
      "Status",
      "Created",
      "Last Reply",
    ].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredTickets.forEach((ticket) => {
      printWindow.document.write("<tr>");
      [
        ticket.subject,
        ticket.tags,
        ticket.service,
        ticket.department,
        ticket.customer ? ticket.customer.company : "N/A",
        ticket.priority,
        ticket.status,
        formatDateTime(ticket.created),
        ticket.lastReply,
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-gray-100 text-gray-800";
      case "Answered":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        Loading supports...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {showNewTicketForm
            ? editingTicket
              ? "Edit Ticket"
              : "Add New Ticket"
            : "Support Tickets"}
        </h1>
        <div className="flex items-center text-slate-500">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Support</span>
        </div>
      </div>

      {showNewTicketForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Ticket Details</h2>
            <button
              onClick={() => {
                setShowNewTicketForm(false);
                setEditingTicket(null);
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
                  name="subject"
                  value={newTicket.subject}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={newTicket.description}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Code
                </label>
                <input
                  type="text"
                  name="customerCode"
                  value={newTicket.customerCode}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Enter customer code (e.g., CUST-ABC123)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter customer code to auto-populate customer information
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer *
                </label>
                <div className="relative" ref={customerRef}>
                  <input
                    type="text"
                    name="customerName"
                    value={newTicket.customerName}
                    onChange={handleNewTicketChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    required
                    placeholder="Search customer by company name..."
                  />
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {customerSearchResults.map((customer, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.company}</div>
                          <div className="text-sm text-slate-600">
                            {customer.contact} - {customer.email}
                          </div>
                          <div className="text-xs text-blue-600">
                            {customer.customerCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown &&
                    customerSearchResults.length === 0 &&
                    customerSearchTerm.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg">
                        <div className="px-3 py-2 text-slate-500">
                          No customers found
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={newTicket.tags}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="e.g., UI, BUG, URGENT"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service
                </label>
                <select
                  name="service"
                  value={newTicket.service}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select Service</option>
                  {serviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={newTicket.department}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={newTicket.priority}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={newTicket.status}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
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
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTicket}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
              disabled={
                !newTicket.subject ||
                !newTicket.description ||
                !newTicket.customerId ||
                isSaving
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Total Tickets</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.totalTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-sky-500">
                  <FaCheckSquare className="text-white" />
                </div>
              </div>
            </div>

            {/* Open */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Open</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.open}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-500">
                  <FaClock className="text-white" />
                </div>
              </div>
            </div>

            {/* Answered */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Answered</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.answered}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-blue-500">
                  <FaCheckCircle className="text-white" />
                </div>
              </div>
            </div>

            {/* On Hold */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">On Hold</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.onHold}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-amber-500">
                  <FaPauseCircle className="text-white" />
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">In Progress</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.inProgress}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-violet-500">
                  <FaSyncAlt className="text-white" />
                </div>
              </div>
            </div>

            {/* Closed */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Closed</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.closed}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-green-500">
                  <FaBan className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-2"
                onClick={() => setShowNewTicketForm(true)}
              >
                <FaPlus /> New Ticket
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
                {selectedTickets.length > 0 && (
                  <button
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Delete ${selectedTickets.length} selected tickets?`
                        )
                      ) {
                        try {
                          const config = createAxiosConfig();
                          await axios.post(
                            `${API_BASE_URL}/support/bulk-delete`,
                            {
                              ticketIds: selectedTickets,
                            },
                            config
                          );
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
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div className="absolute mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-md z-10">
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
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
                  onClick={fetchTickets}
                >
                  <FaSyncAlt />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-2 top-3.5 transform text-slate-400 text-sm" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                    <th className="px-4 sm:px-6 py-3 text-left rounded-l-lg">
                      <input
                        type="checkbox"
                        checked={
                          selectedTickets.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets(
                              currentData.map((ticket) => ticket._id)
                            );
                          } else {
                            setSelectedTickets([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left">Subject</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Tags</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Service</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Department</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Customer</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Priority</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Created</th>
                    <th className="px-4 sm:px-6 py-3 text-left">Last Reply</th>
                    <th className="px-4 sm:px-6 py-3 text-left rounded-r-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((ticket) => (
                      <tr
                        key={ticket._id}
                        className="bg-white/70 hover:bg-white shadow rounded-lg relative"
                        style={{ color: "black" }}
                      >
                        <td className="px-4 sm:px-6 py-3 rounded-l-lg border-0">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket._id)}
                            onChange={() => toggleTicketSelection(ticket._id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          {ticket.subject}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">{ticket.tags}</td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          {ticket.service}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          {ticket.department}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          {ticket.customer ? (
                            <div>
                              <div className="font-medium">
                                {ticket.customer.company}
                              </div>
                              <div className="text-xs text-slate-500">
                                {ticket.customer.contact}
                              </div>
                              {ticket.customer.customerCode && (
                                <div className="text-xs text-blue-600">
                                  {ticket.customer.customerCode}
                                </div>
                              )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm tabular-nums">
                          {formatDateTime(ticket.created)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 border-0 text-sm">
                          {ticket.lastReply}
                        </td>
                        <td className="px-4 sm:px-6 py-3 rounded-r-lg border-0">
                          <div className="flex items-center space-x-2">
                            <button
                              className="rounded-lg p-2 bg-slate-100 text-slate-700 hover:brightness-95"
                              onClick={() =>
                                handleViewDescription(ticket.description)
                              }
                              title="View Description"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="rounded-lg p-2 bg-blue-100 text-blue-700 hover:brightness-95"
                              onClick={() => handleEditTicket(ticket)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="rounded-lg p-2 bg-red-100 text-red-700 hover:brightness-95"
                              onClick={() => handleDeleteTicket(ticket._id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="11"
                        className="p-4 text-center text-slate-500"
                      >
                        No tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="text-sm text-slate-600 tabular-nums">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredTickets.length)}{" "}
                of {filteredTickets.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums ${
                        currentPage === page
                          ? "border-transparent bg-gradient-to-r from-slate-900 to-slate-800 text-white"
                          : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
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
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl p-6 w-11/12 md:w-3/4 lg:w-1/2 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Ticket Description</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/80 whitespace-pre-wrap">
              {currentDescription || "No description available"}
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
    </div>
  );
};

export default SupportPage;
