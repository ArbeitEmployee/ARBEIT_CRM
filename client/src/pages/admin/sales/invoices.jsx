import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSyncAlt, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Invoices = () => {
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState({ 
    customer: "", 
    status: "Draft" 
  });

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/admin/invoices");
      setInvoices(data.data || data);
    } catch (err) {
      console.error("Error fetching invoices", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Export handler
  const handleExport = (type) => {
    if (!invoices.length) return;

    const exportData = invoices.map((i) => ({
      InvoiceNumber: i.invoiceNumber || "INV-" + i._id.slice(-6).toUpperCase(),
      Customer: i.customer,
      Amount: i.total,
      TotalTax: i.items ? i.items.reduce((sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0), 0) : 0,
      Project: i.reference || "-",
      Tags: i.tags || "-",
      Date: i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString() : "-",
      DueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "-",
      Reference: i.reference || "-",
      Status: i.status,
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
        link.setAttribute("download", "invoices.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Invoices");
        XLSXWriteFile(workbook, "invoices.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("invoices.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Invoices</title></head><body>");
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

  // Delete invoice
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/invoices/${id}`);
      setInvoices(invoices.filter((i) => i._id !== id));
    } catch (err) {
      console.error("Error deleting invoice", err);
    }
  };

  // Update invoice
  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/invoices/${editInvoice._id}`, formData);
      setEditInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error("Error updating invoice", err);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastInvoice = currentPage * entriesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - entriesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading invoices...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-11 flex-wrap gap-2">
        <button
          onClick={() => navigate("../invoices/new")}
          className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
        >
          <FaPlus /> New Invoice
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
                      onClick={() => handleExport(item)}
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
              onClick={fetchInvoices}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border rounded pl-2 pr-3 py-1 text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm(searchInput);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Invoice#</th>
                <th className="p-2 border">Amount</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Total Tax</th>
                    <th className="p-2 border">Customer</th>
                    <th className="p-2 border">Project</th>
                    <th className="p-2 border">Tags</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Reference</th>
                    <th className="p-2 border">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentInvoices.length > 0 ? (
                currentInvoices.map((invoice) => {
                  const displayInvoiceNumber = invoice.invoiceNumber || "INV-" + invoice._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: invoice.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(invoice.total || 0);

                  const totalTax = invoice.items ? 
                    invoice.items.reduce((sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0), 0) : 0;

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={invoice._id}
                      className="hover:bg-gray-50 cursor-pointer relative"
                      onMouseEnter={() => setHoveredId(invoice._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="p-2 border font-mono relative">
                        {displayInvoiceNumber}
                        {hoveredId === invoice._id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-md p-1 flex gap-2 text-xs z-10">
                            <button
                              onClick={() => setViewInvoice(invoice)}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => {
                                setEditInvoice(invoice);
                                setFormData({
                                  customer: invoice.customer || "",
                                  status: invoice.status || "Draft",
                                });
                              }}
                              className="px-2 py-1 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <FaEdit /> Update
                            </button>
                            <button
                              onClick={() => handleDelete(invoice._id)}
                              className="px-2 py-1 flex items-center gap-1 text-red-600 hover:bg-gray-100 rounded"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border text-right">{displayAmount}</td>
                      {compactView ? (
                        <>
                          <td className="p-2 border">{invoice.customer || "-"}</td>
                          <td className="p-2 border">{formatDate(invoice.invoiceDate)}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !invoice.status || invoice.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : invoice.status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "Overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {invoice.status || "Draft"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 border text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: invoice.currency || "USD",
                              minimumFractionDigits: 2,
                            }).format(totalTax)}
                          </td>
                          <td className="p-2 border">{invoice.customer || "-"}</td>
                          <td className="p-2 border">{invoice.reference || "-"}</td>
                          <td className="p-2 border">{invoice.tags || "-"}</td>
                          <td className="p-2 border">{formatDate(invoice.invoiceDate)}</td>
                          <td className="p-2 border">{formatDate(invoice.dueDate)}</td>
                          <td className="p-2 border">{invoice.reference || "-"}</td>
                          <td className="p-2 border">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                !invoice.status || invoice.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : invoice.status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "Overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {invoice.status || "Draft"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={compactView ? 5 : 10} className="p-4 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {indexOfFirstInvoice + 1} to {Math.min(indexOfLastInvoice, filteredInvoices.length)} of{" "}
            {filteredInvoices.length} entries
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

      {/* View & Edit Modals */}
      {viewInvoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Invoice Details</h2>
            <p><b>Invoice #:</b> {viewInvoice.invoiceNumber}</p>
            <p><b>Customer:</b> {viewInvoice.customer}</p>
            <p><b>Reference:</b> {viewInvoice.reference || "-"}</p>
            <p><b>Amount:</b> {viewInvoice.total}</p>
            <p><b>Status:</b> {viewInvoice.status}</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewInvoice(null)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {editInvoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Update Invoice</h2>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
              placeholder="Customer Name"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="border w-full p-2 mb-2 rounded"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditInvoice(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;