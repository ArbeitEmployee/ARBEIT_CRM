import { useState, useEffect } from "react";
import { 
  FaSearch, FaSyncAlt, FaChevronRight, FaTasks, 
  FaCalendarCheck, FaPauseCircle, FaBan, FaCheckCircle 
} from "react-icons/fa";
import axios from "axios";

const ClientProjectPage = () => {
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    progressProjects: 0,
    onHoldProjects: 0,
    cancelledProjects: 0,
    finishedProjects: 0
  });
  const [clientInfo, setClientInfo] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem('crm_client_token');
  };

  // Create axios instance with client auth headers
  const createAxiosConfig = () => {
    const token = getClientToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch client projects from API
  const fetchClientProjects = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const params = {
        search: searchTerm,
        status: statusFilter !== "All" ? statusFilter : undefined
      };
      
      const { data } = await axios.get("http://localhost:5000/api/client/projects", {
        ...config,
        params: params
      });
      
      setProjects(data.projects || []);
      setStats(data.stats || {
        totalProjects: 0,
        progressProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        finishedProjects: 0
      });
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client projects:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/client/login";
      }
      setProjects([]);
      setStats({
        totalProjects: 0,
        progressProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        finishedProjects: 0
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientProjects();
  }, [searchTerm, statusFilter]);

  // Filter projects (client-side filtering as backup)
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      project.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredProjects.slice(startIndex, startIndex + entriesPerPage);

  const getStatusColor = (status) => {
    switch(status) {
      case "Progress": return "bg-blue-100 text-blue-800";
      case "Last Started": return "bg-green-100 text-green-800";
      case "On Hold": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Finished": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading projects...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Projects</span>
        </div>
        
        {/* Client Info */}
        {clientInfo.company && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Company: {clientInfo.company}</p>
                <p className="text-sm text-gray-600">Contact: {clientInfo.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email: {clientInfo.email}</p>
                <p className="text-sm text-gray-600">Phone: {clientInfo.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Projects */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Projects</p>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaTasks className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Progress Projects */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-2xl font-bold">{stats.progressProjects}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaTasks className="text-green-600" />
            </div>
          </div>
        </div>

        {/* On Hold Projects */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">On Hold</p>
              <p className="text-2xl font-bold">{stats.onHoldProjects}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaPauseCircle className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Cancelled Projects */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cancelled</p>
              <p className="text-2xl font-bold">{stats.cancelledProjects}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaBan className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Finished Projects */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Finished</p>
              <p className="text-2xl font-bold">{stats.finishedProjects}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaCheckCircle className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* White box for table */}
      <div className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
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
              <option value="Progress">Progress</option>
              <option value="Last Started">Last Started</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Finished">Finished</option>
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
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={fetchClientProjects}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search projects..."
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
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                {compactView ? (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Deadline</th>
                  </>
                ) : (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Start Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Deadline</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Members</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((project) => (
                  <tr
                    key={project._id}
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: 'black' }}
                  >
                    <td className="p-3 rounded-l-lg border-0 font-medium">{project.name}</td>
                    <td className="p-3 border-0">{project.tags || "N/A"}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="p-3 border-0 rounded-r-lg">{formatDate(project.deadline)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">{formatDate(project.startDate)}</td>
                        <td className="p-3 border-0">{formatDate(project.deadline)}</td>
                        <td className="p-3 border-0">{project.members || "N/A"}</td>
                        <td className="p-3 border-0 rounded-r-lg">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={compactView ? 4 : 6} className="p-4 text-center">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredProjects.length)} of {filteredProjects.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProjectPage;