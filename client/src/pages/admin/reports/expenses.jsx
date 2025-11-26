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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading expenses data...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Expenses Report</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <span className="mx-1">/</span>
          <span>Reports</span>
          <span className="mx-1">/</span>
          <span>Expenses</span>
        </div>
      </div>

      {/* Year Selection */}
      <div className="bg-white shadow-md rounded p-4 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Expenses Report</h2>
        <div className="flex items-center">
          <label htmlFor="year-select" className="mr-2 font-medium">
            Select Year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
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
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Monthly Expenses by Category ({selectedYear})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">January</th>
                <th className="p-3 text-right">February</th>
                <th className="p-3 text-right">March</th>
                <th className="p-3 text-right">April</th>
                <th className="p-3 text-right">May</th>
                <th className="p-3 text-right">June</th>
                <th className="p-3 text-right">July</th>
                <th className="p-3 text-right">August</th>
                <th className="p-3 text-right">September</th>
                <th className="p-3 text-right">October</th>
                <th className="p-3 text-right">November</th>
                <th className="p-3 text-right">December</th>
                <th className="p-3 text-right">Total {selectedYear}</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((categoryData, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="p-3 font-medium">{categoryData.category}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.January || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.February || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.March || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.April || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.May || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.June || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.July || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.August || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.September || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.October || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.November || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(categoryData.December || 0)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(categoryData.total || 0)}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-gray-100 font-bold">
                <td className="p-3">Total</td>
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
                  <td key={month} className="p-3 text-right">
                    {formatCurrency(
                      monthlyData.reduce(
                        (sum, category) => sum + (category[month] || 0),
                        0
                      )
                    )}
                  </td>
                ))}
                <td className="p-3 text-right">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Billable Expenses Chart */}
        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">
            Billable Expenses by Month ({selectedYear})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={billableData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                />
                <Legend />
                <Bar dataKey="amount" name="Billable Amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Non-Billable Expenses Chart */}
        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">
            Non-Billable Expenses by Month ({selectedYear})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nonBillableData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  name="Non-Billable Amount"
                  fill="#EF4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Category Charts */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Expenses by Category ({selectedYear})
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                angle={0}
                textAnchor="middle"
                height={70}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Amount"]}
              />
              <Legend />
              <Bar dataKey="total" name="Total Amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExpensesReport;
