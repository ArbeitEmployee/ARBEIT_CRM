// MultipleFiles/reports/LeadsReport.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell // Added PieChart, Pie, Cell for the circle graph
} from 'recharts';
import { FaChevronRight } from "react-icons/fa";

const LeadsReport = () => {
  const [sourceChartData, setSourceChartData] = useState([]);
  const [weekdayChartData, setWeekdayChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define an array of colors for the Pie Chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#6BFF6B'];

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://localhost:5000/api/reports/leads");
        setSourceChartData(data.sourceChartData || []);
        setWeekdayChartData(data.weekdayChartData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to load report data. Please try again later.");
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source Chart (Now a Pie Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Leads by Source</h2>
          {sourceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120} // Adjust outerRadius as needed
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name" // Use nameKey for the legend and tooltip to show the source name
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
            <p className="text-gray-500">No source data available.</p>
          )}
        </div>

        {/* Last Contact by Weekday Chart (Remains a Bar Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Last Contact by Weekday</h2>
          {weekdayChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weekdayChartData}
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
            <p className="text-gray-500">No last contact data available for charting.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsReport;
