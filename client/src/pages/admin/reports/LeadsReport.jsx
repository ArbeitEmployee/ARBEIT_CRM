// MultipleFiles/reports/LeadsReport.jsx
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FaChevronRight } from "react-icons/fa";

const LeadsReport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [sourceChartData, setSourceChartData] = useState([]);
  const [weekConversionData, setWeekConversionData] = useState([]);
  const [dailyLeadsData, setDailyLeadsData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define an array of colors for the Pie Chart segments
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A28DFF",
    "#FF6B6B",
    "#6BFF6B",
  ];

  // Month options
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate year options (last 5 years and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const config = createAxiosConfig();
        const { data } = await axios.get(
          `${API_BASE_URL}/reports/leads?month=${selectedMonth}&year=${selectedYear}`,
          config
        );
        setSourceChartData(data.sourceChartData || []);
        setWeekConversionData(data.weekConversionData || []);
        setDailyLeadsData(data.dailyLeadsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching report data:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
        } else {
          setError("Failed to load report data. Please try again later.");
        }
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500">Loading reports...</div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="flex items-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            <span>Dashboard</span>
            <FaChevronRight className="mx-1 text-[8px]" />
            <span>Reports</span>
            <FaChevronRight className="mx-1 text-[8px]" />
            <span>Leads</span>
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Leads Reports</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Leads by Source Chart (Pie Chart) */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              By Source
            </p>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Leads by Source (This Week)
            </h2>
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {sourceChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">
                No source data available for this week.
              </p>
            )}
          </div>

          {/* This Week Leads Conversions Chart (Bar Chart) */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Conversions
            </p>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              This Week Leads Conversions
            </h2>
            {weekConversionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={weekConversionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
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
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    name="Conversions"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">
                No conversion data available for this week.
              </p>
            )}
          </div>
        </div>

        {/* Daily Leads Chart */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Daily
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Daily Leads
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dailyLeadsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={dailyLeadsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
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
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#0ea5e9"
                  name="Number of Leads"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500">
              No daily leads data available for the selected period.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsReport;
