/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaTimes } from "react-icons/fa";

const AllAdmins = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const adminsPerPage = 10;

  useEffect(() => {
    fetchAdmins();
    // Get current user info from localStorage
    const userData = localStorage.getItem("crm_admin");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const filtered = admins.filter(
      (admin) =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [searchTerm, admins]);

  const fetchAdmins = async () => {
    try {
      setError("");
      const token = localStorage.getItem("crm_token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Access denied. Only superAdmin can view admins.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAdmins(data);
      setFilteredAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      setError(error.message || "Failed to fetch admins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (adminId, newStatus) => {
    try {
      const token = localStorage.getItem("crm_token");
      const response = await fetch(`${API_BASE_URL}/admin/update-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Update local state
        setAdmins(
          admins.map((admin) =>
            admin._id === adminId ? { ...admin, status: newStatus } : admin
          )
        );
        alert("Status updated successfully");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    try {
      const token = localStorage.getItem("crm_token");
      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdmins(admins.filter((admin) => admin._id !== adminId));
        alert("Admin deleted successfully");
      } else {
        alert(data.message || "Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Error deleting admin");
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("crm_token");

      // Don't allow role change if editing superAdmin
      const updateData = { ...editAdmin };
      if (updateData.role === "superAdmin") {
        delete updateData.role; // Prevent role change for superAdmin
      }

      const response = await fetch(`${API_BASE_URL}/admin/${editAdmin._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setAdmins(
          admins.map((admin) =>
            admin._id === editAdmin._id ? { ...editAdmin } : admin
          )
        );
        setEditAdmin(null);
        alert("Admin updated successfully");
      } else {
        alert(data.message || "Failed to update admin");
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Error updating admin");
    }
  };

  // Get current admins for pagination
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = filteredAdmins.slice(
    indexOfFirstAdmin,
    indexOfLastAdmin
  );
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="animate-pulse text-slate-500">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">All Admins</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search admins..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 backdrop-blur"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-3 text-slate-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                <th className="px-4 sm:px-6 py-3 rounded-l-xl">Name</th>
                <th className="px-4 sm:px-6 py-3">Email</th>
                <th className="px-4 sm:px-6 py-3">Role</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Created At</th>
                <th className="px-4 sm:px-6 py-3 rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {currentAdmins.length > 0 ? (
                currentAdmins.map((admin) => (
                  <tr
                    key={admin._id}
                    className="hover:bg-white/70 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-900">{admin.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-600">{admin.email}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <span className="rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-xs font-medium capitalize">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <select
                        value={admin.status}
                        onChange={(e) =>
                          handleStatusUpdate(admin._id, e.target.value)
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          admin.status
                        )} border-none focus:ring-0`}
                        disabled={
                          admin.role === "superAdmin" ||
                          (currentUser && currentUser.role !== "superAdmin")
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-slate-600 tabular-nums">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewAdmin(admin)}
                          className="text-blue-500 hover:text-blue-700"
                          title="View"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => setEditAdmin(admin)}
                          className="text-green-500 hover:text-green-700"
                          title="Edit"
                          disabled={
                            admin.role === "superAdmin" &&
                            currentUser &&
                            currentUser.id !== admin._id
                          }
                        >
                          <FaEdit size={16} />
                        </button>
                        {/* Only show delete button for superAdmin and not for themselves or other superAdmins */}
                        {currentUser &&
                          currentUser.role === "superAdmin" &&
                          admin._id !== currentUser.id &&
                          admin.role !== "superAdmin" && (
                            <button
                              onClick={() => handleDeleteAdmin(admin._id)}
                              className="inline-flex items-center justify-center rounded-lg bg-red-100 text-red-700 p-1.5 hover:bg-red-200"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-6 py-6 text-center text-slate-500"
                  >
                    {admins.length === 0
                      ? "No admin records found"
                      : "No admins match your search criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAdmins.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-between items-center mt-4 text-sm text-slate-600">
            <span>
              Showing {indexOfFirstAdmin + 1} to{" "}
              {Math.min(indexOfLastAdmin, filteredAdmins.length)} of{" "}
              {filteredAdmins.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`rounded-xl border px-3 py-1.5 font-medium ${
                    currentPage === i + 1
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Admin Modal */}
      {viewAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 w-full max-w-md shadow-[0_30px_90px_rgba(15,23,42,.25)] backdrop-blur">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Admin Details</h2>
              <button
                onClick={() => setViewAdmin(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <b>Name:</b> {viewAdmin.name}
              </p>
              <p>
                <b>Email:</b> {viewAdmin.email}
              </p>
              <p>
                <b>Role:</b>{" "}
                <span className="capitalize">{viewAdmin.role}</span>
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    viewAdmin.status
                  )}`}
                >
                  {viewAdmin.status}
                </span>
              </p>
              <p>
                <b>Created At:</b>{" "}
                {new Date(viewAdmin.createdAt).toLocaleString()}
              </p>
              <p>
                <b>Last Updated:</b>{" "}
                {new Date(viewAdmin.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewAdmin(null)}
                className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 w-full max-w-md shadow-[0_30px_90px_rgba(15,23,42,.25)] backdrop-blur">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Edit Admin</h2>
              <button
                onClick={() => setEditAdmin(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={editAdmin.name}
                    onChange={(e) =>
                      setEditAdmin({ ...editAdmin, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={editAdmin.email}
                    onChange={(e) =>
                      setEditAdmin({ ...editAdmin, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={editAdmin.status}
                    onChange={(e) =>
                      setEditAdmin({ ...editAdmin, status: e.target.value })
                    }
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditAdmin(null)}
                  className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                >
                  Update Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAdmins;
