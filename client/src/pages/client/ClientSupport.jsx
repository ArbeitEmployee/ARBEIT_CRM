/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaEye,
  FaPlus,
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaPauseCircle,
  FaBan,
  FaExclamationCircle,
} from "react-icons/fa";
import axios from "axios";

const ClientSupportPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    answeredTickets: 0,
    onHoldTickets: 0,
    closedTickets: 0,
    inProgressTickets: 0,
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    tags: "",
    service: "",
    department: "",
    priority: "Medium",
    status: "Open",
  });

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];
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

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem("crm_client_token");
  };

  // Create axios instance with client auth headers
  const createAxiosConfig = () => {
    const token = getClientToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch client support tickets from API
  const fetchClientTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const config = createAxiosConfig();
      const params = {};

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== "All") {
        params.status = statusFilter;
      }

      const { data } = await axios.get(`${API_BASE_URL}/client/support`, {
        ...config,
        params: params,
      });

      setTickets(data.tickets || []);
      setStats(
        data.stats || {
          totalTickets: 0,
          openTickets: 0,
          answeredTickets: 0,
          onHoldTickets: 0,
          closedTickets: 0,
          inProgressTickets: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client support tickets:", error);
      setError(error.response?.data?.message || error.message);

      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        window.location.href = "/client/login";
      }

      setTickets([]);
      setStats({
        totalTickets: 0,
        openTickets: 0,
        answeredTickets: 0,
        onHoldTickets: 0,
        closedTickets: 0,
        inProgressTickets: 0,
      });
      setClientInfo({});
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if token exists
    const token = getClientToken();
    if (!token) {
      alert("Please login to access support tickets.");
      window.location.href = "/client/login";
      return;
    }

    fetchClientTickets();
  }, [statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchClientTickets();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // When client info is loaded, pre-fill the customer info in the new ticket form
  useEffect(() => {
    if (clientInfo._id) {
      setNewTicket((prev) => ({
        ...prev,
        customerId: clientInfo._id,
        customerName: clientInfo.company,
        customerCode: clientInfo.customerCode,
      }));
    }
  }, [clientInfo]);

  // Handle new ticket form changes
  const handleNewTicketChange = (e) => {
    const { name, value } = e.target;
    setNewTicket((prev) => ({ ...prev, [name]: value }));
  };

  // Save new ticket
  const handleSaveTicket = async () => {
    if (isSaving) return;

    if (!newTicket.subject || !newTicket.description) {
      alert("Please fill in all required fields (Subject, Description)");
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();

      // Create new ticket with client info automatically included
      const ticketData = {
        ...newTicket,
        customerId: clientInfo._id,
        customerName: clientInfo.company,
        customerCode: clientInfo.customerCode,
      };

      await axios.post(`${API_BASE_URL}/client/support`, ticketData, config);
      setShowNewTicketForm(false);
      fetchClientTickets();
      alert("Ticket created successfully!");

      // Reset form
      setNewTicket({
        subject: "",
        description: "",
        tags: "",
        service: "",
        department: "",
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

  // Filter tickets (client-side filtering as backup)
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.description &&
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.tags &&
        ticket.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredTickets.slice(
    startIndex,
    startIndex + entriesPerPage
  );

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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  };

  const handleViewDescription = (description) => {
    alert(
      `Ticket Description:\n\n${description || "No description available"}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex items-center justify-center">
        <div className="text-center text-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p>Loading support tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-20 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-4">
              Error Loading Support Tickets
            </h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchClientTickets}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Client Portal
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {showNewTicketForm ? "Create New Ticket" : "My Support Tickets"}
        </h1>
        <div className="flex items-center text-slate-500">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Support</span>
        </div>

        {/* Client Info */}
        {clientInfo.company && (
          <div className="mt-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="text-lg font-semibold mb-2 text-slate-900">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Company:{" "}
                  <span className="font-medium">{clientInfo.company}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Contact:{" "}
                  <span className="font-medium">{clientInfo.contact}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-medium">{clientInfo.email}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Phone:{" "}
                  <span className="font-medium">
                    {clientInfo.phone || "N/A"}
                  </span>
                </p>
                {clientInfo.customerCode && (
                  <p className="text-sm text-blue-600">
                    Customer Code:{" "}
                    <span className="font-medium">
                      {clientInfo.customerCode}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewTicketForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Ticket Details</h2>
            <button
              onClick={() => {
                setShowNewTicketForm(false);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={newTicket.description}
                  onChange={handleNewTicketChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 h-32"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Customer Code
                </label>
                <input
                  type="text"
                  name="customerCode"
                  value={clientInfo.customerCode || ""}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2.5 text-sm text-slate-500 focus:outline-none"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your customer code (automatically filled)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={clientInfo.company || ""}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2.5 text-sm text-slate-500 focus:outline-none"
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  value="Open"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2.5 text-sm text-slate-500 focus:outline-none"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  New tickets are automatically set to "Open" status
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewTicketForm(false);
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
                !newTicket.subject || !newTicket.description || isSaving
              }
            >
              {isSaving ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.totalTickets}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaExclamationCircle className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Open Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Open</p>
                  <p className="text-2xl font-bold">{stats.openTickets}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaClock className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Answered Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Answered</p>
                  <p className="text-2xl font-bold">{stats.answeredTickets}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaCheckCircle className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* On Hold Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">On Hold</p>
                  <p className="text-2xl font-bold">{stats.onHoldTickets}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaPauseCircle className="text-yellow-600" />
                </div>
              </div>
            </div>

            {/* In Progress Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">
                    {stats.inProgressTickets}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaExclamationCircle className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Closed Tickets */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Closed</p>
                  <p className="text-2xl font-bold">{stats.closedTickets}</p>
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
                {compactView ? "Full View" : "Compact View"}
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div
            className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 ${
              compactView ? "w-full" : "w-full"
            }`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Answered">Answered</option>
                  <option value="On Hold">On Hold</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>

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

                {/* Refresh button */}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
                  onClick={fetchClientTickets}
                  disabled={loading}
                >
                  <FaSyncAlt className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search tickets..."
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    <th
                      className="p-3 rounded-l-lg"
                    >
                      Subject
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                        >

                          Tags
                        </th>
                        <th
                          className="p-3"
                        >

                          Service
                        </th>
                        <th
                          className="p-3"
                        >

                          Priority
                        </th>
                        <th
                          className="p-3"
                        >

                          Status
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                        >

                          Created
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="p-3"
                        >

                          Tags
                        </th>
                        <th
                          className="p-3"
                        >

                          Service
                        </th>
                        <th
                          className="p-3"
                        >

                          Department
                        </th>
                        <th
                          className="p-3"
                        >

                          Priority
                        </th>
                        <th
                          className="p-3"
                        >

                          Status
                        </th>
                        <th
                          className="p-3"
                        >

                          Created
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                        >

                          Last Reply
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((ticket) => (
                      <tr
                        key={ticket._id}
                        className="border-b border-slate-200/70 hover:bg-white/70 transition-colors text-slate-700"
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="font-medium text-slate-900">{ticket.subject}</div>
                        </td>
                        <td className="p-3 border-0">{ticket.tags || "N/A"}</td>
                        <td className="p-3 border-0">{ticket.service}</td>

                        {!compactView && (
                          <td className="p-3 border-0">{ticket.department}</td>
                        )}

                        <td className="p-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-3 border-0">
                          {formatDateTime(ticket.created)}
                        </td>

                        {!compactView && (
                          <td className="p-3 border-0">{ticket.lastReply}</td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 8}
                        className="p-8 text-center"
                      >
                        <div className="text-slate-500">
                          <FaExclamationCircle className="mx-auto mb-4 text-4xl text-slate-300" />
                          <h3 className="text-lg font-medium mb-2 text-slate-700">
                            No Support Tickets Found
                          </h3>
                          <p className="text-sm">
                            {searchTerm || statusFilter !== "All"
                              ? "No tickets match your current filters. Try adjusting your search or filter criteria."
                              : "You don't have any support tickets yet. Click 'New Ticket' to create your first one."}
                          </p>
                          {(searchTerm || statusFilter !== "All") && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("All");
                              }}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <div className="text-sm text-slate-500">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(
                    startIndex + entriesPerPage,
                    filteredTickets.length
                  )}{" "}
                  of {filteredTickets.length} entries
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(currentPage - 2, totalPages - 4)) +
                      i;
                    return pageNum <= totalPages ? (
                      <button
                        key={pageNum}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                          currentPage === pageNum
                            ? "border-transparent bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                            : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ) : null;
                  })}
                  <button
                    className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default ClientSupportPage;
