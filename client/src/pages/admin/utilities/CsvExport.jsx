import { useState } from "react";
import { FaChevronRight, FaDownload, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";

const CsvExport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    { value: "customers", label: "Customers" },
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
    { value: "custom", label: "Custom Range" },
  ];

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

  const handleExport = async () => {
    if (!selectedType || !selectedPeriod) {
      setExportMessage("Please select both export type and period");
      return;
    }

    if (selectedPeriod === "custom" && (!customStartDate || !customEndDate)) {
      setExportMessage(
        "Please select both start and end dates for custom range"
      );
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
      const response = await axios.get(
        `${API_BASE_URL}/csvexport/${selectedType}`,
        {
          ...config,
          params,
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set filename based on type and date
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `${selectedType}-export-${date}.csv`);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Utilities
          </p>
          <h1 className="text-2xl font-bold text-slate-900">CSV Export</h1>
          <p className="mt-1 text-sm text-slate-500">
            Export your data as CSV files
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          {/* Export Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Export Type *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {exportTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Period *
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={
              isExporting ||
              !selectedType ||
              !selectedPeriod ||
              (selectedPeriod === "custom" &&
                (!customStartDate || !customEndDate))
            }
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center"
          >
            {isExporting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </span>
            ) : (
              <>
                <FaDownload className="mr-2" />
                Export CSV
              </>
            )}
          </button>

          {/* Message Display */}
          {exportMessage && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                exportMessage.includes("success")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {exportMessage}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p>Select an export type and period to generate a CSV file</p>
        </div>
      </div>
    </div>
  );
};

export default CsvExport;
