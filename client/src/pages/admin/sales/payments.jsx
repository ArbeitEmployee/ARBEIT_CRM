import { useState, useEffect, useRef } from "react";
import { FaSearch, FaSyncAlt, FaEye, FaChevronRight, FaTimes } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Payments = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Fetch invoices data from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/admin/invoices");
        
        if (response.data.success) {
          // Transform invoice data into payment records
          const paymentRecords = response.data.data
            .filter(invoice => invoice.status !== "Draft") // Exclude drafts
            .flatMap(invoice => {
              // Create payment records based on payment status
              const baseRecord = {
                invoiceNumber: invoice.invoiceNumber,
                customer: invoice.customer,
                totalAmount: invoice.total,
                invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString(),
                dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A",
                status: invoice.status,
                currency: invoice.currency || "USD"
              };
              
              // For paid invoices, create a payment record
              if (invoice.status === "Paid") {
                return [{
                  ...baseRecord,
                  paymentId: `PAY-${invoice.invoiceNumber}`,
                  paymentMode: invoice.paymentMode,
                  transactionId: `TXN-${invoice.invoiceNumber}-${new Date(invoice.updatedAt).getTime()}`,
                  amount: invoice.total,
                  paidAmount: invoice.paidAmount || invoice.total,
                  paymentDate: new Date(invoice.updatedAt).toLocaleDateString(),
                  isFullPayment: true
                }];
              }
              
              // For partially paid invoices, create a payment record
              if (invoice.status === "Partiallypaid" && invoice.paidAmount > 0) {
                return [{
                  ...baseRecord,
                  paymentId: `PAY-${invoice.invoiceNumber}-PART`,
                  paymentMode: invoice.paymentMode,
                  transactionId: `TXN-${invoice.invoiceNumber}-PART-${new Date(invoice.updatedAt).getTime()}`,
                  amount: invoice.paidAmount,
                  paidAmount: invoice.paidAmount,
                  paymentDate: new Date(invoice.updatedAt).toLocaleDateString(),
                  isFullPayment: false
                }];
              }
              
              // For unpaid invoices, no payment records
              return [];
            });
            
          setPayments(paymentRecords);
        }
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setError(err.response?.data?.message || "Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Export handler
  const handleExport = (type) => {
    if (!payments.length) return;

    const exportData = payments.map((p) => ({
      PaymentNumber: p.paymentId,
      InvoiceNumber: p.invoiceNumber,
      PaymentMode: p.paymentMode,
      TransactionID: p.transactionId,
      Customer: p.customer,
      Amount: formatCurrency(p.amount, p.currency),
      PaymentDate: p.paymentDate,
      Status: p.status,
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
        link.setAttribute("download", "payments.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Payments");
        XLSXWriteFile(workbook, "payments.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("payments.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Payments</title></head><body>");
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

  // Search filter
  const filteredPayments = payments.filter((pay) =>
    Object.values(pay).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const indexOfLastPayment = currentPage * entriesPerPage;
  const indexOfFirstPayment = indexOfLastPayment - entriesPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage);

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Partiallypaid": return "bg-yellow-100 text-yellow-800";
      case "Unpaid": return "bg-red-100 text-red-800";
      case "Overdue": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 pt-28 flex items-center justify-center">
        <div className="bg-white shadow-md rounded p-8">
          <p>Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 pt-28 flex items-center justify-center">
        <div className="bg-white shadow-md rounded p-8 text-red-500">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Payments</span>
        </div>
      </div>

      {/* White box for table & controls */}
      <div className="bg-white shadow-md rounded p-4 transition-all duration-300 w-full">
        {/* Table controls */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
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
                <div ref={exportMenuRef} className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={() => window.location.reload()}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search payments..."
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                  Payment #
                </th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Invoice #</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Payment Mode</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Transaction ID</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Payment Date</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.length > 0 ? (
                currentPayments.map((payment) => (
                  <tr
                    key={payment.paymentId}
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: 'black' }}
                  >
                    <td className="p-3 rounded-l-lg border-0 font-mono">{payment.paymentId}</td>
                    <td className="p-3 border-0 font-mono">{payment.invoiceNumber}</td>
                    <td className="p-3 border-0">{payment.paymentMode}</td>
                    <td className="p-3 border-0 font-mono">{payment.transactionId}</td>
                    <td className="p-3 border-0">{payment.customer}</td>
                    <td className="p-3 border-0 text-right">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="p-3 border-0">{payment.paymentDate}</td>
                    <td className="p-3 border-0">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-3 rounded-r-lg border-0">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewPayment(payment)}
                          className="text-blue-500 hover:text-blue-700"
                          title="View"
                        >
                          <FaEye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={9} 
                    className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                  >
                    {payments.length === 0 
                      ? "No payment records found" 
                      : "No payments match your search criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstPayment + 1} to {Math.min(indexOfLastPayment, filteredPayments.length)} of{" "}
              {filteredPayments.length} entries
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

      {/* View Payment Modal */}
      {viewPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <button 
                onClick={() => setViewPayment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p><b>Payment #:</b> {viewPayment.paymentId}</p>
              <p><b>Invoice #:</b> {viewPayment.invoiceNumber}</p>
              <p><b>Customer:</b> {viewPayment.customer}</p>
              <p><b>Payment Mode:</b> {viewPayment.paymentMode}</p>
              <p><b>Transaction ID:</b> {viewPayment.transactionId}</p>
              <p><b>Amount:</b> {formatCurrency(viewPayment.amount, viewPayment.currency)}</p>
              <p><b>Payment Date:</b> {viewPayment.paymentDate}</p>
              <p><b>Status:</b> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(viewPayment.status)}`}>
                {viewPayment.status}
              </span></p>
              {viewPayment.invoiceDate && <p><b>Invoice Date:</b> {viewPayment.invoiceDate}</p>}
              {viewPayment.dueDate && viewPayment.dueDate !== "N/A" && <p><b>Due Date:</b> {viewPayment.dueDate}</p>}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewPayment(null)} 
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
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

export default Payments;