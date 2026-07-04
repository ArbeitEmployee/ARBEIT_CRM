/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaFileContract,
  FaCalendarCheck,
  FaFileAlt,
  FaEye,
} from "react-icons/fa";
import axios from "axios";

const ClientContactsPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    aboutToExpire: 0,
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Fetch client contacts from API
  const fetchClientContacts = async () => {
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

      const { data } = await axios.get(`${API_BASE_URL}/client/contacts`, {
        ...config,
        params: params,
      });

      setContacts(data.contacts || []);
      setStats(
        data.stats || {
          active: 0,
          expired: 0,
          aboutToExpire: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      setError(error.response?.data?.message || error.message);

      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        window.location.href = "/client/login";
      }

      setContacts([]);
      setStats({
        active: 0,
        expired: 0,
        aboutToExpire: 0,
      });
      setClientInfo({});
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if token exists
    const token = getClientToken();
    if (!token) {
      alert("Please login to access contacts.");
      window.location.href = "/client/login";
      return;
    }

    fetchClientContacts();
  }, [statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchClientContacts();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Filter contacts (client-side filtering as backup)
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.customer &&
        contact.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      contact.contractType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.project.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && new Date(contact.endDate) >= new Date()) ||
      (statusFilter === "Expired" && new Date(contact.endDate) < new Date()) ||
      (statusFilter === "About to Expire" &&
        new Date(contact.endDate) >= new Date() &&
        new Date(contact.endDate) <=
          new Date(new Date().setDate(new Date().getDate() + 30)));

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredContacts.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const getStatusColor = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);

    if (end < today) {
      return "bg-red-100 text-red-800";
    } else if (end <= new Date(today.setDate(today.getDate() + 30))) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-green-100 text-green-800";
    }
  };

  const getStatusText = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);

    if (end < today) {
      return "Expired";
    } else if (end <= new Date(today.setDate(today.getDate() + 30))) {
      return "About to Expire";
    } else {
      return "Active";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-20 p-6 rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-4">Error Loading Contracts</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchClientContacts}
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
          Dashboard / Contracts
        </p>
        <h1 className="text-2xl font-bold text-slate-900">My Contracts</h1>
        <div className="flex items-center text-slate-500 text-sm mt-1">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Contracts</span>
        </div>

        {/* Client Info */}
        {clientInfo.company && (
          <div className="mt-4 p-5 rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="text-lg font-semibold mb-2">Company Information</h3>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Active Contracts */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Contracts</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaFileContract className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Expired Contracts */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Expired Contracts</p>
              <p className="text-2xl font-bold">{stats.expired}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaCalendarCheck className="text-red-600" />
            </div>
          </div>
        </div>

        {/* About to Expire */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">About to Expire</p>
              <p className="text-2xl font-bold">{stats.aboutToExpire}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaFileAlt className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View Button */}
      <div className="flex items-center justify-end">
        <button
          className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-2"
          onClick={() => setCompactView(!compactView)}
        >
          {compactView ? "Full View" : "Compact View"}
        </button>
      </div>

      {/* White box for table */}
      <div
        className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 ${
          compactView ? "w-full" : "w-full"
        }`}
      >
        {/* Controls */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
              <option value="Active">Active</option>
              <option value="About to Expire">About to Expire</option>
              <option value="Expired">Expired</option>
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
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm flex items-center text-slate-700 hover:bg-white"
              onClick={fetchClientContacts}
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search contracts..."
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
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider font-semibold">
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#0f172a", color: "white" }}
                >
                  Subject
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#0f172a", color: "white" }}
                >
                  Contract Type
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Contract Value
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      End Date
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Status
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Contract Value
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Start Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      End Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Project
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((contact) => (
                  <tr
                    key={contact._id}
                    className="bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,.06)] rounded-lg hover:bg-white relative"
                    style={{ color: "black" }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="font-medium">{contact.subject}</div>
                    </td>
                    <td className="p-3 border-0">{contact.contractType}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">
                          {formatCurrency(contact.contractValue)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(contact.endDate)}
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              contact.endDate
                            )}`}
                          >
                            {getStatusText(contact.endDate)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">
                          {formatCurrency(contact.contractValue)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(contact.startDate)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(contact.endDate)}
                        </td>
                        <td className="p-3 border-0">{contact.project}</td>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              contact.endDate
                            )}`}
                          >
                            {getStatusText(contact.endDate)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 7} className="p-8 text-center">
                    <div className="text-gray-500">
                      <FaFileContract className="mx-auto mb-4 text-4xl text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">
                        No Contracts Found
                      </h3>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "All"
                          ? "No contracts match your current filters. Try adjusting your search or filter criteria."
                          : "You don't have any contracts yet. Contracts will appear here once they are created for your company."}
                      </p>
                      {(searchTerm || statusFilter !== "All") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("All");
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
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
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filteredContacts.length)}{" "}
              of {filteredContacts.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return pageNum <= totalPages ? (
                  <button
                    key={pageNum}
                    className={`rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold hover:bg-white ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white border-transparent hover:brightness-110"
                        : "bg-white/80 text-slate-700"
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
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
      </div>
    </div>
  );
};

export default ClientContactsPage;
