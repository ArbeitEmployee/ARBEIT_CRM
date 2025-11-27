/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaFileInvoiceDollar,
  FaClock,
  FaCheckCircle,
  FaBan,
  FaEye,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";

const ClientEstimateRequest = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [estimates, setEstimates] = useState([]);
  const [stats, setStats] = useState({
    totalEstimates: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingEstimate, setViewingEstimate] = useState(null);
  const [respondingEstimate, setRespondingEstimate] = useState(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [isResponding, setIsResponding] = useState(false);

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

  // Fetch client estimates from API
  const fetchClientEstimates = async () => {
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

      const { data } = await axios.get(
        `${API_BASE_URL}/client/estimate-requests`,
        {
          ...config,
          params: params,
        }
      );

      setEstimates(data.estimates || []);
      setStats(
        data.stats || {
          totalEstimates: 0,
          draft: 0,
          sent: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client estimates:", error);
      setError(error.response?.data?.message || error.message);

      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        window.location.href = "/client/login";
      }

      setEstimates([]);
      setStats({
        totalEstimates: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
      });
      setClientInfo({});
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if token exists
    const token = getClientToken();
    if (!token) {
      alert("Please login to access estimates.");
      window.location.href = "/client/login";
      return;
    }

    fetchClientEstimates();
  }, [statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchClientEstimates();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle estimate response (accept/reject)
  const handleEstimateResponse = async (status) => {
    if (!respondingEstimate || isResponding) return;

    setIsResponding(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.put(
        `${API_BASE_URL}/client/estimate-requests/${respondingEstimate._id}/respond`,
        { status, responseNotes },
        config
      );

      alert(`Estimate ${status.toLowerCase()} successfully!`);
      setRespondingEstimate(null);
      setResponseNotes("");
      fetchClientEstimates(); // Refresh the estimates list
    } catch (error) {
      console.error("Error responding to estimate:", error);
      alert(error.response?.data?.message || "Error responding to estimate");
    } finally {
      setIsResponding(false);
    }
  };

  // Filter estimates (client-side filtering as backup)
  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.customer &&
        estimate.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      estimate.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.amount.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" || estimate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEstimates.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredEstimates.slice(
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
      case "Expired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading estimates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-4">Error Loading Estimates</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchClientEstimates}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Estimate Requests</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Estimates</span>
        </div>

        {/* Client Info */}
        {clientInfo.company && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Estimates */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Estimates</p>
              <p className="text-2xl font-bold">{stats.totalEstimates}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileInvoiceDollar className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaClock className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sent</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaCheckCircle className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Accepted</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaBan className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Expired */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Expired</p>
              <p className="text-2xl font-bold">{stats.expired}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaClock className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View Button */}
      <div className="flex items-center justify-end mb-4">
        <button
          className="border px-3 py-1 text-sm rounded flex items-center gap-2"
          onClick={() => setCompactView(!compactView)}
        >
          {compactView ? "Full View" : "Compact View"}
        </button>
      </div>

      {/* White box for table */}
      <div
        className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${
          compactView ? "w-full" : "w-full"
        }`}
      >
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>

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

            {/* Refresh button */}
            <button
              className="border px-2.5 py-1.5 rounded text-sm flex items-center hover:bg-gray-50"
              onClick={fetchClientEstimates}
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search estimates..."
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
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Project Name
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Created Date
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Created Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((estimate) => (
                  <tr
                    key={estimate._id}
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: "black" }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="font-medium">{estimate.projectName}</div>
                    </td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">
                          {formatCurrency(estimate.amount)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(estimate.createdDate)}
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              estimate.status
                            )}`}
                          >
                            {estimate.status}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">
                          {estimate.customer
                            ? estimate.customer.company
                            : "N/A"}
                        </td>
                        <td className="p-3 border-0">
                          {formatCurrency(estimate.amount)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(estimate.createdDate)}
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              estimate.status
                            )}`}
                          >
                            {estimate.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => setViewingEstimate(estimate)}
                            >
                              <FaEye />
                            </button>

                            {estimate.status === "Sent" && (
                              <div className="flex gap-1">
                                <button
                                  className="text-green-600 hover:text-green-800"
                                  onClick={() =>
                                    setRespondingEstimate(estimate)
                                  }
                                  title="Accept Estimate"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() =>
                                    setRespondingEstimate(estimate)
                                  }
                                  title="Reject Estimate"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={compactView ? 4 : 6}
                    className="p-4 text-center text-gray-500"
                  >
                    {searchTerm || statusFilter !== "All"
                      ? "No estimates match your search criteria"
                      : "No estimates found for your account"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredEstimates.length)} of{" "}
            {filteredEstimates.length} entries
          </div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    currentPage === pageNum ? "bg-gray-200" : ""
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Estimate Modal */}
      {viewingEstimate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Estimate Details</h3>
              <button
                onClick={() => setViewingEstimate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    {viewingEstimate.projectName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    {formatCurrency(viewingEstimate.amount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created Date
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    {formatDate(viewingEstimate.createdDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        viewingEstimate.status
                      )}`}
                    >
                      {viewingEstimate.status}
                    </span>
                  </p>
                </div>
              </div>

              {viewingEstimate.sentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sent Date
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    {formatDate(viewingEstimate.sentDate)}
                  </p>
                </div>
              )}

              {viewingEstimate.responseDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Response Date
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    {formatDate(viewingEstimate.responseDate)}
                  </p>
                </div>
              )}

              {viewingEstimate.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">
                    {viewingEstimate.notes}
                  </p>
                </div>
              )}

              {viewingEstimate.clientResponseNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Your Response Notes
                  </label>
                  <p className="mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">
                    {viewingEstimate.clientResponseNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingEstimate(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Estimate Modal */}
      {respondingEstimate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Respond to Estimate</h3>
              <button
                onClick={() => {
                  setRespondingEstimate(null);
                  setResponseNotes("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <p className="font-medium">{respondingEstimate.projectName}</p>
              <p className="text-gray-600">
                {formatCurrency(respondingEstimate.amount)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Notes (Optional)
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Add any notes about your response..."
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => handleEstimateResponse("Rejected")}
                disabled={isResponding}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isResponding ? "Processing..." : "Reject Estimate"}
              </button>

              <button
                onClick={() => handleEstimateResponse("Accepted")}
                disabled={isResponding}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isResponding ? "Processing..." : "Accept Estimate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientEstimateRequest;
