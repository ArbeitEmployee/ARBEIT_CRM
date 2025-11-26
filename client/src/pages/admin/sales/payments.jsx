import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaEye,
  FaChevronRight,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Payments = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [stats, setStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalAmount: 0,
  });

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("crm_token");
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch payments data from API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const config = createAxiosConfig();
      const response = await axios.get(
        `${API_BASE_URL}/admin/payments`,
        config
      );

      if (response.data.success) {
        setPayments(response.data.data);

        // Calculate stats
        const total = response.data.data.length;
        const completed = response.data.data.filter(
          (p) => p.status === "Completed"
        ).length;
        const pending = response.data.data.filter(
          (p) => p.status === "Pending"
        ).length;
        const failed = response.data.data.filter(
          (p) => p.status === "Failed"
        ).length;
        const refunded = response.data.data.filter(
          (p) => p.status === "Refunded"
        ).length;
        const totalAmount = response.data.data.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        setStats({
          totalPayments: total,
          completedPayments: completed,
          pendingPayments: pending,
          failedPayments: failed,
          refundedPayments: refunded,
          totalAmount: totalAmount,
        });
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.response?.data?.message || "Failed to load payment data");
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Export handler
  const handleExport = (type) => {
    if (!payments.length) return;

    const exportData = payments.map((p) => ({
      PaymentNumber: p.paymentNumber,
      InvoiceNumber: p.invoiceNumber,
      PaymentMode: p.paymentMode,
      TransactionID: p.transactionId,
      Customer: p.customer,
      Amount: formatCurrency(p.amount, p.currency),
      PaymentDate: new Date(p.paymentDate).toLocaleDateString(),
      Status: p.status,
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) =>
            Object.values(row)
              .map((val) => `"${val}"`)
              .join(",")
          )
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("payments.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Payments</title></head><body>"
        );
        printWindow.document.write(
          "<table border='1' style='border-collapse: collapse; width: 100%;'>"
        );
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
  const currentPayments = filteredPayments.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );
  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage);

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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

      {/* Stats Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Payments */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Payments</p>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaSearch className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed Payments */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-2xl font-bold">{stats.completedPayments}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaEye className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Amount</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaPlus className="text-purple-600" />
            </div>
          </div>
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
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10"
                >
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
              onClick={fetchPayments}
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
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Payment #
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Invoice #
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Payment Mode
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Transaction ID
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Customer
                </th>
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
                  Payment Date
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
              </tr>
            </thead>
            <tbody>
              {currentPayments.length > 0 ? (
                currentPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                    style={{ color: "black" }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      {payment.paymentNumber}
                    </td>
                    <td className="p-3 border-0 ">{payment.invoiceNumber}</td>
                    <td className="p-3 border-0">{payment.paymentMode}</td>
                    <td className="p-3 border-0 ">{payment.transactionId}</td>
                    <td className="p-3 border-0">{payment.customer}</td>
                    <td className="p-3 border-0 ">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="p-3 border-0">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 border-0">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          payment.status
                        )}`}
                      >
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
              Showing {indexOfFirstPayment + 1} to{" "}
              {Math.min(indexOfLastPayment, filteredPayments.length)} of{" "}
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
              <p>
                <b>Payment #:</b> {viewPayment.paymentNumber}
              </p>
              <p>
                <b>Invoice #:</b> {viewPayment.invoiceNumber}
              </p>
              <p>
                <b>Customer:</b> {viewPayment.customer}
              </p>
              <p>
                <b>Payment Mode:</b> {viewPayment.paymentMode}
              </p>
              <p>
                <b>Transaction ID:</b> {viewPayment.transactionId}
              </p>
              <p>
                <b>Amount:</b>{" "}
                {formatCurrency(viewPayment.amount, viewPayment.currency)}
              </p>
              <p>
                <b>Payment Date:</b>{" "}
                {new Date(viewPayment.paymentDate).toLocaleDateString()}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    viewPayment.status
                  )}`}
                >
                  {viewPayment.status}
                </span>
              </p>
              {viewPayment.notes && (
                <p>
                  <b>Notes:</b> {viewPayment.notes}
                </p>
              )}
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
