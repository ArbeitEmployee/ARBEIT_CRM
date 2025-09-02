import { useState } from "react";
import axios from "axios";
import { FaDownload } from "react-icons/fa";

const BulkPdfExport = () => {
  const [exportData, setExportData] = useState({
    type: "",
    startDate: "",
    endDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExportData({
      ...exportData,
      [name]: value
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
      const response = await axios.post(
        "http://localhost:5000/api/admin/export/bulk-pdf",
        exportData,
        {
          responseType: "blob"
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
      setMessage("Failed to export PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-900 text-white p-6">
          <h1 className="text-3xl font-bold">Bulk PDF Export</h1>
          <p className="mt-2 opacity-90">Export multiple documents as PDF files in one batch</p>
        </div>
        
        <div className="p-8">
          {/* Document Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Document Type *
            </label>
            <select
              name="type"
              value={exportData.type}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={exportData.startDate}
                onChange={handleChange}
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
                name="endDate"
                value={exportData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg text-lg font-semibold flex items-center justify-center hover:bg-gray-900 disabled:opacity-50 transition-colors duration-200 shadow-md"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <FaDownload className="mr-3" />
                Export PDF Documents
              </>
            )}
          </button>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg text-base ${message.includes("success") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="bg-gray-100 p-6 text-center text-gray-600">
          <p>Select a document type and date range to export multiple PDFs at once</p>
        </div>
      </div>
    </div>
  );
};

export default BulkPdfExport;