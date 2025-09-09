import { useState } from "react";
import { FaChevronRight, FaDownload, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";

const CsvExport = () => {
  const [selectedType, setSelectedType] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const exportTypes = [
    { value: "", label: "Select export type" },
    { value: "leads", label: "Leads" },
    { value: "expenses", label: "Expenses" },
    { value: "contacts", label: "Contacts" },
    { value: "customers", label: "Customers" }
  ];

  const periodOptions = [
    { value: "", label: "Select period" },
    { value: "all-time", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
    { value: "this-quarter", label: "This Quarter" },
    { value: "this-year", label: "This Year" },
    { value: "last-week", label: "Last Week" },
    { value: "last-month", label: "Last Month" },
    { value: "last-quarter", label: "Last Quarter" },
    { value: "last-year", label: "Last Year" },
    { value: "custom", label: "Custom Range" }
  ];

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

  const handleExport = async () => {
    if (!selectedType || !selectedPeriod) {
      setExportMessage("Please select both export type and period");
      return;
    }

    if (selectedPeriod === "custom" && (!customStartDate || !customEndDate)) {
      setExportMessage("Please select both start and end dates for custom range");
      return;
    }

    setIsExporting(true);
    setExportMessage("");

    try {
      const params = { period: selectedPeriod };
      
      if (selectedPeriod === "custom") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const config = createAxiosConfig();
      const response = await axios.get(`http://localhost:5000/api/csvexport/${selectedType}`, {
        ...config,
        params,
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on type and date
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${selectedType}-export-${date}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExportMessage("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      if (error.response?.status === 401) {
        setExportMessage("Session expired. Please login again.");
      } else {
        setExportMessage("Error during export. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-900 text-white p-6">
          <h1 className="text-3xl font-bold">CSV Export</h1>
          <p className="mt-2 opacity-90">Export your data as CSV files</p>
        </div>
        
        <div className="p-8">
          

          {/* Export Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Export Type *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              {exportTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Period *
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range - Separate rows */}
          {selectedPeriod === "custom" && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  End Date *
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedType || !selectedPeriod || 
              (selectedPeriod === "custom" && (!customStartDate || !customEndDate))}
            className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg text-lg font-semibold flex items-center justify-center hover:bg-gray-900 transition-colors duration-200 shadow-md"
          >
            {isExporting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              <>
                <FaDownload className="mr-3" />
                Export CSV
              </>
            )}
          </button>

          {/* Message Display */}
          {exportMessage && (
            <div className={`mt-6 p-4 rounded-lg text-base ${exportMessage.includes("success") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
              {exportMessage}
            </div>
          )}
        </div>
        
        <div className="bg-gray-100 p-6 text-center text-gray-600">
          <p>Select an export type and period to generate a CSV file</p>
        </div>
      </div>
    </div>
  );
};

export default CsvExport;