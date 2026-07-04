import { useState } from "react";
import axios from "axios";
import { FaDownload } from "react-icons/fa";

const BulkPdfExport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [exportData, setExportData] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExportData({
      ...exportData,
      [name]: value,
    });
  };

  const handleExport = async () => {
    if (!exportData.type) {
      setMessage("Please select a document type");
      return;
    }

    if (!exportData.startDate || !exportData.endDate) {
      setMessage("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const config = createAxiosConfig();
      const response = await axios.post(
        `${API_BASE_URL}/admin/export/bulk-pdf`,
        exportData,
        {
          ...config,
          responseType: "blob",
        }
      );

      // Create a blob from the PDF stream
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Create filename based on type and date range
      const start = exportData.startDate.split("-").join("");
      const end = exportData.endDate.split("-").join("");
      link.download = `${exportData.type}_${start}_to_${end}.pdf`;

      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setMessage("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      if (error.response?.status === 401) {
        setMessage("Session expired. Please login again.");
      } else {
        setMessage("Failed to export PDF. Please try again.");
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Bulk PDF Export</h1>
          <p className="mt-1 text-sm text-slate-500">
            Export multiple documents as PDF files in one batch
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          {/* Document Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Document Type *
            </label>
            <select
              name="type"
              value={exportData.type}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            >
              <option value="">Select document type</option>
              <option value="estimate">Estimate</option>
              <option value="invoice">Invoice</option>
              <option value="credit-note">Credit Note</option>
              <option value="proposal">Proposal</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Date Range - Full width rows */}
          <div className="space-y-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={exportData.startDate}
                onChange={handleChange}
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
                name="endDate"
                value={exportData.endDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
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
                Processing...
              </span>
            ) : (
              <>
                <FaDownload className="mr-2" />
                Export PDF Documents
              </>
            )}
          </button>

          {/* Message Display */}
          {message && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                message.includes("success")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p>
            Select a document type and date range to export multiple PDFs at
            once
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkPdfExport;
