/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaProjectDiagram,
  FaChartLine,
  FaFileAlt,
  FaFileContract,
  FaSyncAlt,
} from "react-icons/fa";
import axios from "axios";

const Home = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invoices: {
      total: 0,
      unpaid: 0,
      partiallypaid: 0,
      overdue: 0,
      paid: 0,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
    },
    payments: {
      total: 0,
      totalAmount: 0,
      recent: [],
    },
    projects: {
      total: 0,
      progress: 0,
      onHold: 0,
      cancelled: 0,
      finished: 0,
    },
    proposals: {
      total: 0,
      draft: 0,
      sent: 0,
      open: 0,
      revised: 0,
      declined: 0,
      accepted: 0,
    },
    estimates: {
      total: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    },
    contacts: {
      total: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];
  const STATUS_COLORS = {
    unpaid: "#EF4444",
    partiallypaid: "#F59E0B",
    overdue: "#3B82F6",
    paid: "#10B981",
    draft: "#9CA3AF",
    sent: "#3B82F6",
    open: "#3B82F6",
    revised: "#8B5CF6",
    declined: "#EF4444",
    accepted: "#10B981",
    pending: "#F59E0B",
    approved: "#10B981",
    rejected: "#EF4444",
    expired: "#6B7280",
    progress: "#3B82F6",
    onHold: "#F59E0B",
    cancelled: "#EF4444",
    finished: "#10B981",
  };

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

  useEffect(() => {
    const token = getClientToken();
    if (!token) {
      navigate("/client/login");
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const config = createAxiosConfig();

      // Fetch all data in parallel
      const requests = [
        axios.get(`${API_BASE_URL}/client/invoices`, config),
        axios.get(`${API_BASE_URL}/client/payments`, config),
        axios.get(`${API_BASE_URL}/client/projects`, config),
        axios.get(`${API_BASE_URL}/client/proposals`, config),
        axios.get(`${API_BASE_URL}/client/estimates`, config),
        axios.get(`${API_BASE_URL}/client/contacts`, config),
      ];

      const responses = await Promise.allSettled(requests);

      // Process invoices data
      if (responses[0].status === "fulfilled") {
        const invoicesData = responses[0].value.data.data || [];
        const totalInvoices = invoicesData.length;
        const paidAmount = invoicesData
          .filter((i) => i.status === "Paid" || i.status === "Partiallypaid")
          .reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0);
        const totalAmount = invoicesData.reduce(
          (sum, invoice) => sum + (invoice.total || 0),
          0
        );
        const dueAmount = totalAmount - paidAmount;

        setStats((prev) => ({
          ...prev,
          invoices: {
            ...prev.invoices,
            total: totalInvoices,
            unpaid: invoicesData.filter((i) => i.status === "Unpaid").length,
            partiallypaid: invoicesData.filter(
              (i) => i.status === "Partiallypaid"
            ).length,
            overdue: invoicesData.filter((i) => i.status === "Overdue").length,
            paid: invoicesData.filter((i) => i.status === "Paid").length,
            totalAmount,
            paidAmount,
            dueAmount,
          },
        }));

        // Add invoices to recent activity
        const recentInvoices = invoicesData
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map((invoice) => ({
            type: "invoice",
            title:
              invoice.invoiceNumber ||
              `INV-${invoice._id.slice(-6).toUpperCase()}`,
            amount: invoice.total,
            status: invoice.status,
            date: invoice.invoiceDate || invoice.createdAt,
          }));

        setRecentActivity((prev) => [...prev, ...recentInvoices]);
      }

      // Process payments data
      if (responses[1].status === "fulfilled") {
        const paymentsData = responses[1].value.data.data || [];
        const totalPayments = paymentsData.length;
        const totalPaymentAmount = paymentsData.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );

        setStats((prev) => ({
          ...prev,
          payments: {
            ...prev.payments,
            total: totalPayments,
            totalAmount: totalPaymentAmount,
            recent: paymentsData.slice(0, 5),
          },
        }));

        // Add payments to recent activity
        const recentPayments = paymentsData.slice(0, 3).map((payment) => ({
          type: "payment",
          title: `Payment for ${payment.invoiceNumber}`,
          amount: payment.amount,
          status: "completed",
          date: payment.paymentDate || payment.createdAt,
        }));

        setRecentActivity((prev) => [...prev, ...recentPayments]);
      }

      // Process projects data - FIXED
      if (responses[2].status === "fulfilled") {
        let projectsData = [];
        // Handle different response structures
        if (Array.isArray(responses[2].value.data.data)) {
          projectsData = responses[2].value.data.data;
        } else if (Array.isArray(responses[2].value.data.projects)) {
          projectsData = responses[2].value.data.projects;
        }

        setStats((prev) => ({
          ...prev,
          projects: {
            total: projectsData.length,
            progress: projectsData.filter(
              (p) => p.status === "Progress" || p.status === "progress"
            ).length,
            onHold: projectsData.filter(
              (p) => p.status === "On Hold" || p.status === "onHold"
            ).length,
            cancelled: projectsData.filter(
              (p) => p.status === "Cancelled" || p.status === "cancelled"
            ).length,
            finished: projectsData.filter(
              (p) => p.status === "Finished" || p.status === "finished"
            ).length,
          },
        }));

        // Add projects to recent activity
        const recentProjects = projectsData
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          )
          .slice(0, 2)
          .map((project) => ({
            type: "project",
            title: project.name,
            status: project.status,
            date: project.createdAt || project.date,
          }));

        setRecentActivity((prev) => [...prev, ...recentProjects]);
      }

      // Process proposals data - FIXED
      if (responses[3].status === "fulfilled") {
        let proposalsData = [];
        // Handle different response structures
        if (Array.isArray(responses[3].value.data.data)) {
          proposalsData = responses[3].value.data.data;
        } else if (Array.isArray(responses[3].value.data.proposals)) {
          proposalsData = responses[3].value.data.proposals;
        }

        setStats((prev) => ({
          ...prev,
          proposals: {
            total: proposalsData.length,
            draft: proposalsData.filter(
              (p) => p.status === "Draft" || p.status === "draft"
            ).length,
            sent: proposalsData.filter(
              (p) => p.status === "Sent" || p.status === "sent"
            ).length,
            open: proposalsData.filter(
              (p) => p.status === "Open" || p.status === "open"
            ).length,
            revised: proposalsData.filter(
              (p) => p.status === "Revised" || p.status === "revised"
            ).length,
            declined: proposalsData.filter(
              (p) => p.status === "Declined" || p.status === "declined"
            ).length,
            accepted: proposalsData.filter(
              (p) => p.status === "Accepted" || p.status === "accepted"
            ).length,
          },
        }));
      }

      // Process estimates data - FIXED
      if (responses[4].status === "fulfilled") {
        let estimatesData = [];
        // Handle different response structures
        if (Array.isArray(responses[4].value.data.data)) {
          estimatesData = responses[4].value.data.data;
        } else if (Array.isArray(responses[4].value.data.estimates)) {
          estimatesData = responses[4].value.data.estimates;
        }

        setStats((prev) => ({
          ...prev,
          estimates: {
            total: estimatesData.length,
            draft: estimatesData.filter(
              (e) => e.status === "Draft" || e.status === "draft"
            ).length,
            pending: estimatesData.filter(
              (e) => e.status === "Pending" || e.status === "pending"
            ).length,
            approved: estimatesData.filter(
              (e) => e.status === "Approved" || e.status === "approved"
            ).length,
            rejected: estimatesData.filter(
              (e) => e.status === "Rejected" || e.status === "rejected"
            ).length,
            expired: estimatesData.filter(
              (e) => e.status === "Expired" || e.status === "expired"
            ).length,
          },
        }));
      }

      // Process contacts data - FIXED
      if (responses[5].status === "fulfilled") {
        let contactsData = [];
        // Handle different response structures
        if (Array.isArray(responses[5].value.data.data)) {
          contactsData = responses[5].value.data.data;
        } else if (Array.isArray(responses[5].value.data.contacts)) {
          contactsData = responses[5].value.data.contacts;
        }

        setStats((prev) => ({
          ...prev,
          contacts: {
            total: contactsData.length,
          },
        }));

        // Add contacts to recent activity (if they have a creation date)
        const recentContacts = contactsData
          .filter((contact) => contact.createdAt || contact.date)
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          )
          .slice(0, 2)
          .map((contact) => ({
            type: "contact",
            title:
              contact.subject ||
              `Contact ${contact._id.slice(-6).toUpperCase()}`,
            status: "active",
            date: contact.createdAt || contact.date,
          }));

        setRecentActivity((prev) => [...prev, ...recentContacts]);
      }

      // Sort recent activity by date
      setRecentActivity((prev) =>
        prev.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
      );
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_client_token");
        navigate("/client/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return "0.00%";
    return ((value / total) * 100).toFixed(2) + "%";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Prepare data for charts
  const invoiceChartData = [
    {
      name: "Unpaid",
      value: stats.invoices.unpaid,
      color: STATUS_COLORS.unpaid,
    },
    {
      name: "Partially Paid",
      value: stats.invoices.partiallypaid,
      color: STATUS_COLORS.partiallypaid,
    },
    {
      name: "Overdue",
      value: stats.invoices.overdue,
      color: STATUS_COLORS.overdue,
    },
    { name: "Paid", value: stats.invoices.paid, color: STATUS_COLORS.paid },
  ];

  const projectChartData = [
    {
      name: "In Progress",
      value: stats.projects.progress,
      color: STATUS_COLORS.progress,
    },
    {
      name: "On Hold",
      value: stats.projects.onHold,
      color: STATUS_COLORS.onHold,
    },
    {
      name: "Cancelled",
      value: stats.projects.cancelled,
      color: STATUS_COLORS.cancelled,
    },
    {
      name: "Finished",
      value: stats.projects.finished,
      color: STATUS_COLORS.finished,
    },
  ];

  const overviewData = [
    { name: "Invoices", value: stats.invoices.total, fill: "#10B981" },
    { name: "Payments", value: stats.payments.total, fill: "#3B82F6" },
    { name: "Projects", value: stats.projects.total, fill: "#8B5CF6" },
    { name: "Proposals", value: stats.proposals.total, fill: "#F59E0B" },
    { name: "Estimates", value: stats.estimates.total, fill: "#EF4444" },
    { name: "Contacts", value: stats.contacts.total, fill: "#9CA3AF" },
  ];

  const paymentHistoryData = stats.payments.recent.map((payment) => ({
    name: payment.invoiceNumber,
    amount: payment.amount,
    date: new Date(
      payment.paymentDate || payment.createdAt
    ).toLocaleDateString(),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Client Home
            </h1>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaSyncAlt className="mr-2" />
            Refresh Data
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Invoices Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <FaFileInvoiceDollar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Invoices</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.invoices.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formatCurrency(stats.invoices.dueAmount)} due
            </div>
          </div>

          {/* Payments Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <FaMoneyCheckAlt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Payments</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.payments.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formatCurrency(stats.payments.totalAmount)} total
            </div>
          </div>

          {/* Projects Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                <FaProjectDiagram className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Active Projects</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.projects.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.projects.progress} in progress
            </div>
          </div>

          {/* Proposals Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                <FaFileContract className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Proposals</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.proposals.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.proposals.accepted} accepted
            </div>
          </div>

          {/* Estimates Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <FaFileAlt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Estimates</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.estimates.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.estimates.approved} approved
            </div>
          </div>

          {/* Contacts Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100 text-gray-600 mr-3">
                <FaUsers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Contacts</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.contacts.total)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">Active contacts</div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Invoice Status Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Invoice Status
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {invoiceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {invoiceChartData.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatNumber(item.value)}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {calculatePercentage(item.value, stats.invoices.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Payments
            </h2>
            {paymentHistoryData.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), "Amount"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        name="Payment Amount"
                        fill="#3B82F6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {paymentHistoryData.slice(0, 3).map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-600">{payment.name}</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-gray-500 text-xs ml-2">
                          {payment.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No payment history available
              </div>
            )}
          </div>
        </div>

        {/* Projects and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Projects Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Projects Overview
            </h2>
            {stats.projects.total > 0 ? (
              <>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {projectChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {projectChartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatNumber(item.value)}
                        </span>
                        <span className="text-gray-500 text-xs ml-2">
                          {calculatePercentage(
                            item.value,
                            stats.projects.total
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No projects available
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Activity
            </h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        activity.type === "invoice"
                          ? "bg-green-100 text-green-600"
                          : activity.type === "payment"
                          ? "bg-blue-100 text-blue-600"
                          : activity.type === "contact"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {activity.type === "invoice" ? (
                        <FaFileInvoiceDollar className="h-4 w-4" />
                      ) : activity.type === "payment" ? (
                        <FaMoneyCheckAlt className="h-4 w-4" />
                      ) : activity.type === "contact" ? (
                        <FaUsers className="h-4 w-4" />
                      ) : (
                        <FaProjectDiagram className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {activity.type} •{" "}
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      {activity.amount && (
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        activity.status === "paid" ||
                        activity.status === "completed" ||
                        activity.status === "finished" ||
                        activity.status === "active"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "unpaid" ||
                            activity.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : activity.status === "progress"
                          ? "bg-blue-100 text-blue-800"
                          : activity.status === "partiallypaid"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Portal Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count">
                  {overviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
