/* eslint-disable react-hooks/exhaustive-deps */
// FileName: EstimateRequest.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
  FaBan,
  FaCheckCircle,
  FaClock,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Custom hook for detecting outside clicks
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [ref, callback]);

  return ref;
};

const EstimateRequestPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedEstimates, setSelectedEstimates] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewEstimateForm, setShowNewEstimateForm] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalEstimates: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
  });
  const [newEstimate, setNewEstimate] = useState({
    customerId: "",
    customerName: "",
    customerCode: "",
    customerEmail: "",
    customerPhone: "",
    projectName: "",
    amount: "",
    createdDate: new Date().toISOString().split("T")[0],
    status: "Draft",
    notes: "",
  });
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [viewingEstimate, setViewingEstimate] = useState(null);

  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected", "Expired"];

  // Use the custom hook for detecting outside clicks
  const exportRef = useOutsideClick(() => {
    setShowExportMenu(false);
  });

  const customerRef = useOutsideClick(() => {
    setShowCustomerDropdown(false);
  });

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

  // Format date from YYYY-MM-DD to DD-MM-YYYY for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Format date from ISO string to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const [loading, setLoading] = useState(true);

  // Fetch estimates from API
  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/estimate-requests`, {
        ...config,
        params: {
          search: searchTerm,
        },
      });
      setEstimates(data.estimates || []);
      setStats(
        data.stats || {
          totalEstimates: 0,
          draft: 0,
          sent: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching estimates:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      setEstimates([]);
      setStats({
        totalEstimates: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
      });
    }
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  // Search customers by company name
  const searchCustomers = useCallback(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/estimate-requests/customers/search?q=${searchTerm}`,
        config
      );
      setCustomerSearchResults(data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
    }
  }, []);

  // Search customer by code
  const searchCustomerByCode = useCallback(async (customerCode) => {
    if (!customerCode || customerCode.length < 4) {
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/estimate-requests/customers/by-code/${customerCode}`,
        config
      );
      if (data.customer) {
        setNewEstimate((prev) => ({
          ...prev,
          customerId: data.customer._id,
          customerName: data.customer.company,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
        }));
      }
    } catch (error) {
      console.error("Error searching customer by code:", error);
      // Clear customer info if code is not found
      setNewEstimate((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      }));
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearchTerm) {
        searchCustomers(customerSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchTerm, searchCustomers]);

  // Debounce customer code search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (newEstimate.customerCode && newEstimate.customerCode.length >= 4) {
        searchCustomerByCode(newEstimate.customerCode);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newEstimate.customerCode, searchCustomerByCode]);

  // Search filter (client-side for now, can be moved to backend)
  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.customer &&
        estimate.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      estimate.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.amount.toString().includes(searchTerm)
  );

  // Pagination
  const totalPages = Math.ceil(filteredEstimates.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredEstimates.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleEstimateSelection = (id) => {
    setSelectedEstimates((prev) =>
      prev.includes(id)
        ? prev.filter((estimateId) => estimateId !== id)
        : [...prev, id]
    );
  };

  const handleNewEstimateChange = (e) => {
    const { name, value } = e.target;
    setNewEstimate((prev) => ({ ...prev, [name]: value }));

    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewEstimate((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCode: customer.customerCode,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveEstimate = async () => {
    if (isSaving) return;

    if (
      !newEstimate.projectName ||
      !newEstimate.customerId ||
      !newEstimate.amount ||
      !newEstimate.createdDate
    ) {
      alert(
        "Please fill in all required fields (Project Name, Customer, Amount, Created Date)"
      );
      return;
    }

    setIsSaving(true);

    const estimateData = {
      ...newEstimate,
      createdDate: formatDateForBackend(newEstimate.createdDate),
    };

    try {
      const config = createAxiosConfig();

      if (editingEstimate) {
        await axios.put(
          `${API_BASE_URL}/estimate-requests/${editingEstimate._id}`,
          estimateData,
          config
        );
        alert("Estimate updated successfully!");
      } else {
        await axios.post(
          `${API_BASE_URL}/estimate-requests`,
          estimateData,
          config
        );
        alert("Estimate created successfully!");
      }

      setShowNewEstimateForm(false);
      setEditingEstimate(null);
      fetchEstimates();

      // Reset form
      setNewEstimate({
        customerId: "",
        customerName: "",
        customerCode: "",
        customerEmail: "",
        customerPhone: "",
        projectName: "",
        amount: "",
        createdDate: new Date().toISOString().split("T")[0],
        status: "Draft",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving estimate:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      alert(
        `Error saving estimate: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEstimate = (estimate) => {
    setEditingEstimate(estimate);
    setNewEstimate({
      customerId: estimate.customerId,
      customerName: estimate.customer ? estimate.customer.company : "",
      customerCode: estimate.customer ? estimate.customer.customerCode : "",
      customerEmail: estimate.customer ? estimate.customer.email : "",
      customerPhone: estimate.customer ? estimate.customer.phone : "",
      projectName: estimate.projectName,
      amount: estimate.amount,
      createdDate: formatDateForInput(estimate.createdDate),
      status: estimate.status,
      notes: estimate.notes || "",
    });
    setShowNewEstimateForm(true);
  };

  const handleDeleteEstimate = async (id) => {
    if (window.confirm("Are you sure you want to delete this estimate?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/estimate-requests/${id}`, config);
        fetchEstimates();
        alert("Estimate deleted successfully!");
      } catch (error) {
        console.error("Error deleting estimate:", error);
        if (error.response?.status === 401) {
          alert("Session expired. Please login again.");
          window.location.href = "/admin/login";
        }
        alert(
          `Error deleting estimate: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleBulkDeleteEstimates = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedEstimates.length} selected estimates?`
      )
    ) {
      try {
        const config = createAxiosConfig();
        await axios.post(
          `${API_BASE_URL}/estimate-requests/bulk-delete`,
          {
            estimateIds: selectedEstimates,
          },
          config
        );
        setSelectedEstimates([]);
        fetchEstimates();
        alert("Selected estimates deleted successfully!");
      } catch (error) {
        console.error("Error deleting selected estimates:", error);
        if (error.response?.status === 401) {
          alert("Session expired. Please login again.");
          window.location.href = "/admin/login";
        }
        alert(
          `Error deleting selected estimates: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredEstimates.map((estimate) => ({
      "Project Name": estimate.projectName,
      Customer: estimate.customer ? estimate.customer.company : "N/A",
      "Customer Code": estimate.customer
        ? estimate.customer.customerCode
        : "N/A",
      "Customer Email": estimate.customer ? estimate.customer.email : "N/A",
      "Customer Phone": estimate.customer ? estimate.customer.phone : "N/A",
      Amount: estimate.amount,
      "Created Date": new Date(estimate.createdDate).toLocaleDateString(),
      Status: estimate.status,
      Notes: estimate.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
    XLSX.writeFile(workbook, "Estimates.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredEstimates.map((estimate) => ({
      "Project Name": estimate.projectName,
      Customer: estimate.customer ? estimate.customer.company : "N/A",
      "Customer Code": estimate.customer
        ? estimate.customer.customerCode
        : "N/A",
      "Customer Email": estimate.customer ? estimate.customer.email : "N/A",
      "Customer Phone": estimate.customer ? estimate.customer.phone : "N/A",
      Amount: estimate.amount,
      "Created Date": new Date(estimate.createdDate).toLocaleDateString(),
      Status: estimate.status,
      Notes: estimate.notes,
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Estimates.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Project Name",
      "Customer",
      "Amount",
      "Created Date",
      "Status",
    ];

    const tableRows = filteredEstimates.map((estimate) => [
      estimate.projectName,
      estimate.customer ? estimate.customer.company : "N/A",
      `$${estimate.amount}`,
      new Date(estimate.createdDate).toLocaleDateString(),
      estimate.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Estimates.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Estimate Requests</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      @media print {
        body { margin: 0; padding: 20px; }
        .no-print { display: none; }
      }
    `);
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write("<h1>Estimate Requests</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    ["Project Name", "Customer", "Amount", "Created Date", "Status"].forEach(
      (header) => {
        printWindow.document.write(`<th>${header}</th>`);
      }
    );
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredEstimates.forEach((estimate) => {
      printWindow.document.write("<tr>");
      [
        estimate.projectName,
        estimate.customer ? estimate.customer.company : "N/A",
        `$${estimate.amount}`,
        new Date(estimate.createdDate).toLocaleDateString(),
        estimate.status,
      ].forEach((value) => {
        printWindow.document.write(`<td>${value}</td>`);
      });
      printWindow.document.write("</tr>");
    });
    printWindow.document.write("</tbody>");

    printWindow.document.write("</table>");
    printWindow.document.write(
      '<p class="no-print">Printed on: ' + new Date().toLocaleString() + "</p>"
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
    setShowExportMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Expired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        Loading estimateRequests...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Estimates
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {showNewEstimateForm
            ? editingEstimate
              ? "Edit Estimate"
              : "Add New Estimate"
            : "Estimate Requests"}
        </h1>
        <div className="flex items-center text-slate-500">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Estimates</span>
        </div>
      </div>

      {showNewEstimateForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Estimate Details</h2>
            <button
              onClick={() => {
                setShowNewEstimateForm(false);
                setEditingEstimate(null);
                setNewEstimate({
                  customerId: "",
                  customerName: "",
                  customerCode: "",
                  customerEmail: "",
                  customerPhone: "",
                  projectName: "",
                  amount: "",
                  createdDate: new Date().toISOString().split("T")[0],
                  status: "Draft",
                  notes: "",
                });
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={newEstimate.projectName}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Code
                </label>
                <input
                  type="text"
                  name="customerCode"
                  value={newEstimate.customerCode}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Enter customer code (e.g., CUST-ABC123)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter customer code to auto-populate customer information
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer *
                </label>
                <div className="relative" ref={customerRef}>
                  <input
                    type="text"
                    name="customerName"
                    value={newEstimate.customerName}
                    onChange={handleNewEstimateChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    required
                    placeholder="Search customer by company name..."
                  />
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {customerSearchResults.map((customer, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.company}</div>
                          <div className="text-sm text-gray-600">
                            {customer.contact} - {customer.email}
                          </div>
                          <div className="text-xs text-blue-600">
                            {customer.customerCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown &&
                    customerSearchResults.length === 0 &&
                    customerSearchTerm.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                        <div className="px-3 py-2 text-gray-500">
                          No customers found
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={newEstimate.customerEmail}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={newEstimate.customerPhone}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  readOnly
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newEstimate.amount}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Created Date *
                </label>
                <input
                  type="date"
                  name="createdDate"
                  value={newEstimate.createdDate}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={newEstimate.status}
                  onChange={handleNewEstimateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes/Content Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes/Content
            </label>
            <textarea
              name="notes"
              value={newEstimate.notes}
              onChange={handleNewEstimateChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Add any relevant notes or detailed content for the estimate..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewEstimateForm(false);
                setEditingEstimate(null);
                setNewEstimate({
                  customerId: "",
                  customerName: "",
                  customerCode: "",
                  customerEmail: "",
                  customerPhone: "",
                  projectName: "",
                  amount: "",
                  createdDate: new Date().toISOString().split("T")[0],
                  status: "Draft",
                  notes: "",
                });
              }}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEstimate}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
              disabled={
                !newEstimate.projectName ||
                !newEstimate.customerId ||
                !newEstimate.amount ||
                !newEstimate.createdDate ||
                isSaving
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Estimates */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Total Estimates</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.totalEstimates}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#0ea5e9] flex items-center justify-center">
                  <FaFileInvoiceDollar className="text-white" />
                </div>
              </div>
            </div>

            {/* Draft */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Draft</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.draft}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-slate-400 flex items-center justify-center">
                  <FaClock className="text-white" />
                </div>
              </div>
            </div>

            {/* Sent */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Sent</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.sent}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#8b5cf6] flex items-center justify-center">
                  <FaCheckCircle className="text-white" />
                </div>
              </div>
            </div>

            {/* Accepted */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Accepted</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.accepted}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#22c55e] flex items-center justify-center">
                  <FaCheckCircle className="text-white" />
                </div>
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Rejected</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.rejected}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#ef4444] flex items-center justify-center">
                  <FaBan className="text-white" />
                </div>
              </div>
            </div>

            {/* Expired */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Expired</p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.expired}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#f59e0b] flex items-center justify-center">
                  <FaClock className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-2"
                onClick={() => setShowNewEstimateForm(true)}
              >
                <FaPlus /> New Estimate
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-2"
                onClick={() => setCompactView(!compactView)}
              >
                {compactView ? "<<" : ">>"}
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div
            className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 ${
              compactView ? "w-1/2" : "w-full"
            }`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedEstimates.length > 0 && (
                  <button
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                    onClick={handleBulkDeleteEstimates}
                  >
                    Delete Selected ({selectedEstimates.length})
                  </button>
                )}
                {/* Entries per page */}
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                {/* Export button */}
                <div className="relative" ref={exportRef}>
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div className="absolute mt-1 w-32 rounded-2xl border border-white/60 bg-white shadow-2xl z-10 overflow-hidden">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToExcel}
                      >
                        Excel
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToCSV}
                      >
                        CSV
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={exportToPDF}
                      >
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                        onClick={printTable}
                      >
                        Print
                      </button>
                    </div>
                  )}
                </div>

                {/* Refresh button */}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
                  onClick={fetchEstimates}
                >
                  <FaSyncAlt />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    <th className="px-4 sm:px-6 py-3 text-left rounded-l-lg">
                      <input
                        type="checkbox"
                        checked={
                          selectedEstimates.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEstimates(
                              currentData.map((estimate) => estimate._id)
                            );
                          } else {
                            setSelectedEstimates([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left">
                      Project Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left">
                      Customer
                    </th>
                    {compactView ? (
                      <>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Amount
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left rounded-r-lg">
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Customer Email
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Customer Phone
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Amount
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Created Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left rounded-r-lg">
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 10}
                        className="text-center py-4 text-slate-500"
                      >
                        {searchTerm
                          ? "No matching estimates found."
                          : "No estimates available."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((estimate) => (
                      <tr key={estimate._id} className="bg-white/70 hover:bg-white">
                        <td className="px-4 sm:px-6 py-3 text-sm rounded-l-lg">
                          <input
                            type="checkbox"
                            checked={selectedEstimates.includes(estimate._id)}
                            onChange={() =>
                              toggleEstimateSelection(estimate._id)
                            }
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm">{estimate.projectName}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm">
                          {estimate.customer
                            ? estimate.customer.company
                            : "N/A"}
                          {estimate.customer &&
                            estimate.customer.customerCode && (
                              <div className="text-xs text-blue-600 mt-1">
                                {estimate.customer.customerCode}
                              </div>
                            )}
                        </td>
                        {compactView ? (
                          <>
                            <td className="px-4 sm:px-6 py-3 text-sm text-right tabular-nums">
                              {formatCurrency(estimate.amount)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                  estimate.status
                                )}`}
                              >
                                {estimate.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm rounded-r-lg">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingEstimate(estimate)}
                                  className="rounded-lg p-2 bg-slate-100 text-slate-700"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleEditEstimate(estimate)}
                                  className="rounded-lg p-2 bg-blue-100 text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteEstimate(estimate._id)
                                  }
                                  className="rounded-lg p-2 bg-red-100 text-red-700"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 sm:px-6 py-3 text-sm">
                              {estimate.customer
                                ? estimate.customer.email
                                : "N/A"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm">
                              {estimate.customer
                                ? estimate.customer.phone
                                : "N/A"}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-right tabular-nums">
                              {formatCurrency(estimate.amount)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm">
                              {displayDate(estimate.createdDate)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                  estimate.status
                                )}`}
                              >
                                {estimate.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm rounded-r-lg">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingEstimate(estimate)}
                                  className="rounded-lg p-2 bg-slate-100 text-slate-700"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleEditEstimate(estimate)}
                                  className="rounded-lg p-2 bg-blue-100 text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteEstimate(estimate._id)
                                  }
                                  className="rounded-lg p-2 bg-red-100 text-red-700"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="text-sm text-slate-500 tabular-nums">
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredEstimates.length
                )}{" "}
                of {filteredEstimates.length} entries
              </div>
              <div className="flex gap-1">
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold tabular-nums ${
                        currentPage === pageNum
                          ? "bg-slate-900 text-white"
                          : "bg-white/80 text-slate-700 hover:bg-white"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Estimate Modal */}
      {viewingEstimate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl p-6 w-11/12 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Estimate Details</h2>
              <button
                onClick={() => setViewingEstimate(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">Project Name</p>
                <p className="font-medium">{viewingEstimate.projectName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-medium">
                  {viewingEstimate.customer
                    ? viewingEstimate.customer.company
                    : "N/A"}
                </p>
                {viewingEstimate.customer &&
                  viewingEstimate.customer.customerCode && (
                    <p className="text-sm text-blue-600 mt-1">
                      {viewingEstimate.customer.customerCode}
                    </p>
                  )}
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer Email</p>
                <p className="font-medium">
                  {viewingEstimate.customer
                    ? viewingEstimate.customer.email
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer Phone</p>
                <p className="font-medium">
                  {viewingEstimate.customer
                    ? viewingEstimate.customer.phone
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-medium tabular-nums">
                  {formatCurrency(viewingEstimate.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Created Date</p>
                <p className="font-medium">
                  {displayDate(viewingEstimate.createdDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-medium">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      viewingEstimate.status
                    )}`}
                  >
                    {viewingEstimate.status}
                  </span>
                </p>
              </div>
            </div>
            {viewingEstimate.notes && (
              <div className="mb-4">
                <p className="text-sm text-slate-500">Notes/Content</p>
                <p className="font-medium mt-1 p-3 bg-slate-100 rounded-xl">
                  {viewingEstimate.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setViewingEstimate(null)}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EstimateRequestPage;
