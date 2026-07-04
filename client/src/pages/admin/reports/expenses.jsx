/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
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
} from "recharts";
import { formatBDT } from "../../../utils/currency";

const ExpensesReport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [expenses, setExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [billableData, setBillableData] = useState([]);
  const [nonBillableData, setNonBillableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  // Get auth token from localStorage (using the correct key "crm_token")
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

  // Fetch expenses from API
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/expenses`, config);
      setExpenses(data.expenses || []);

      // Extract available years from expenses
      const years = [
        ...new Set(
          data.expenses.map((expense) => {
            const dateParts = expense.date.split("-");
            if (dateParts.length === 3) {
              return parseInt(dateParts[2]); // Assuming format DD-MM-YYYY
            }
            return new Date().getFullYear();
          })
        ),
      ].sort((a, b) => b - a); // Sort descending

      setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);
      processExpenseData(data.expenses || [], selectedYear);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        // Redirect to login page
        window.location.href = "/admin/login";
      }
      setExpenses([]);
      setAvailableYears([new Date().getFullYear()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      processExpenseData(expenses, selectedYear);
    }
  }, [selectedYear, expenses]);

  // Process expense data to create monthly and category summaries
  const processExpenseData = (expenses, year) => {
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

    // Get all unique categories
    const categories = [
      ...new Set(expenses.map((expense) => expense.category)),
    ];

    // Initialize monthly data structure
    const monthlyExpenses = categories.map((category) => {
      const monthData = { category };
      months.forEach((month) => {
        monthData[month] = 0;
      });
      monthData.total = 0;
      return monthData;
    });

    // Initialize billable and non-billable data for charts
    const billableByMonth = months.map((month) => ({ month, amount: 0 }));
    const nonBillableByMonth = months.map((month) => ({ month, amount: 0 }));

    // Process each expense
    expenses.forEach((expense) => {
      // Extract month and year from date (assuming format DD-MM-YYYY)
      const dateParts = expense.date.split("-");
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // 0-indexed
        const expenseYear = parseInt(dateParts[2]);

        // Only process expenses for the selected year
        if (expenseYear === year && month >= 0 && month < 12) {
          const monthName = months[month];
          const categoryIndex = monthlyExpenses.findIndex(
            (item) => item.category === expense.category
          );

          if (categoryIndex !== -1) {
            // Add to monthly category total
            monthlyExpenses[categoryIndex][monthName] += expense.amount;
            monthlyExpenses[categoryIndex].total += expense.amount;

            // Add to billable/non-billable monthly totals
            if (expense.isInvoiced) {
              billableByMonth[month].amount += expense.amount;
            } else {
              nonBillableByMonth[month].amount += expense.amount;
            }
          }
        }
      }
    });

    setMonthlyData(monthlyExpenses);
    setBillableData(billableByMonth);
    setNonBillableData(nonBillableByMonth);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return formatBDT(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-slate-500">Loading expenses data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Dashboard / Reports / Expenses
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Expenses Report</h1>
        </div>

        {/* Year Selection */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur flex flex-wrap justify-between items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Filter
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Expenses Report
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="year-select"
              className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500"
            >
              Select Year
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
        </div>

        {/* Expenses Table */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Breakdown
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Monthly Expenses by Category ({selectedYear})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
                  <th className="px-4 sm:px-6 py-3 text-left">Category</th>
                  <th className="px-4 sm:px-6 py-3 text-right">January</th>
                  <th className="px-4 sm:px-6 py-3 text-right">February</th>
                  <th className="px-4 sm:px-6 py-3 text-right">March</th>
                  <th className="px-4 sm:px-6 py-3 text-right">April</th>
                  <th className="px-4 sm:px-6 py-3 text-right">May</th>
                  <th className="px-4 sm:px-6 py-3 text-right">June</th>
                  <th className="px-4 sm:px-6 py-3 text-right">July</th>
                  <th className="px-4 sm:px-6 py-3 text-right">August</th>
                  <th className="px-4 sm:px-6 py-3 text-right">September</th>
                  <th className="px-4 sm:px-6 py-3 text-right">October</th>
                  <th className="px-4 sm:px-6 py-3 text-right">November</th>
                  <th className="px-4 sm:px-6 py-3 text-right">December</th>
                  <th className="px-4 sm:px-6 py-3 text-right">
                    Total {selectedYear}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {monthlyData.map((categoryData, index) => (
                  <tr key={index} className="hover:bg-white/70">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                      {categoryData.category}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.January || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.February || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.March || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.April || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.May || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.June || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.July || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.August || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.September || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.October || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.November || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                      {formatCurrency(categoryData.December || 0)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right font-bold tabular-nums text-slate-900">
                      {formatCurrency(categoryData.total || 0)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-slate-50/80 font-bold text-slate-900">
                  <td className="px-4 sm:px-6 py-3">Total</td>
                  {[
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
                  ].map((month) => (
                    <td
                      key={month}
                      className="px-4 sm:px-6 py-3 text-right tabular-nums"
                    >
                      {formatCurrency(
                        monthlyData.reduce(
                          (sum, category) => sum + (category[month] || 0),
                          0
                        )
                      )}
                    </td>
                  ))}
                  <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                    {formatCurrency(
                      monthlyData.reduce(
                        (sum, category) => sum + (category.total || 0),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Billable Expenses Chart */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Billable
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Billable Expenses by Month ({selectedYear})
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billableData}>
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
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Billable Amount"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Non-Billable Expenses Chart */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Non-Billable
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Non-Billable Expenses by Month ({selectedYear})
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nonBillableData}>
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
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Non-Billable Amount"
                    fill="#ef4444"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Category Charts */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            By Category
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Expenses by Category ({selectedYear})
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="category"
                  angle={0}
                  textAnchor="middle"
                  height={70}
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
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Total Amount"
                  fill="#0ea5e9"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesReport;
