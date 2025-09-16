import { useState, useEffect } from "react";
import { 
  FaSearch, FaSyncAlt, FaChevronRight, FaFileInvoiceDollar,
  FaClock, FaCheckCircle, FaBan, FaEye 
} from "react-icons/fa";
import axios from "axios";

const ClientEstimateRequest = () => {
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
    expired: 0
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingEstimate, setViewingEstimate] = useState(null);

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem('crm_client_token');
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
        'Content-Type': 'application/json'
      }
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
      
      const { data } = await axios.get("http://localhost:5000/api/client/estimate-requests", {
        ...config,
        params: params
      });
      
      setEstimates(data.estimates || []);
      setStats(data.stats || {
        totalEstimates: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0
      });
      setClientInfo(data.clientInfo || {});
      
    } catch (error) {
      console.error("Error fetching client estimates:", error);
      setError(error.response?.data?.message || error.message);
      
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem('crm_client_token');
        window.location.href = "/client/login";
      }
      
      setEstimates([]);
      setStats({
        totalEstimates: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0
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

  // Filter estimates (client-side filtering as backup)
  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = 
      estimate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.customer && estimate.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      estimate.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.amount.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "All" || estimate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEstimates.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredEstimates.slice(startIndex, startIndex + entriesPerPage);

  const getStatusColor = (status) => {
    switch(status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Sent": return "bg-blue-100 text-blue-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Expired": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading estimates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen p-4">
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
    <div className="bg-gray-100 min-h-screen p-4">
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
                <p className="text-sm text-gray-600">Company: <span className="font-medium">{clientInfo.company}</span></p>
                <p className="text-sm text-gray-600">Contact: <span className="font-medium">{clientInfo.contact}</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email: <span className="font-medium">{clientInfo.email}</span></p>
                <p className="text-sm text-gray-600">Phone: <span className="font-medium">{clientInfo.phone || 'N/A'}</span></p>
                {clientInfo.customerCode && (
                  <p className="text-sm text-blue-600">Customer Code: <span className="font-medium">{clientInfo.customerCode}</span></p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {/* Total Estimates */}
        <div className="bg-white p-4 rounded-lg shadow border">
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
        <div className="bg-white p-4 rounded-lg shadow border">
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
        <div className="bg-white p-4 rounded-lg shadow border">
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
        <div className="bg-white p-4 rounded-lg shadow border">
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
        <div className="bg-white p-4 rounded-lg shadow border">
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
        <div className="bg-white p-4 rounded-lg shadow border">
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
      <div className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${compactView ? "w-full" : "w-full"}`}>
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
                <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                  Project Name
                </th>
                {compactView ? (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
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
                    style={{ color: 'black' }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="font-medium">{estimate.projectName}</div>
                    </td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">{formatCurrency(estimate.amount)}</td>
                        <td className="p-3 border-0">{formatDate(estimate.createdDate)}</td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(estimate.status)}`}>
                            {estimate.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <button
                            onClick={() => setViewingEstimate(estimate)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Estimate Details"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">
                          {estimate.customer ? estimate.customer.company : "N/A"}
                          {estimate.customer && estimate.customer.customerCode && (
                            <div className="text-xs text-blue-600 mt-1">
                              {estimate.customer.customerCode}
                            </div>
                          )}
                        </td>
                        <td className="p-3 border-0">{formatCurrency(estimate.amount)}</td>
                        <td className="p-3 border-0">{formatDate(estimate.createdDate)}</td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(estimate.status)}`}>
                            {estimate.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <button
                            onClick={() => setViewingEstimate(estimate)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Estimate Details"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 6} className="p-8 text-center">
                    <div className="text-gray-500">
                      <FaFileInvoiceDollar className="mx-auto mb-4 text-4xl text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No Estimates Found</h3>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "All" 
                          ? "No estimates match your current filters. Try adjusting your search or filter criteria."
                          : "You don't have any estimates yet. Estimates will appear here once they are created for your account."
                        }
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
              Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredEstimates.length)} of {filteredEstimates.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                className="border px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return pageNum <= totalPages ? (
                  <button
                    key={pageNum}
                    className={`border px-3 py-1 rounded text-sm hover:bg-gray-50 ${
                      currentPage === pageNum ? "bg-gray-800 text-white hover:bg-gray-700" : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                className="border px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Estimate Modal */}
      {viewingEstimate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Estimate Details</h2>
              <button
                onClick={() => setViewingEstimate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Project Name</p>
                <p className="font-medium">{viewingEstimate.projectName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {viewingEstimate.customer ? viewingEstimate.customer.company : "N/A"}
                </p>
                {viewingEstimate.customer && viewingEstimate.customer.customerCode && (
                  <p className="text-sm text-blue-600 mt-1">
                    {viewingEstimate.customer.customerCode}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer Email</p>
                <p className="font-medium">
                  {viewingEstimate.customer ? viewingEstimate.customer.email : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer Phone</p>
                <p className="font-medium">
                  {viewingEstimate.customer ? viewingEstimate.customer.phone : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(viewingEstimate.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">{formatDate(viewingEstimate.createdDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(viewingEstimate.status)}`}>
                    {viewingEstimate.status}
                  </span>
                </p>
              </div>
            </div>
            {viewingEstimate.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Notes/Content</p>
                <p className="font-medium mt-1 p-3 bg-gray-100 rounded">{viewingEstimate.notes}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setViewingEstimate(null)}
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

export default ClientEstimateRequest;