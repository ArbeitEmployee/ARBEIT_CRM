/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [stats, setStats] = useState({
    invoices: {
      total: 0,
      draft: 0,
      notSent: 0,
      unpaid: 0,
      partiallyPaid: 0,
      overdue: 0,
      paid: 0,
      totalAmount: 0,
      pastDueAmount: 0,
      paidAmount: 0,
    },
    estimates: {
      total: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
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
    leads: {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      customer: 0,
      lost: 0,
    },
    projects: {
      total: 0,
      progress: 0,
      onHold: 0,
      cancelled: 0,
      finished: 0,
    },
  });

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
    draft: "#9CA3AF",
    notSent: "#8884d8",
    unpaid: "#EF4444",
    partiallyPaid: "#F59E0B",
    overdue: "#3B82F6",
    paid: "#10B981",
    sent: "#3B82F6",
    expired: "#6B7280",
    declined: "#EF4444",
    accepted: "#10B981",
    open: "#3B82F6",
    revised: "#8B5CF6",
    new: "#3B82F6",
    contacted: "#8B5CF6",
    qualified: "#10B981",
    proposal: "#F59E0B",
    customer: "#10B981",
    lost: "#EF4444",
    progress: "#3B82F6",
    onHold: "#F59E0B",
    cancelled: "#EF4444",
    finished: "#10B981",
  };

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

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/admin/login");
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
        axios.get(`${API_BASE_URL}/admin/invoices`, config),
        axios.get(`${API_BASE_URL}/admin/proposals`, config),
        axios.get(`${API_BASE_URL}/admin/estimates`, config),
        axios.get(`${API_BASE_URL}/leads`, config),
        axios.get(`${API_BASE_URL}/projects`, config),
      ];

      const responses = await Promise.allSettled(requests);

      // Process invoices data
      if (responses[0].status === "fulfilled") {
        const invoicesData =
          responses[0].value.data.data || responses[0].value.data || [];
        const totalInvoices = invoicesData.length;

        setStats((prev) => ({
          ...prev,
          invoices: {
            ...prev.invoices,
            total: totalInvoices,
            draft: invoicesData.filter((i) => i.status === "Draft").length,
            notSent: invoicesData.filter((i) => i.status === "Not Sent").length,
            unpaid: invoicesData.filter((i) => i.status === "Unpaid").length,
            partiallyPaid: invoicesData.filter(
              (i) => i.status === "Partiallypaid"
            ).length,
            overdue: invoicesData.filter((i) => i.status === "Overdue").length,
            paid: invoicesData.filter((i) => i.status === "Paid").length,
          },
        }));
      } else if (responses[0].reason?.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
        return;
      }

      // Process proposals data
      if (responses[1].status === "fulfilled") {
        const proposalsData =
          responses[1].value.data.data || responses[1].value.data || [];

        setStats((prev) => ({
          ...prev,
          proposals: {
            ...prev.proposals,
            total: proposalsData.length,
            draft: proposalsData.filter((p) => p.status === "Draft").length,
            sent: proposalsData.filter((p) => p.status === "Sent").length,
            open: proposalsData.filter((p) => p.status === "Open").length,
            revised: proposalsData.filter((p) => p.status === "Revised").length,
            declined: proposalsData.filter((p) => p.status === "Declined")
              .length,
            accepted: proposalsData.filter((p) => p.status === "Accepted")
              .length,
          },
        }));
      } else if (responses[1].reason?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
        return;
      }

      // Process estimates data
      if (responses[2].status === "fulfilled") {
        const estimatesData =
          responses[2].value.data.data || responses[2].value.data || [];

        setStats((prev) => ({
          ...prev,
          estimates: {
            ...prev.estimates,
            total: estimatesData.length,
            draft: estimatesData.filter((e) => e.status === "Draft").length,
            pending: estimatesData.filter((e) => e.status === "Pending").length,
            approved: estimatesData.filter((e) => e.status === "Approved")
              .length,
            rejected: estimatesData.filter((e) => e.status === "Rejected")
              .length,
            expired: estimatesData.filter((e) => e.status === "Expired").length,
          },
        }));
      } else if (responses[2].reason?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
        return;
      }

      // Process leads data
      if (responses[3].status === "fulfilled") {
        const leadsData = responses[3].value.data.leads || [];
        const leadsStats = responses[3].value.data.stats || {
          totalLeads: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          proposal: 0,
          customer: 0,
          lost: 0,
        };

        setStats((prev) => ({
          ...prev,
          leads: {
            total: leadsStats.totalLeads || leadsData.length,
            new:
              leadsStats.new ||
              leadsData.filter((l) => l.status === "New").length,
            contacted:
              leadsStats.contacted ||
              leadsData.filter((l) => l.status === "Contacted").length,
            qualified:
              leadsStats.qualified ||
              leadsData.filter((l) => l.status === "Qualified").length,
            proposal:
              leadsStats.proposal ||
              leadsData.filter((l) => l.status === "Proposal").length,
            customer:
              leadsStats.customer ||
              leadsData.filter((l) => l.status === "Customer").length,
            lost:
              leadsStats.lost ||
              leadsData.filter((l) => l.status === "Lost").length,
          },
        }));
      } else if (responses[3].reason?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
        return;
      }

      // Process projects data
      if (responses[4].status === "fulfilled") {
        const projectsData = responses[4].value.data.projects || [];

        setStats((prev) => ({
          ...prev,
          projects: {
            total: projectsData.length,
            progress: projectsData.filter((p) => p.status === "Progress")
              .length,
            onHold: projectsData.filter((p) => p.status === "On Hold").length,
            cancelled: projectsData.filter((p) => p.status === "Cancelled")
              .length,
            finished: projectsData.filter((p) => p.status === "Finished")
              .length,
          },
        }));
      } else if (responses[4].reason?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
        return;
      }
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesAndIncomeData = async () => {
    try {
      const config = createAxiosConfig();

      // Fetch expenses
      const expensesResponse = await axios.get(
        `${API_BASE_URL}/expenses`,
        config
      );
      setExpenses(expensesResponse.data.expenses || []);

      // Fetch invoices
      const invoicesResponse = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );
      setInvoices(
        invoicesResponse.data.data || invoicesResponse.data.invoices || []
      );

      // Fetch payments
      try {
        const paymentsResponse = await axios.get(
          `${API_BASE_URL}/admin/payments`,
          config
        );
        setPayments(
          paymentsResponse.data.data || paymentsResponse.data.payments || []
        );
      } catch (error) {
        console.log("Payments API not available, using invoice data instead");
        setPayments([]);
      }

      // Extract available years
      const expenseYears = [
        ...new Set(
          expensesResponse.data.expenses.map((expense) => {
            const dateParts = expense.date.split("-");
            if (dateParts.length === 3) {
              return parseInt(dateParts[2]);
            }
            return new Date().getFullYear();
          })
        ),
      ];

      const invoiceYears = [
        ...new Set(
          invoicesResponse.data.data.map((invoice) => {
            const invoiceDate = new Date(
              invoice.invoiceDate || invoice.createdAt
            );
            return invoiceDate.getFullYear();
          })
        ),
      ];

      const paymentYears =
        payments.length > 0
          ? [
              ...new Set(
                payments.map((payment) => {
                  const paymentDate = new Date(
                    payment.paymentDate || payment.date
                  );
                  return paymentDate.getFullYear();
                })
              ),
            ]
          : [];

      const allYears = [
        ...new Set([...expenseYears, ...invoiceYears, ...paymentYears]),
      ].sort((a, b) => b - a);

      setAvailableYears(
        allYears.length > 0 ? allYears : [new Date().getFullYear()]
      );
    } catch (error) {
      console.error("Error fetching expenses/income data:", error);
      setExpenses([]);
      setInvoices([]);
      setPayments([]);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const processCombinedData = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyData = months.map((month) => ({
      month,
      expenses: 0,
      income: 0,
    }));

    // Process expenses
    expenses.forEach((expense) => {
      const dateParts = expense.date.split("-");
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[1]) - 1;
        const expenseYear = parseInt(dateParts[2]);

        if (expenseYear === selectedYear && month >= 0 && month < 12) {
          monthlyData[month].expenses += expense.amount;
        }
      }
    });

    // Process income
    if (payments.length > 0) {
      payments.forEach((payment) => {
        const paymentDate = new Date(payment.paymentDate || payment.date);
        const paymentYear = paymentDate.getFullYear();
        const paymentMonth = paymentDate.getMonth();

        if (paymentYear === selectedYear) {
          monthlyData[paymentMonth].income += payment.amount || 0;
        }
      });
    } else {
      invoices.forEach((invoice) => {
        if (invoice.status === "Paid" || invoice.status === "Partiallypaid") {
          const invoiceDate = new Date(
            invoice.updatedAt || invoice.invoiceDate || invoice.createdAt
          );
          const invoiceYear = invoiceDate.getFullYear();
          const invoiceMonth = invoiceDate.getMonth();

          if (invoiceYear === selectedYear) {
            const amount =
              invoice.status === "Partiallypaid"
                ? invoice.paidAmount || 0
                : invoice.total || 0;

            monthlyData[invoiceMonth].income += amount;
          }
        }
      });
    }

    setCombinedData(monthlyData);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/admin/login");
    } else {
      fetchDashboardData();
      fetchExpensesAndIncomeData();
    }
  }, [navigate]);

  useEffect(() => {
    if (expenses.length > 0 || invoices.length > 0 || payments.length > 0) {
      processCombinedData();
    }
  }, [expenses, invoices, payments, selectedYear]);

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

  // Calculate totals for expenses vs income
  const totalExpenses = combinedData.reduce(
    (sum, item) => sum + item.expenses,
    0
  );
  const totalIncome = combinedData.reduce((sum, item) => sum + item.income, 0);
  const netProfit = totalIncome - totalExpenses;

  // Prepare data for charts
  const invoiceChartData = [
    { name: "Draft", value: stats.invoices.draft, color: STATUS_COLORS.draft },
    {
      name: "Not Sent",
      value: stats.invoices.notSent,
      color: STATUS_COLORS.notSent,
    },
    {
      name: "Unpaid",
      value: stats.invoices.unpaid,
      color: STATUS_COLORS.unpaid,
    },
    {
      name: "Partially Paid",
      value: stats.invoices.partiallyPaid,
      color: STATUS_COLORS.partiallyPaid,
    },
    {
      name: "Overdue",
      value: stats.invoices.overdue,
      color: STATUS_COLORS.overdue,
    },
    { name: "Paid", value: stats.invoices.paid, color: STATUS_COLORS.paid },
  ];

  const leadsChartData = [
    { name: "New", value: stats.leads.new, color: STATUS_COLORS.new },
    {
      name: "Contacted",
      value: stats.leads.contacted,
      color: STATUS_COLORS.contacted,
    },
    {
      name: "Qualified",
      value: stats.leads.qualified,
      color: STATUS_COLORS.qualified,
    },
    {
      name: "Proposal",
      value: stats.leads.proposal,
      color: STATUS_COLORS.proposal,
    },
    {
      name: "Customer",
      value: stats.leads.customer,
      color: STATUS_COLORS.customer,
    },
    { name: "Lost", value: stats.leads.lost, color: STATUS_COLORS.lost },
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
    { name: "Leads", value: stats.leads.total, fill: "#3B82F6" },
    { name: "Invoices", value: stats.invoices.total, fill: "#10B981" },
    { name: "Projects", value: stats.projects.total, fill: "#8B5CF6" },
    { name: "Proposals", value: stats.proposals.total, fill: "#F59E0B" },
    { name: "Estimates", value: stats.estimates.total, fill: "#EF4444" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Leads Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Leads</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.leads.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Invoices Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Invoices</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.invoices.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Projects Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Projects</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.projects.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Proposals Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Proposals</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.proposals.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Estimates Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Estimates</h2>
                <p className="text-lg font-bold text-gray-800">
                  {formatNumber(stats.estimates.total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
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

        {/* Invoice, Estimate, and Proposal Overviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Invoice Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Invoice Overview
            </h2>
            <div className="h-64 mb-4">
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
            <div className="space-y-2">
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

          {/* Estimate Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Estimate Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Draft</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.estimates.draft)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.estimates.draft,
                      stats.estimates.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Pending</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.estimates.pending)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.estimates.pending,
                      stats.estimates.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Approved</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.estimates.approved)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.estimates.approved,
                      stats.estimates.total
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Rejected</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.estimates.rejected)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.estimates.rejected,
                      stats.estimates.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Expired</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.estimates.expired)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.estimates.expired,
                      stats.estimates.total
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Draft", value: stats.estimates.draft },
                    { name: "Pending", value: stats.estimates.pending },
                    { name: "Approved", value: stats.estimates.approved },
                    { name: "Rejected", value: stats.estimates.rejected },
                    { name: "Expired", value: stats.estimates.expired },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Proposal Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Proposal Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Draft</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.draft)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.draft,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Sent</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.sent)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.sent,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Open</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.open)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.open,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Revised</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.revised)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.revised,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Declined</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.declined)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.declined,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Accepted</span>
                <div className="text-right">
                  <span className="font-medium">
                    {formatNumber(stats.proposals.accepted)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(
                      stats.proposals.accepted,
                      stats.proposals.total
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: "Draft", value: stats.proposals.draft },
                    { name: "Sent", value: stats.proposals.sent },
                    { name: "Open", value: stats.proposals.open },
                    { name: "Revised", value: stats.proposals.revised },
                    { name: "Declined", value: stats.proposals.declined },
                    { name: "Accepted", value: stats.proposals.accepted },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leads and Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Leads Overview
            </h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {leadsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {leadsChartData.map((item, index) => (
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
                      {calculatePercentage(item.value, stats.leads.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Projects Overview
            </h2>
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
                      {calculatePercentage(item.value, stats.projects.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Expenses vs Income Overview */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Expenses vs Income ({selectedYear})
            </h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded px-3 py-1 text-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-500 text-sm">Total Income</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-500 text-sm">Total Expenses</p>
                  <p className="text-xl font-bold text-red-700">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                netProfit >= 0
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm ${
                      netProfit >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    Net Profit/Loss
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      netProfit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-full ${
                    netProfit >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {netProfit >= 0 ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#4CAF50" />
                <Bar dataKey="expenses" name="Expenses" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Line Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#4CAF50"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#F44336"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
