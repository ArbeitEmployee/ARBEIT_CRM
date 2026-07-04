/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";
import {
  FiRefreshCw,
  FiUsers,
  FiFileText,
  FiFolder,
  FiClipboard,
  FiFile,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
} from "react-icons/fi";
import { MdOutlineLeaderboard } from "react-icons/md";
import { formatBDT, compactBDT } from "../../utils/currency";
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
  Area,
  AreaChart,
} from "recharts";

/* ---------- Small presentational helpers ---------- */

// Animated count-up number (respects reduced motion)
const CountUp = ({ value, prefix = "", format = (v) => v.toLocaleString() }) => {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${format(Math.round(v))}`);
  const [display, setDisplay] = useState(`${prefix}${format(0)}`);

  useEffect(() => {
    if (reduce) {
      setDisplay(`${prefix}${format(Math.round(value || 0))}`);
      return;
    }
    const controls = animate(mv, value || 0, { duration: 1.1, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, reduce]);

  return <span className="tabular-nums">{display}</span>;
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const StatCard = ({ icon, label, value, accent }) => (
  <motion.div
    variants={cardVariants}
    className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.10)] backdrop-blur"
  >
    <div
      className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
      style={{ background: accent }}
    />
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900 md:text-[2.25rem] md:leading-none">
          <CountUp value={value} />
        </p>
      </div>
    </div>
  </motion.div>
);

// Glass chart / section wrapper
const Panel = ({ title, subtitle, action, children, className = "" }) => (
  <div
    className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur sm:p-6 ${className}`}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        {subtitle && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            {subtitle}
          </p>
        )}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// Legend/list row under pie charts
const LegendRow = ({ items, total, formatNumber, calculatePercentage }) => (
  <div className="space-y-2">
    {items.map((item, index) => (
      <div key={index} className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-600">{item.name}</span>
        </div>
        <div className="text-right">
          <span className="font-semibold tabular-nums text-slate-800">
            {formatNumber(item.value)}
          </span>
          <span className="ml-2 text-xs text-slate-400 tabular-nums">
            {calculatePercentage(item.value, total)}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const GlassTooltip = ({ active, payload, label, valueFormatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {label && (
        <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-600">
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: p.color || p.fill }}
          />
          {p.name}:{" "}
          <span className="font-semibold text-slate-900">
            {valueFormatter ? valueFormatter(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

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
          (expensesResponse.data.expenses || []).map((expense) => {
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
          (invoicesResponse.data.data || []).map((invoice) => {
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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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

  const formatCurrency = (amount) => formatBDT(amount);

  const compactCurrency = (amount) => compactBDT(amount);

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
    { name: "Leads", value: stats.leads.total, fill: "#0ea5e9" },
    { name: "Invoices", value: stats.invoices.total, fill: "#22c55e" },
    { name: "Projects", value: stats.projects.total, fill: "#8b5cf6" },
    { name: "Proposals", value: stats.proposals.total, fill: "#f59e0b" },
    { name: "Estimates", value: stats.estimates.total, fill: "#ef4444" },
  ];

  const estimateBarData = [
    { name: "Draft", value: stats.estimates.draft },
    { name: "Pending", value: stats.estimates.pending },
    { name: "Approved", value: stats.estimates.approved },
    { name: "Rejected", value: stats.estimates.rejected },
    { name: "Expired", value: stats.estimates.expired },
  ];

  const proposalLineData = [
    { name: "Draft", value: stats.proposals.draft },
    { name: "Sent", value: stats.proposals.sent },
    { name: "Open", value: stats.proposals.open },
    { name: "Revised", value: stats.proposals.revised },
    { name: "Declined", value: stats.proposals.declined },
    { name: "Accepted", value: stats.proposals.accepted },
  ];

  const statCards = [
    {
      label: "Total Leads",
      value: stats.leads.total,
      icon: <MdOutlineLeaderboard className="h-6 w-6" />,
      accent: "#0ea5e9",
    },
    {
      label: "Total Invoices",
      value: stats.invoices.total,
      icon: <FiFileText className="h-6 w-6" />,
      accent: "#22c55e",
    },
    {
      label: "Total Projects",
      value: stats.projects.total,
      icon: <FiFolder className="h-6 w-6" />,
      accent: "#8b5cf6",
    },
    {
      label: "Proposals",
      value: stats.proposals.total,
      icon: <FiClipboard className="h-6 w-6" />,
      accent: "#f59e0b",
    },
    {
      label: "Estimates",
      value: stats.estimates.total,
      icon: <FiFile className="h-6 w-6" />,
      accent: "#ef4444",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="mb-6 h-28 w-full animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-slate-200/70"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-3xl bg-slate-200/70"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto w-full space-y-6">
        {/* Hero band */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)] sm:p-8"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-16 left-24 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-300/80">
                ARBEIT CRM
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Overview of leads, sales, projects and finances.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Net ({selectedYear})
                </p>
                <p
                  className={`text-2xl font-extrabold tabular-nums ${
                    netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {compactCurrency(netProfit)}
                </p>
              </div>
              <button
                onClick={() => {
                  fetchDashboardData();
                  fetchExpensesAndIncomeData();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI cards */}
        <motion.div
          variants={{
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </motion.div>

        {/* Overview bar */}
        <Panel subtitle="Pipeline" title="Overview">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,.1)" }}
                  content={<GlassTooltip />}
                />
                <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                  {overviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Invoice / Estimate / Proposal */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Invoice Overview */}
          <Panel subtitle="Billing" title="Invoice Overview">
            <div className="mb-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {invoiceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow
              items={invoiceChartData}
              total={stats.invoices.total}
              formatNumber={formatNumber}
              calculatePercentage={calculatePercentage}
            />
          </Panel>

          {/* Estimate Overview */}
          <Panel subtitle="Sales" title="Estimate Overview">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={estimateBarData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,.1)" }}
                    content={<GlassTooltip />}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <LegendRow
                items={estimateBarData.map((d) => ({
                  ...d,
                  color: "#8b5cf6",
                }))}
                total={stats.estimates.total}
                formatNumber={formatNumber}
                calculatePercentage={calculatePercentage}
              />
            </div>
          </Panel>

          {/* Proposal Overview */}
          <Panel subtitle="Sales" title="Proposal Overview">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={proposalLineData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="propGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<GlassTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill="url(#propGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <LegendRow
                items={proposalLineData.map((d) => ({
                  ...d,
                  color: "#0ea5e9",
                }))}
                total={stats.proposals.total}
                formatNumber={formatNumber}
                calculatePercentage={calculatePercentage}
              />
            </div>
          </Panel>
        </div>

        {/* Leads & Projects */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel subtitle="Funnel" title="Leads Overview">
            <div className="mb-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {leadsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow
              items={leadsChartData}
              total={stats.leads.total}
              formatNumber={formatNumber}
              calculatePercentage={calculatePercentage}
            />
          </Panel>

          <Panel subtitle="Delivery" title="Projects Overview">
            <div className="mb-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow
              items={projectChartData}
              total={stats.projects.total}
              formatNumber={formatNumber}
              calculatePercentage={calculatePercentage}
            />
          </Panel>
        </div>

        {/* Expenses vs Income */}
        <Panel
          subtitle="Finance"
          title={`Expenses vs Income (${selectedYear})`}
          action={
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="glass-select text-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          }
        >
          {/* Summary tiles */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-500">
                    Total Income
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-sky-700">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-500">
                    Total Expenses
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-rose-700">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white">
                  <FiTrendingDown className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                netProfit >= 0
                  ? "border-emerald-100 bg-emerald-50/70"
                  : "border-rose-100 bg-rose-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
                      netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    Net Profit / Loss
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold tabular-nums ${
                      netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                    netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                >
                  <FiDollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="mb-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => compactCurrency(v)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,.1)" }}
                  content={<GlassTooltip valueFormatter={formatCurrency} />}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend line */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => compactCurrency(v)}
                />
                <Tooltip content={<GlassTooltip valueFormatter={formatCurrency} />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;
