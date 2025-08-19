import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSearch, FaSyncAlt, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Proposals = () => {
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  const [viewProposal, setViewProposal] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  const [formData, setFormData] = useState({ clientName: "", title: "", total: 0, status: "Draft" });

  // Fetch proposals
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/proposals");
      setProposals(data.data || data);
    } catch (err) {
      console.error("Error fetching proposals", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Delete proposal
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this proposal?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/proposals/${id}`);
      setProposals(proposals.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting proposal", err);
    }
  };

  // Update proposal
  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/proposals/${editProposal._id}`, formData);
      setEditProposal(null);
      fetchProposals();
    } catch (err) {
      console.error("Error updating proposal", err);
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(
    (proposal) =>
      proposal.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastProposal = currentPage * entriesPerPage;
  const indexOfFirstProposal = indexOfLastProposal - entriesPerPage;
  const currentProposals = filteredProposals.slice(indexOfFirstProposal, indexOfLastProposal);
  const totalPages = Math.ceil(filteredProposals.length / entriesPerPage);

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading proposals...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-11 flex-wrap gap-2">
        <button
          onClick={() => navigate("../proposals/new")}
          className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
        >
          <FaPlus /> New Proposal
        </button>
        <div className="flex items-center gap-2">
          <button
            className="border px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"}
          </button>
          <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {/* White box */}
      <div
        className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Table controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="border px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                <HiOutlineDownload /> Export
              </button>
              {showExportMenu && (
                <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
                  {["Excel", "CSV", "PDF", "Print"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        console.log(`${item} export triggered`);
                        setShowExportMenu(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              className="border px-2 py-1 rounded text-sm flex items-center"
              onClick={fetchProposals}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search proposals..."
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
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Proposal#</th>
                <th className="p-2 border">Client</th>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Amount</th>
                {compactView ? (
                  <th className="p-2 border">Status</th>
                ) : (
                  <>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Open Till</th>
                    <th className="p-2 border">Tags</th>
                    <th className="p-2 border">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentProposals.length > 0 ? (
                currentProposals.map((proposal) => {
                  const formatProposalNumber = (num) => {
                    if (!num) return "TEMP-" + proposal._id.slice(-6).toUpperCase();
                    if (num.startsWith("PRO-")) return num;
                    const matches = num.match(/\d+/);
                    const numberPart = matches ? matches[0] : "000001";
                    return `PRO-${String(numberPart).padStart(6, "0")}`;
                  };

                  const displayProposalNumber = formatProposalNumber(proposal.proposalNumber);

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: proposal.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(proposal.total || 0);

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={proposal._id}
                      className="hover:bg-gray-50 cursor-pointer relative"
                      onMouseEnter={() => setHoveredId(proposal._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="p-2 border font-mono relative">
                        {displayProposalNumber}
                        {hoveredId === proposal._id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-md p-1 flex gap-2 text-xs z-10">
                            <button
                              onClick={() => setViewProposal(proposal)}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditProposal(proposal);
                                setFormData({
                                  clientName: proposal.clientName || "",
                                  title: proposal.title || "",
                                  total: proposal.total || 0,
                                  status: proposal.status || "Draft",
                                });
                              }}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEdit /> Update
                            </button>
                            <button
                              onClick={() => handleDelete(proposal._id)}
                              className="px-2 py-1 flex items-center gap-1 text-red-600 hover:bg-gray-100 rounded"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border">{proposal.clientName || "-"}</td>
                      <td className="p-2 border">{proposal.title || "-"}</td>
                      <td className="p-2 border text-right">{displayAmount}</td>
                      {compactView ? (
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              !proposal.status || proposal.status === "Draft"
                                ? "bg-gray-100 text-gray-800"
                                : proposal.status === "Accepted"
                                ? "bg-green-100 text-green-800"
                                : proposal.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {proposal.status || "Draft"}
                          </span>
                        </td>
                      ) : (
                        <>
                          <td className="p-2 border">{formatDate(proposal.date)}</td>
                          <td className="p-2 border">{formatDate(proposal.openTill)}</td>
                          <td className="p-2 border">{proposal.tags || "-"}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !proposal.status || proposal.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : proposal.status === "Accepted"
                                  ? "bg-green-100 text-green-800"
                                  : proposal.status === "Rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {proposal.status || "Draft"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 8} className="p-4 text-center text-gray-500">
                    No proposals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {indexOfFirstProposal + 1} to {Math.min(indexOfLastProposal, filteredProposals.length)} of{" "}
            {filteredProposals.length} entries
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
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-gray-200" : ""}`}
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
      </div>

      {/* View Modal */}
      {viewProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Proposal Details</h2>
            <p>
              <b>Client:</b> {viewProposal.clientName}
            </p>
            <p>
              <b>Title:</b> {viewProposal.title}
            </p>
            <p>
              <b>Amount:</b> {viewProposal.total}
            </p>
            <p>
              <b>Status:</b> {viewProposal.status}
            </p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewProposal(null)} className="px-3 py-1 bg-gray-200 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Update Proposal</h2>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
              placeholder="Client Name"
            />
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
              placeholder="Title"
            />
            <input
              type="number"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
              placeholder="Amount"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditProposal(null)} className="px-3 py-1 bg-gray-200 rounded">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
