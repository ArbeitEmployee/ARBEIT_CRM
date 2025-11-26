import { useState, useEffect } from "react";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";

const PendingAdmins = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const adminsPerPage = 10;

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  useEffect(() => {
    const filtered = admins.filter(
      (admin) =>
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [searchTerm, admins]);

  const fetchPendingAdmins = async () => {
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

      console.log("Response status:", response.status);

      if (response.status === 403) {
        setError("Access denied. Only superAdmin can view admins.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched admins:", data);

      const pendingAdmins = data.filter((admin) => admin.status === "pending");
      setAdmins(pendingAdmins);
      setFilteredAdmins(pendingAdmins);
    } catch (error) {
      console.error("Error fetching pending admins:", error);
      setError(
        error.message || "Failed to fetch pending admins. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async (adminId) => {
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
          status: "approved",
        }),
      });

      if (response.ok) {
        // Remove from pending list
        setAdmins(admins.filter((admin) => admin._id !== adminId));
        alert("Admin approved successfully");
      } else {
        const errorData = await response.json();
        alert(
          `Failed to approve admin: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error approving admin:", error);
      alert("Error approving admin. Please try again.");
    }
  };

  const handleRejectAdmin = async (adminId) => {
    if (
      !window.confirm("Are you sure you want to reject and delete this admin?")
    )
      return;

    try {
      const token = localStorage.getItem("crm_token");
      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from pending list
        setAdmins(admins.filter((admin) => admin._id !== adminId));
        alert("Admin rejected and deleted successfully");
      } else {
        const errorData = await response.json();
        alert(
          `Failed to reject admin: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error rejecting admin:", error);
      alert("Error rejecting admin. Please try again.");
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pending admins...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchPendingAdmins}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Admins</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search pending admins..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
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

      <div className="bg-white rounded-lg shadow p-4">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Name
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Email
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Role
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Request Date
                </th>
                <th
                  className="p-3 rounded-r-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentAdmins.length > 0 ? (
                currentAdmins.map((admin) => (
                  <tr
                    key={admin._id}
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: "black" }}
                  >
                    <td className="p-3 rounded-l-lg border-0">{admin.name}</td>
                    <td className="p-3 border-0">{admin.email}</td>
                    <td className="p-3 border-0 capitalize">{admin.role}</td>
                    <td className="p-3 border-0">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 rounded-r-lg border-0">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewAdmin(admin)}
                          className="text-blue-500 hover:text-blue-700"
                          title="View"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => handleApproveAdmin(admin._id)}
                          className="text-green-500 hover:text-green-700"
                          title="Approve"
                        >
                          <FaCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleRejectAdmin(admin._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Reject & Delete"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                  >
                    {admins.length === 0
                      ? "No pending admin requests"
                      : "No pending admins match your search criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAdmins.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstAdmin + 1} to{" "}
              {Math.min(indexOfLastAdmin, filteredAdmins.length)} of{" "}
              {filteredAdmins.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1 ? "bg-gray-200" : ""
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Admin Details</h2>
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
                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                  {viewAdmin.status}
                </span>
              </p>
              <p>
                <b>Request Date:</b>{" "}
                {new Date(viewAdmin.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setViewAdmin(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApproveAdmin(viewAdmin._id);
                  setViewAdmin(null);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  handleRejectAdmin(viewAdmin._id);
                  setViewAdmin(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAdmins;
