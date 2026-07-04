/* eslint-disable react-hooks/exhaustive-deps */
// ClientPayments.jsx
import { useState, useEffect } from "react";
import {
  FaEye,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaChevronRight,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ClientPayments = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  });

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem("crm_client_token");
  };

  // Create axios instance with client auth headers
  const createAxiosConfig = () => {
    const token = getClientToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch client payments
  const fetchClientPayments = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/client/payments`,
        config
      );

      if (data.success) {
        setPayments(data.data || []);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching client payments:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        navigate("/client/login");
      }
      setPayments([]);
    }
    setLoading(false);
  };

  // Fetch payment stats
  const fetchPaymentStats = async () => {
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/client/payments/stats`,
        config
      );

      if (data.success) {
        const statsData = {
          total: data.data.total.count || 0,
          totalAmount: data.data.total.totalAmount || 0,
          completed: 0,
          pending: 0,
          failed: 0,
          refunded: 0,
        };

        // Process status-based stats
        data.data.byStatus.forEach((stat) => {
          switch (stat._id) {
            case "Completed":
              statsData.completed = stat.count;
              break;
            case "Pending":
              statsData.pending = stat.count;
              break;
            case "Failed":
              statsData.failed = stat.count;
              break;
            case "Refunded":
              statsData.refunded = stat.count;
              break;
          }
        });

        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  useEffect(() => {
    fetchClientPayments();
    fetchPaymentStats();
  }, []);

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice?.invoiceNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredPayments.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Status icons
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <FaCheckCircle className="text-green-600" />;
      case "Pending":
        return <FaClock className="text-yellow-600" />;
      case "Failed":
        return <FaTimesCircle className="text-red-600" />;
      case "Refunded":
        return <FaMoneyBillWave className="text-purple-600" />;
      default:
        return <FaFileInvoiceDollar className="text-gray-600" />;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-slate-600">
        Loading payments...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Dashboard / Payments
          </p>
          <h1 className="text-2xl font-bold text-slate-900">My Payments</h1>
          <div className="mt-1 flex items-center text-slate-500 text-sm">
            <span>Dashboard</span>
            <FaChevronRight className="mx-1 text-xs" />
            <span>Payments</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Payments</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
                <p className="text-sm text-slate-500 tabular-nums">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaFileInvoiceDollar className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.completed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Pending</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaClock className="text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Failed Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Failed/Refunded</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.failed + stats.refunded}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaTimesCircle className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* White box for table */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            {/* Refresh button */}
            <button
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
              onClick={() => {
                fetchClientPayments();
                fetchPaymentStats();
              }}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search payments..."
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
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-wider font-semibold text-slate-500">
                <th className="px-4 sm:px-6 py-3">Payment #</th>
                <th className="px-4 sm:px-6 py-3">Invoice #</th>
                <th className="px-4 sm:px-6 py-3">Date</th>
                <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                <th className="px-4 sm:px-6 py-3">Payment Mode</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {currentData.length > 0 ? (
                currentData.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-white/70 text-slate-700"
                  >
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-900">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      {payment.invoice?.invoiceNumber || "N/A"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-right tabular-nums">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">{payment.paymentMode}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          payment.status
                        )} inline-flex items-center gap-1`}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Payment Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-6 py-4 text-center text-slate-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredPayments.length)} of{" "}
            {filteredPayments.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
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
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    currentPage === pageNum
                      ? "border-transparent bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                      : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ) : null;
            })}
            <button
              className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Payment Modal */}
      {viewModal && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 p-4">
              <h2 className="text-xl font-semibold text-slate-900">Payment Details</h2>
              <button
                onClick={() => setViewModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">
                    Payment #{selectedPayment.paymentNumber}
                  </h3>
                  <p className="text-sm text-slate-600">
                    <strong>Invoice:</strong>{" "}
                    {selectedPayment.invoice?.invoiceNumber || "N/A"}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Date:</strong>{" "}
                    {formatDate(selectedPayment.paymentDate)}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Payment Mode:</strong> {selectedPayment.paymentMode}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Transaction ID:</strong>{" "}
                    {selectedPayment.transactionId}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      selectedPayment.status
                    )} inline-flex items-center gap-1`}
                  >
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status}
                  </span>
                  <p className="text-2xl font-bold mt-2 text-slate-900 tabular-nums">
                    {formatCurrency(
                      selectedPayment.amount,
                      selectedPayment.currency
                    )}
                  </p>
                  {selectedPayment.invoice && (
                    <p className="text-sm text-slate-600 mt-1 tabular-nums">
                      For invoice total:{" "}
                      {formatCurrency(
                        selectedPayment.invoice.total,
                        selectedPayment.invoice.currency
                      )}
                    </p>
                  )}
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-slate-900">Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}

              {selectedPayment.invoice && (
                <div>
                  <h4 className="font-semibold mb-2 text-slate-900">Invoice Details</h4>
                  <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600">
                    <p>
                      <strong>Status:</strong> {selectedPayment.invoice.status}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {formatDate(selectedPayment.invoice.dueDate)}
                    </p>
                    {selectedPayment.invoice.items && (
                      <p>
                        <strong>Items:</strong>{" "}
                        {selectedPayment.invoice.items.length} item(s)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ClientPayments;
