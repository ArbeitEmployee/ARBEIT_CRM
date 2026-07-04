/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTasks,
  FaCalendarCheck,
  FaPauseCircle,
  FaBan,
  FaCheckCircle,
  FaEye,
} from "react-icons/fa";
import axios from "axios";

const ClientProjectPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    finishedProjects: 0,
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

  // Fetch client projects from API
  const fetchClientProjects = async () => {
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

      console.log("Making API request with params:", params);

      const { data } = await axios.get(`${API_BASE_URL}/client/projects`, {
        ...config,
        params: params,
      });

      console.log("API Response:", data);

      setProjects(data.projects || []);
      setStats(
        data.stats || {
          totalProjects: 0,
          progressProjects: 0,
          onHoldProjects: 0,
          cancelledProjects: 0,
          finishedProjects: 0,
        }
      );
      setClientInfo(data.clientInfo || {});
    } catch (error) {
      console.error("Error fetching client projects:", error);
      setError(error.response?.data?.message || error.message);

      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        window.location.href = "/client/login";
      }

      setProjects([]);
      setStats({
        totalProjects: 0,
        progressProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        finishedProjects: 0,
      });
      setClientInfo({});
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if token exists
    const token = getClientToken();
    if (!token) {
      alert("Please login to access projects.");
      window.location.href = "/client/login";
      return;
    }

    fetchClientProjects();
  }, [statusFilter]); // Remove searchTerm from dependencies to avoid too many requests

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        // Only fetch if searchTerm has been set
        fetchClientProjects();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Filter projects (client-side filtering as backup)
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags &&
        project.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
      project.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredProjects.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Progress":
        return "bg-blue-100 text-blue-800";
      case "Last Started":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Finished":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const handleViewProject = (projectId) => {
    // Navigate to project details page
    window.location.href = `/client/projects/${projectId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="max-w-md mx-auto mt-20 p-6 rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-4">Error Loading Projects</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchClientProjects}
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
          Dashboard / Projects
        </p>
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <div className="flex items-center text-slate-500 text-sm mt-1">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Projects</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Projects */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
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
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
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
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
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
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
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
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:shadow-[0_24px_70px_rgba(15,23,42,.12)] transition-shadow">
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
              <option value="Progress">Progress</option>
              <option value="Last Started">Last Started</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Finished">Finished</option>
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
              onClick={fetchClientProjects}
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
              placeholder="Search projects..."
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
                  Project Name
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#0f172a", color: "white" }}
                >
                  Tags
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Deadline
                    </th>
                  </>
                ) : (
                  <>
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
                      Deadline
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#0f172a", color: "white" }}
                    >
                      Members
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
                currentData.map((project) => (
                  <tr
                    key={project._id}
                    className="bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,.06)] rounded-lg hover:bg-white relative"
                    style={{ color: "black" }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="font-medium">{project.name}</div>
                      {/*{project._id && (
                        <div className="text-xs text-gray-500">ID: {project._id}</div>
                      )}*/}
                    </td>
                    <td className="p-3 border-0">{project.tags || "N/A"}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(project.deadline)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">
                          {formatDate(project.startDate)}
                        </td>
                        <td className="p-3 border-0">
                          {formatDate(project.deadline)}
                        </td>
                        <td className="p-3 border-0">
                          {project.members || "N/A"}
                        </td>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={compactView ? 4 : 6} className="p-8 text-center">
                    <div className="text-gray-500">
                      <FaTasks className="mx-auto mb-4 text-4xl text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">
                        No Projects Found
                      </h3>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "All"
                          ? "No projects match your current filters. Try adjusting your search or filter criteria."
                          : "You don't have any projects yet. Projects will appear here once they are assigned to you."}
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
              {Math.min(startIndex + entriesPerPage, filteredProjects.length)}{" "}
              of {filteredProjects.length} entries
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

export default ClientProjectPage;
