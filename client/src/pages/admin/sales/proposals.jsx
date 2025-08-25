import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSyncAlt, FaEye, FaEdit, FaTrash, FaChevronRight, FaTimes, FaSearch } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [selectedProposals, setSelectedProposals] = useState([]);

  const [viewProposal, setViewProposal] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  const [formData, setFormData] = useState({ clientName: "", title: "", total: 0, status: "Draft" });

  // Status options
  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected"];
  
  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Sent": return "bg-blue-100 text-blue-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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

  // Toggle proposal selection
  const toggleProposalSelection = (id) => {
    if (selectedProposals.includes(id)) {
      setSelectedProposals(selectedProposals.filter(proposalId => proposalId !== id));
    } else {
      setSelectedProposals([...selectedProposals, id]);
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!proposals.length) return;

    const exportData = proposals.map((p) => ({
      ProposalNumber: p.proposalNumber || "TEMP-" + p._id.slice(-6).toUpperCase(),
      Client: p.clientName,
      Title: p.title,
      Amount: p.total,
      Status: p.status,
      Date: p.date ? new Date(p.date).toLocaleDateString() : "-",
      OpenTill: p.openTill ? new Date(p.openTill).toLocaleDateString() : "-",
      Tags: p.tags || "-",
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) => Object.values(row).map((val) => `"${val}"`).join(","))
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "proposals.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Proposals");
        XLSXWriteFile(workbook, "proposals.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("proposals.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Proposals</title></head><body>");
        printWindow.document.write("<table border='1' style='border-collapse: collapse; width: 100%;'>");
        printWindow.document.write("<thead><tr>");
        Object.keys(exportData[0]).forEach((col) => {
          printWindow.document.write(`<th>${col}</th>`);
        });
        printWindow.document.write("</tr></thead><tbody>");
        exportData.forEach((row) => {
          printWindow.document.write("<tr>");
          Object.values(row).forEach((val) => {
            printWindow.document.write(`<td>${val}</td>`);
          });
          printWindow.document.write("</tr>");
        });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
        break;
      }

      default:
        console.log("Unknown export type:", type);
    }

    setShowExportMenu(false);
  };

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Proposals</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Proposals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Proposals</p>
              <p className="text-2xl font-bold">{proposals.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft Proposals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{proposals.filter(p => p.status === "Draft").length}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaEdit className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Sent Proposals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sent</p>
              <p className="text-2xl font-bold">{proposals.filter(p => p.status === "Sent").length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Accepted Proposals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Accepted</p>
              <p className="text-2xl font-bold">{proposals.filter(p => p.status === "Accepted").length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaEye className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected Proposals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejected</p>
              <p className="text-2xl font-bold">{proposals.filter(p => p.status === "Rejected").length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 text-sm rounded flex items-center gap-2" 
            style={{ backgroundColor: '#333333', color: 'white' }}
            onClick={() => navigate("../proposals/new")}
          >
            <FaPlus /> New Proposal
          </button>
          
          {/* Delete Selected button */}
          {selectedProposals.length > 0 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={async () => {
                if (window.confirm(`Delete ${selectedProposals.length} selected proposals?`)) {
                  try {
                    await Promise.all(selectedProposals.map(id =>
                      axios.delete(`http://localhost:5000/api/admin/proposals/${id}`)
                    ));
                    setSelectedProposals([]);
                    fetchProposals();
                    alert("Selected proposals deleted!");
                  } catch {
                    alert("Error deleting selected proposals.");
                  }
                }
              }}
            >
              Delete Selected ({selectedProposals.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"}
          </button>
        </div>
      </div>

      {/* White box for table */}
      <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
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
              <option value={100}>100</option>
            </select>
            
            {/* Export button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="border px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                <HiOutlineDownload /> Export
              </button>

              {/* Dropdown menu */}
              {showExportMenu && (
                <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Excel")}
                  >
                    Excel
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("CSV")}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("PDF")}
                  >
                    PDF
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Print")}
                  >
                    Print
                  </button>
                </div>
              )}
            </div>

            {/* Refresh button */}
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
              placeholder="Search..."
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
                  <input
                    type="checkbox"
                    checked={selectedProposals.length === currentProposals.length && currentProposals.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProposals(currentProposals.map(p => p._id));
                      } else {
                        setSelectedProposals([]);
                      }
                    }}
                  />
                </th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Proposal#</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Client</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Title</th>
                {compactView ? (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Open Till</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentProposals.map((proposal) => {
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
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: 'black' }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProposals.includes(proposal._id)}
                          onChange={() => toggleProposalSelection(proposal._id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </td>
                    <td className="p-3 border-0 font-mono">{displayProposalNumber}</td>
                    <td className="p-3 border-0">{proposal.clientName || "-"}</td>
                    <td className="p-3 border-0">{proposal.title || "-"}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0 text-right">{displayAmount}</td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(proposal.status)}`}>
                            {proposal.status || "Draft"}
                          </span>
                        </td>
                        <td className="p-3 rounded-r-lg border-0">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewProposal(proposal)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View"
                            >
                              <FaEye size={16} />
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
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(proposal._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0 text-right">{displayAmount}</td>
                        <td className="p-3 border-0">{formatDate(proposal.date)}</td>
                        <td className="p-3 border-0">{formatDate(proposal.openTill)}</td>
                        <td className="p-3 border-0">{proposal.tags || "-"}</td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(proposal.status)}`}>
                            {proposal.status || "Draft"}
                          </span>
                        </td>
                        <td className="p-3 rounded-r-lg border-0">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewProposal(proposal)}
                              className="text-blue-500 hover:text-blue-700"
                              title="View"
                            >
                              <FaEye size={16} />
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
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(proposal._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {indexOfFirstProposal + 1} to{" "}
            {Math.min(indexOfLastProposal, filteredProposals.length)} of{" "}
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
      </div>

      {/* View & Edit Modals */}
      {viewProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Proposal Details</h2>
              <button 
                onClick={() => setViewProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p><b>Proposal #:</b> {viewProposal.proposalNumber || "TEMP-" + viewProposal._id.slice(-6).toUpperCase()}</p>
              <p><b>Client:</b> {viewProposal.clientName}</p>
              <p><b>Title:</b> {viewProposal.title}</p>
              <p><b>Amount:</b> ${viewProposal.total || 0}</p>
              <p><b>Status:</b> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(viewProposal.status)}`}>
                {viewProposal.status || "Draft"}
              </span></p>
              {viewProposal.date && <p><b>Date:</b> {new Date(viewProposal.date).toLocaleDateString()}</p>}
              {viewProposal.openTill && <p><b>Open Till:</b> {new Date(viewProposal.openTill).toLocaleDateString()}</p>}
              {viewProposal.tags && <p><b>Tags:</b> {viewProposal.tags}</p>}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewProposal(null)} 
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Proposal</h2>
              <button 
                onClick={() => setEditProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setEditProposal(null)} 
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate} 
                className="px-4 py-2 bg-black text-white rounded text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;