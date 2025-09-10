// MultipleFiles/reports/LeadsReport.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FaChevronRight } from "react-icons/fa";

const LeadsReport = () => {
  const [sourceChartData, setSourceChartData] = useState([]);
  const [weekConversionData, setWeekConversionData] = useState([]);
  const [dailyLeadsData, setDailyLeadsData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define an array of colors for the Pie Chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#6BFF6B'];

  // Month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (last 5 years and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('crm_token');
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const config = createAxiosConfig();
        const { data } = await axios.get(
          `http://localhost:5000/api/reports/leads?month=${selectedMonth}&year=${selectedYear}`,
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
    return <div className="p-4 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leads Reports</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Reports</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Leads</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leads by Source Chart (Pie Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Leads by Source (This Week)</h2>
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
                  {
                    sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No source data available for this week.</p>
          )}
        </div>

        {/* This Week Leads Conversions Chart (Bar Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">This Week Leads Conversions</h2>
          {weekConversionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weekConversionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No conversion data available for this week.</p>
          )}
        </div>
      </div>

      {/* Daily Leads Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daily Leads</h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {years.map(year => (
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Number of Leads" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No daily leads data available for the selected period.</p>
        )}
      </div>
    </div>
  );
};

export default LeadsReport;