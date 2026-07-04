/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ClientProposals = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalProposals: 0,
    draftProposals: 0,
    sentProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [viewProposal, setViewProposal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem("crm_client_token");
  };

  // Create axios instance with client auth headers
  const createAxiosConfig = () => {
    const token = getClientToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch client proposals from API
  const fetchClientProposals = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const params = {
        search: searchTerm,
        status: statusFilter !== "All" ? statusFilter : undefined,
      };

      const { data } = await axios.get(`${API_BASE_URL}/client/proposals`, {
        ...config,
        params: params,
      });

      setProposals(data.proposals || []);
      setStats(
        data.stats || {
          totalProposals: 0,
          draftProposals: 0,
          sentProposals: 0,
          acceptedProposals: 0,
          rejectedProposals: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client proposals:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/client/login";
      }
      setProposals([]);
      setStats({
        totalProposals: 0,
        draftProposals: 0,
        sentProposals: 0,
        acceptedProposals: 0,
        rejectedProposals: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientProposals();
  }, [searchTerm, statusFilter]);

  // Handle proposal action (accept/reject)
  const handleProposalAction = async (proposalId, action) => {
    setActionLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.put(
        `${API_BASE_URL}/client/proposals/${proposalId}/${action}`,
        {},
        config
      );

      if (data.success) {
        alert(
          `Proposal ${
            action === "accept" ? "accepted" : "rejected"
          } successfully!`
        );
        fetchClientProposals(); // Refresh the list
        setViewProposal(null); // Close the view modal
      }
    } catch (error) {
      console.error(`Error ${action}ing proposal:`, error);
      alert(`Failed to ${action} proposal. Please try again.`);
    }
    setActionLoading(false);
  };

  // Filter proposals (client-side filtering as backup)
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposalNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      proposal.status?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProposals.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredProposals.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-slate-600">
        Loading proposals...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Client Portal
        </p>
        <h1 className="text-2xl font-bold text-slate-900">My Proposals</h1>
        <div className="flex items-center text-slate-500">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Proposals</span>
        </div>

        {/* Client Info */}
        {clientInfo.company && (
          <div className="mt-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="text-lg font-semibold mb-2 text-slate-900">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Company: {clientInfo.company}
                </p>
                <p className="text-sm text-gray-600">
                  Contact: {clientInfo.contact}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Email: {clientInfo.email}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {clientInfo.phone}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Proposals */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total Proposals</p>
              <p className="text-2xl font-bold">{stats.totalProposals}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileAlt className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Sent Proposals */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Sent</p>
              <p className="text-2xl font-bold">{stats.sentProposals}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileAlt className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Accepted Proposals */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Accepted</p>
              <p className="text-2xl font-bold">{stats.acceptedProposals}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected Proposals */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejectedProposals}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimesCircle className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Draft Proposals */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{stats.draftProposals}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaFileAlt className="text-gray-600" />
            </div>
          </div>
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
            {/* Status Filter */}
            <select
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            {/* Refresh button */}
            <button
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
              onClick={fetchClientProposals}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search proposals..."
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

                  Proposal #
                </th>
                <th
                  className="p-3"
                >

                  Title
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                    >

                      Amount
                    </th>
                    <th
                      className="p-3"
                    >

                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                    >

                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="p-3"
                    >

                      Date
                    </th>
                    <th
                      className="p-3"
                    >

                      Open Till
                    </th>
                    <th
                      className="p-3"
                    >

                      Amount
                    </th>
                    <th
                      className="p-3"
                    >

                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                    >

                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((proposal) => (
                  <tr
                    key={proposal._id}
                    className="border-b border-slate-200/70 hover:bg-white/70 transition-colors text-slate-700"
                  >
                    <td className="p-3 rounded-l-lg border-0 font-medium">
                      {proposal.proposalNumber ||
                        `TEMP-${proposal._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="p-3 border-0">{proposal.title || "N/A"}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0 text-right tabular-nums">
                          {formatCurrency(
                            proposal.total || 0,
                            proposal.currency
                          )}
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              proposal.status
                            )}`}
                          >
                            {proposal.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewProposal(proposal)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                            {proposal.status === "Sent" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleProposalAction(proposal._id, "accept")
                                  }
                                  className="text-green-500 hover:text-green-700"
                                  title="Accept Proposal"
                                  disabled={actionLoading}
                                >
                                  <FaCheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleProposalAction(proposal._id, "reject")
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Reject Proposal"
                                  disabled={actionLoading}
                                >
                                  <FaTimesCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">
                          {formatDate(proposal.date)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(proposal.openTill)}
                        </td>
                        <td className="p-3 border-0 text-right tabular-nums">
                          {formatCurrency(
                            proposal.total || 0,
                            proposal.currency
                          )}
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              proposal.status
                            )}`}
                          >
                            {proposal.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewProposal(proposal)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                            {proposal.status === "Sent" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleProposalAction(proposal._id, "accept")
                                  }
                                  className="text-green-500 hover:text-green-700"
                                  title="Accept Proposal"
                                  disabled={actionLoading}
                                >
                                  <FaCheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleProposalAction(proposal._id, "reject")
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Reject Proposal"
                                  disabled={actionLoading}
                                >
                                  <FaTimesCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 7} className="p-8 text-center text-slate-500">
                    No proposals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredProposals.length)} of{" "}
            {filteredProposals.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
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

      {/* Proposal Detail Modal */}
      {viewProposal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/70 p-4 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-semibold text-slate-900">Proposal Details</h2>
              <button
                onClick={() => setViewProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Proposal Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Proposal #:</span>{" "}
                      {viewProposal.proposalNumber ||
                        `TEMP-${viewProposal._id.slice(-6).toUpperCase()}`}
                    </p>
                    <p>
                      <span className="font-medium">Title:</span>{" "}
                      {viewProposal.title || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          viewProposal.status
                        )}`}
                      >
                        {viewProposal.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(viewProposal.date)}
                    </p>
                    <p>
                      <span className="font-medium">Valid Until:</span>{" "}
                      {formatDate(viewProposal.openTill)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Financial Details
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Currency:</span>{" "}
                      {viewProposal.currency || "USD"}
                    </p>
                    <p>
                      <span className="font-medium">Subtotal:</span>{" "}
                      {formatCurrency(
                        viewProposal.subtotal || 0,
                        viewProposal.currency
                      )}
                    </p>
                    {viewProposal.discount > 0 && (
                      <p>
                        <span className="font-medium">Discount:</span> -
                        {formatCurrency(
                          viewProposal.discount || 0,
                          viewProposal.currency
                        )}
                      </p>
                    )}
                    <p className="text-lg font-bold">
                      <span className="font-medium">Total:</span>{" "}
                      {formatCurrency(
                        viewProposal.total || 0,
                        viewProposal.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Items</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewProposal.items && viewProposal.items.length > 0 ? (
                        viewProposal.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-200/70">
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-center tabular-nums">{item.quantity}</td>
                            <td className="p-3 text-right tabular-nums">
                              {formatCurrency(item.rate, viewProposal.currency)}
                            </td>
                            <td className="p-3 text-right tabular-nums">
                              {formatCurrency(
                                item.quantity * item.rate,
                                viewProposal.currency
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              {viewProposal.status === "Sent" && (
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-slate-200/70">
                  <button
                    onClick={() =>
                      handleProposalAction(viewProposal._id, "reject")
                    }
                    className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={() =>
                      handleProposalAction(viewProposal._id, "accept")
                    }
                    className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Accept Proposal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ClientProposals;
