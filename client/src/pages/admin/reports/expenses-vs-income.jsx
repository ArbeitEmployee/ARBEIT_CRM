/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
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
} from "recharts";
import { FaSyncAlt } from "react-icons/fa";

const ExpensesVsIncome = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch all data from APIs
  const fetchAllData = async () => {
    setLoading(true);
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

      // Fetch payments using the new payment API
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

      // Extract available years from expenses
      const expenseYears = [
        ...new Set(
          expensesResponse.data.expenses.map((expense) => {
            const dateParts = expense.date.split("-");
            if (dateParts.length === 3) {
              return parseInt(dateParts[2]); // Assuming format DD-MM-YYYY
            }
            return new Date().getFullYear();
          })
        ),
      ];

      // Extract available years from invoices
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

      // Extract available years from payments
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

      // Combine all years and remove duplicates
      const allYears = [
        ...new Set([...expenseYears, ...invoiceYears, ...paymentYears]),
      ].sort((a, b) => b - a);

      setAvailableYears(
        allYears.length > 0 ? allYears : [new Date().getFullYear()]
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setExpenses([]);
      setInvoices([]);
      setPayments([]);
      setAvailableYears([new Date().getFullYear()]);
    } finally {
      setLoading(false);
    }
  };

  // Process data to combine expenses and income for selected year
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

    // Initialize monthly data structure
    const monthlyData = months.map((month) => ({
      month,
      expenses: 0,
      income: 0,
    }));

    // Process expenses for selected year
    expenses.forEach((expense) => {
      const dateParts = expense.date.split("-");
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[1]) - 1; // 0-indexed
        const expenseYear = parseInt(dateParts[2]);

        if (expenseYear === selectedYear && month >= 0 && month < 12) {
          monthlyData[month].expenses += expense.amount;
        }
      }
    });

    // Process income for selected year
    // First try to use payments data if available
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
      // Fallback to invoice data
      invoices.forEach((invoice) => {
        if (invoice.status === "Paid" || invoice.status === "Partiallypaid") {
          const invoiceDate = new Date(
            invoice.updatedAt || invoice.invoiceDate || invoice.createdAt
          );
          const invoiceYear = invoiceDate.getFullYear();
          const invoiceMonth = invoiceDate.getMonth();

          if (invoiceYear === selectedYear) {
            // Use paidAmount if available, otherwise use total for paid invoices
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
    fetchAllData();
  }, []);

  useEffect(() => {
    if (expenses.length > 0 || invoices.length > 0 || payments.length > 0) {
      processCombinedData();
    }
  }, [expenses, invoices, payments, selectedYear]);

  // Calculate totals
  const totalExpenses = combinedData.reduce(
    (sum, item) => sum + item.expenses,
    0
  );
  const totalIncome = combinedData.reduce((sum, item) => sum + item.income, 0);
  const netProfit = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-slate-500">
          Loading expenses and income data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Dashboard / Reports / Expenses vs Income
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Expenses vs Income Report
          </h1>
        </div>

        {/* Year Selection */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Expenses vs Income Report
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <label
                htmlFor="year-select"
                className="mr-2 text-sm font-medium text-slate-600"
              >
                Select Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              <FaSyncAlt className="text-xs" /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Income ({selectedYear})
                </p>
                <p className="text-3xl font-extrabold tabular-nums text-slate-900">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500">
                <svg
                  className="w-6 h-6 text-white"
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

          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Expenses ({selectedYear})
                </p>
                <p className="text-3xl font-extrabold tabular-nums text-slate-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500">
                <svg
                  className="w-6 h-6 text-white"
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

          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Net Profit/Loss ({selectedYear})
                </p>
                <p
                  className={`text-3xl font-extrabold tabular-nums ${
                    netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  netProfit >= 0 ? "bg-green-500" : "bg-red-500"
                }`}
              >
              <svg
                className="w-6 h-6 text-white"
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

        {/* Chart Section */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Overview
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Expenses vs Income ({selectedYear})
          </h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Amount is displayed in your base currency - Only use this report if
            you are using 1 currency for payments and expenses.
          </p>

          <div className="h-96">
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
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
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
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Details
          </p>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Monthly Breakdown ({selectedYear})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 sm:px-6 py-3 text-left">Month</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Income</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Expenses</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {combinedData.map((data, index) => {
                  const profitLoss = data.income - data.expenses;
                  return (
                    <tr key={index} className="hover:bg-white/70">
                      <td className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-700">
                        {data.month}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right text-sm tabular-nums text-green-600">
                        {formatCurrency(data.income)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right text-sm tabular-nums text-red-600">
                        {formatCurrency(data.expenses)}
                      </td>
                      <td
                        className={`px-4 sm:px-6 py-3 text-right text-sm font-bold tabular-nums ${
                          profitLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(profitLoss)}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-100/80 font-bold">
                  <td className="px-4 sm:px-6 py-3 text-sm text-slate-700">
                    Total
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-right text-sm tabular-nums text-green-600">
                    {formatCurrency(totalIncome)}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-right text-sm tabular-nums text-red-600">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td
                    className={`px-4 sm:px-6 py-3 text-right text-sm tabular-nums ${
                      netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Insight: Income vs Expenses Trend */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Trend
          </p>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Income vs Expenses Trend ({selectedYear})
          </h2>

          <div className="h-96">
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
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
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
                />
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
                  stroke="#22c55e"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
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

export default ExpensesVsIncome;
