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

const ClientEstimates = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [estimates, setEstimates] = useState([]);
  const [stats, setStats] = useState({
    totalEstimates: 0,
    draftEstimates: 0,
    pendingEstimates: 0,
    approvedEstimates: 0,
    rejectedEstimates: 0,
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [viewEstimate, setViewEstimate] = useState(null);
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

  // Fetch client estimates from API
  const fetchClientEstimates = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const params = {
        search: searchTerm,
        status: statusFilter !== "All" ? statusFilter : undefined,
      };

      const { data } = await axios.get(`${API_BASE_URL}/client/estimates`, {
        ...config,
        params: params,
      });

      setEstimates(data.estimates || []);
      setStats(
        data.stats || {
          totalEstimates: 0,
          draftEstimates: 0,
          pendingEstimates: 0,
          approvedEstimates: 0,
          rejectedEstimates: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client estimates:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/client/login";
      }
      setEstimates([]);
      setStats({
        totalEstimates: 0,
        draftEstimates: 0,
        pendingEstimates: 0,
        approvedEstimates: 0,
        rejectedEstimates: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientEstimates();
  }, [searchTerm, statusFilter]);

  // Handle estimate action (approve/reject)
  const handleEstimateAction = async (estimateId, action) => {
    setActionLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.put(
        `${API_BASE_URL}/client/estimates/${estimateId}/${action}`,
        {},
        config
      );

      if (data.success) {
        alert(
          `Estimate ${
            action === "approve" ? "approved" : "rejected"
          } successfully!`
        );
        fetchClientEstimates(); // Refresh the list
        setViewEstimate(null); // Close the view modal
      }
    } catch (error) {
      console.error(`Error ${action}ing estimate:`, error);
      alert(`Failed to ${action} estimate. Please try again.`);
    }
    setActionLoading(false);
  };

  // Filter estimates (client-side filtering as backup)
  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.estimateNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      estimate.status?.toLowerCase().includes(searchTerm.toLowerCase());

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
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Approved":
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
      <div className="bg-gray-100 min-h-screen p-4">Loading estimates...</div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Estimates</h1>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Estimates</p>
              <p className="text-2xl font-bold">{stats.totalEstimates}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileAlt className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingEstimates}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileAlt className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Approved Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-2xl font-bold">{stats.approvedEstimates}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejectedEstimates}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimesCircle className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Draft Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{stats.draftEstimates}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaFileAlt className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* White box for table */}
      <div
        className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            {/* Refresh button */}
            <button
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={fetchClientEstimates}
            >
              <FaSyncAlt />
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
                  Estimate #
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Reference
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
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                ) : (
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
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Expiry Date
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
                    <td className="p-3 rounded-l-lg border-0 font-medium">
                      {estimate.estimateNumber ||
                        `EST-${estimate._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="p-3 border-0">
                      {estimate.reference || "N/A"}
                    </td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0 text-right">
                          {formatCurrency(
                            estimate.total || 0,
                            estimate.currency
                          )}
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewEstimate(estimate)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                            {estimate.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleEstimateAction(
                                      estimate._id,
                                      "approve"
                                    )
                                  }
                                  className="text-green-500 hover:text-green-700"
                                  title="Approve Estimate"
                                  disabled={actionLoading}
                                >
                                  <FaCheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEstimateAction(estimate._id, "reject")
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Reject Estimate"
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
                        <td className="p-3 border-0 text-right">
                          {formatCurrency(
                            estimate.total || 0,
                            estimate.currency
                          )}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(estimate.estimateDate)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(estimate.expiryDate)}
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewEstimate(estimate)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                            {estimate.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleEstimateAction(
                                      estimate._id,
                                      "approve"
                                    )
                                  }
                                  className="text-green-500 hover:text-green-700"
                                  title="Approve Estimate"
                                  disabled={actionLoading}
                                >
                                  <FaCheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEstimateAction(estimate._id, "reject")
                                  }
                                  className="text-red-500 hover:text-red-700"
                                  title="Reject Estimate"
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
                  <td colSpan={compactView ? 5 : 7} className="p-4 text-center">
                    No estimates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredEstimates.length)} of{" "}
            {filteredEstimates.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
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
                  className={`border px-3 py-1 rounded text-sm ${
                    currentPage === pageNum ? "bg-gray-800 text-white" : ""
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ) : null;
            })}
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
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

      {/* Estimate Detail Modal */}
      {viewEstimate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Estimate Details</h2>
              <button
                onClick={() => setViewEstimate(null)}
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
                    Estimate Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Estimate #:</span>{" "}
                      {viewEstimate.estimateNumber ||
                        `EST-${viewEstimate._id.slice(-6).toUpperCase()}`}
                    </p>
                    <p>
                      <span className="font-medium">Reference:</span>{" "}
                      {viewEstimate.reference || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                          viewEstimate.status
                        )}`}
                      >
                        {viewEstimate.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(viewEstimate.estimateDate)}
                    </p>
                    <p>
                      <span className="font-medium">Valid Until:</span>{" "}
                      {formatDate(viewEstimate.expiryDate)}
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
                      {viewEstimate.currency || "USD"}
                    </p>
                    <p>
                      <span className="font-medium">Subtotal:</span>{" "}
                      {formatCurrency(
                        viewEstimate.subtotal || 0,
                        viewEstimate.currency
                      )}
                    </p>
                    {viewEstimate.discount > 0 && (
                      <p>
                        <span className="font-medium">Discount:</span> -
                        {formatCurrency(
                          viewEstimate.discount || 0,
                          viewEstimate.currency
                        )}
                      </p>
                    )}
                    <p className="text-lg font-bold">
                      <span className="font-medium">Total:</span>{" "}
                      {formatCurrency(
                        viewEstimate.total || 0,
                        viewEstimate.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Tax 1</th>
                        <th className="p-3 text-right">Tax 2</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEstimate.items && viewEstimate.items.length > 0 ? (
                        viewEstimate.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">
                              {formatCurrency(item.rate, viewEstimate.currency)}
                            </td>
                            <td className="p-3 text-right">{item.tax1}%</td>
                            <td className="p-3 text-right">{item.tax2}%</td>
                            <td className="p-3 text-right">
                              {formatCurrency(
                                item.amount,
                                viewEstimate.currency
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              {viewEstimate.status === "Pending" && (
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t">
                  <button
                    onClick={() =>
                      handleEstimateAction(viewEstimate._id, "reject")
                    }
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Reject Estimate
                  </button>
                  <button
                    onClick={() =>
                      handleEstimateAction(viewEstimate._id, "approve")
                    }
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Approve Estimate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientEstimates;
