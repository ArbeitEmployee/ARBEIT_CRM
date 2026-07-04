/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaFileImport,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBDT } from "../../utils/currency";

const SubscriptionPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewSubscriptionForm, setShowNewSubscriptionForm] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pastDueSubscriptions: 0,
    canceledSubscriptions: 0,
    futureSubscriptions: 0,
  });
  const [newSubscription, setNewSubscription] = useState({
    name: "",
    customerId: "",
    customerName: "",
    project: "",
    status: "Active",
    nextBilling: "",
    dateSubscribed: "",
    lastSent: "",
    amount: "",
    billingCycle: "Monthly",
    notes: "",
  });
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const statusOptions = [
    "Active",
    "Future",
    "Past Due",
    "Unpaid",
    "Incomplete",
    "Canceled",
    "Incomplete Expired",
  ];

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const billingCycleOptions = ["Monthly", "Quarterly", "Annual", "Custom"];

  const [loading, setLoading] = useState(true);

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/subscriptions`, config);
      setSubscriptions(data.subscriptions || []);
      setStats(
        data.stats || {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          pastDueSubscriptions: 0,
          canceledSubscriptions: 0,
          futureSubscriptions: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      setSubscriptions([]);
      setStats({
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pastDueSubscriptions: 0,
        canceledSubscriptions: 0,
        futureSubscriptions: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/subscriptions/customers/search?q=${searchTerm}`,
        config
      );
      setCustomerSearchResults(data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearchTerm) {
        searchCustomers(customerSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchTerm]);

  // Search filter
  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.customer &&
        sub.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      sub.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredSubscriptions.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleSubscriptionSelection = (id) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(id)
        ? prev.filter((subscriptionId) => subscriptionId !== id)
        : [...prev, id]
    );
  };

  const handleNewSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setNewSubscription((prev) => ({ ...prev, [name]: value }));

    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewSubscription((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveSubscription = async () => {
    if (isSaving) return;

    if (
      !newSubscription.name ||
      !newSubscription.customerId ||
      !newSubscription.project ||
      !newSubscription.status ||
      !newSubscription.nextBilling ||
      !newSubscription.amount
    ) {
      alert(
        "Please fill in all required fields (Name, Customer, Project, Status, Next Billing, Amount)"
      );
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();

      if (editingSubscription) {
        // Update existing subscription
        await axios.put(
          `${API_BASE_URL}/subscriptions/${editingSubscription._id}`,
          newSubscription,
          config
        );
        setShowNewSubscriptionForm(false);
        setEditingSubscription(null);
        fetchSubscriptions();
        alert("Subscription updated successfully!");
      } else {
        // Create new subscription
        await axios.post(
          `${API_BASE_URL}/subscriptions`,
          newSubscription,
          config
        );
        setShowNewSubscriptionForm(false);
        fetchSubscriptions();
        alert("Subscription created successfully!");
      }

      // Reset form
      setNewSubscription({
        name: "",
        customerId: "",
        customerName: "",
        project: "",
        status: "Active",
        nextBilling: "",
        dateSubscribed: "",
        lastSent: "",
        amount: "",
        billingCycle: "Monthly",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert(
        `Error saving subscription: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
    setNewSubscription({
      name: subscription.name,
      customerId: subscription.customerId,
      customerName: subscription.customer ? subscription.customer.company : "",
      project: subscription.project,
      status: subscription.status,
      nextBilling: subscription.nextBilling
        ? new Date(subscription.nextBilling).toISOString().split("T")[0]
        : "",
      dateSubscribed: subscription.dateSubscribed
        ? new Date(subscription.dateSubscribed).toISOString().split("T")[0]
        : "",
      lastSent: subscription.lastSent
        ? new Date(subscription.lastSent).toISOString().split("T")[0]
        : "",
      amount: subscription.amount,
      billingCycle: subscription.billingCycle || "Monthly",
      notes: subscription.notes || "",
    });
    setShowNewSubscriptionForm(true);
  };

  const handleDeleteSubscription = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/subscriptions/${id}`, config);
        fetchSubscriptions();
        alert("Subscription deleted successfully!");
      } catch (error) {
        console.error("Error deleting subscription:", error);
        alert(
          `Error deleting subscription: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleImportClick = () => {
    setImportModalOpen(true);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      alert("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setImportProgress({ status: "uploading", message: "Uploading file..." });

      const token = getAuthToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/subscriptions/import`,
        formData,
        config
      );

      setImportProgress(null);
      setImportResult({
        success: true,
        imported: data.importedCount,
        errorCount: data.errorMessages?.length || 0,
        errorMessages: data.errorMessages,
      });

      // Refresh subscription list
      fetchSubscriptions();
    } catch (error) {
      console.error("Error importing subscriptions:", error);
      setImportProgress(null);
      setImportResult({
        success: false,
        message:
          error.response?.data?.message || error.message || "Import failed",
      });
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete selected subscriptions
  const handleDeleteSelected = async () => {
    if (
      window.confirm(
        `Delete ${selectedSubscriptions.length} selected subscriptions?`
      )
    ) {
      try {
        const config = createAxiosConfig();
        await Promise.all(
          selectedSubscriptions.map((id) =>
            axios.delete(`${API_BASE_URL}/subscriptions/${id}`, config)
          )
        );
        setSelectedSubscriptions([]);
        fetchSubscriptions();
        alert("Selected subscriptions deleted!");
      } catch (error) {
        console.error("Error deleting selected subscriptions:", error);
        alert("Error deleting selected subscriptions.");
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredSubscriptions.map((subscription) => ({
      ID: subscription._id,
      Name: subscription.name,
      Customer: subscription.customer ? subscription.customer.company : "N/A",
      Project: subscription.project,
      Status: subscription.status,
      "Next Billing": subscription.nextBilling
        ? new Date(subscription.nextBilling).toLocaleDateString()
        : "N/A",
      "Date Subscribed": subscription.dateSubscribed
        ? new Date(subscription.dateSubscribed).toLocaleDateString()
        : "N/A",
      "Last Sent": subscription.lastSent
        ? new Date(subscription.lastSent).toLocaleDateString()
        : "N/A",
      Amount: subscription.amount,
      "Billing Cycle": subscription.billingCycle,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");
    XLSX.writeFile(workbook, "Subscriptions.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredSubscriptions.map((subscription) => ({
      ID: subscription._id,
      Name: subscription.name,
      Customer: subscription.customer ? subscription.customer.company : "N/A",
      Project: subscription.project,
      Status: subscription.status,
      "Next Billing": subscription.nextBilling
        ? new Date(subscription.nextBilling).toLocaleDateString()
        : "N/A",
      "Date Subscribed": subscription.dateSubscribed
        ? new Date(subscription.dateSubscribed).toLocaleDateString()
        : "N/A",
      "Last Sent": subscription.lastSent
        ? new Date(subscription.lastSent).toLocaleDateString()
        : "N/A",
      Amount: subscription.amount,
      "Billing Cycle": subscription.billingCycle,
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Subscriptions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "ID",
      "Name",
      "Customer",
      "Project",
      "Status",
      "Next Billing",
      "Amount",
      "Billing Cycle",
    ];

    const tableRows = filteredSubscriptions.map((subscription) => [
      subscription._id,
      subscription.name,
      subscription.customer ? subscription.customer.company : "N/A",
      subscription.project,
      subscription.status,
      subscription.nextBilling
        ? new Date(subscription.nextBilling).toLocaleDateString()
        : "N/A",
      formatBDT(subscription.amount),
      subscription.billingCycle,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Subscriptions.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Subscriptions</title>");
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
    printWindow.document.write("<h1>Subscriptions</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    [
      "ID",
      "Name",
      "Customer",
      "Project",
      "Status",
      "Next Billing",
      "Amount",
      "Billing Cycle",
    ].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredSubscriptions.forEach((subscription) => {
      printWindow.document.write("<tr>");
      [
        subscription._id,
        subscription.name,
        subscription.customer ? subscription.customer.company : "N/A",
        subscription.project,
        subscription.status,
        subscription.nextBilling
          ? new Date(subscription.nextBilling).toLocaleDateString()
          : "N/A",
        formatBDT(subscription.amount),
        subscription.billingCycle,
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
      case "Active":
        return "bg-green-100 text-green-800";
      case "Future":
        return "bg-blue-100 text-blue-800";
      case "Past Due":
        return "bg-red-100 text-red-800";
      case "Unpaid":
        return "bg-orange-100 text-orange-800";
      case "Incomplete":
        return "bg-yellow-100 text-yellow-800";
      case "Canceled":
        return "bg-slate-100 text-slate-700";
      case "Incomplete Expired":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        Loading subscriptions...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
          BILLING
        </p>
        <h1 className="text-2xl font-bold text-white">
          {showNewSubscriptionForm
            ? editingSubscription
              ? "Edit Subscription"
              : "Add New Subscription"
            : "Subscriptions"}
        </h1>
        <div className="flex items-center text-slate-500 text-sm">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Subscriptions</span>
        </div>
      </div>

      {showNewSubscriptionForm ? (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Subscription Details</h2>
            <button
              onClick={() => {
                setShowNewSubscriptionForm(false);
                setEditingSubscription(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newSubscription.name}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={newSubscription.customerName}
                    onChange={handleNewSubscriptionChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    required
                    placeholder="Search customer by company name..."
                  />
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                      {customerSearchResults.map((customer, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.company}</div>
                          <div className="text-sm text-gray-600">
                            {customer.contact} - {customer.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown &&
                    customerSearchResults.length === 0 &&
                    customerSearchTerm.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="px-3 py-2 text-gray-500">
                          No customers found
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <input
                  type="text"
                  name="project"
                  value={newSubscription.project}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newSubscription.amount}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Cycle
                </label>
                <select
                  name="billingCycle"
                  value={newSubscription.billingCycle}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {billingCycleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={newSubscription.status}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Billing Date *
                </label>
                <input
                  type="date"
                  name="nextBilling"
                  value={newSubscription.nextBilling}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Subscribed
                </label>
                <input
                  type="date"
                  name="dateSubscribed"
                  value={newSubscription.dateSubscribed}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Sent
                </label>
                <input
                  type="date"
                  name="lastSent"
                  value={newSubscription.lastSent}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={newSubscription.notes}
                  onChange={handleNewSubscriptionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowNewSubscriptionForm(false);
                setEditingSubscription(null);
              }}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubscription}
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              {isSaving
                ? "Saving..."
                : editingSubscription
                ? "Update Subscription"
                : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Subscriptions */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Total Subscriptions
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.totalSubscriptions}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#0ea5e9" }}
                >
                  <FaUser className="text-white" />
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Active
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  <FaUserCheck className="text-white" />
                </div>
              </div>
            </div>

            {/* Past Due Subscriptions */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Past Due
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.pastDueSubscriptions}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <FaUserTimes className="text-white" />
                </div>
              </div>
            </div>

            {/* Canceled Subscriptions */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Canceled
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.canceledSubscriptions}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#64748b" }}
                >
                  <FaUserTimes className="text-white" />
                </div>
              </div>
            </div>

            {/* Future Subscriptions */}
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Future
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {stats.futureSubscriptions}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#8b5cf6" }}
                >
                  <FaUserClock className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 flex items-center gap-2"
                onClick={() => setShowNewSubscriptionForm(true)}
              >
                <FaPlus /> New Subscription
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-2"
                onClick={handleImportClick}
              >
                <FaFileImport /> Import Subscriptions
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
                {selectedSubscriptions.length > 0 && (
                  <button
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected ({selectedSubscriptions.length})
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
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div
                      ref={exportMenuRef}
                      className="absolute mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg z-10"
                    >
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={exportToExcel}
                      >
                        Excel
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={exportToCSV}
                      >
                        CSV
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={exportToPDF}
                      >
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        onClick={printTable}
                      >
                        Print
                      </button>
                    </div>
                  )}
                </div>

                {/* Refresh button */}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
                  onClick={fetchSubscriptions}
                >
                  <FaSyncAlt />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left rounded-l-lg"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedSubscriptions.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubscriptions(
                              currentData.map((c) => c._id)
                            );
                          } else {
                            setSelectedSubscriptions([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                    >
                      Name
                    </th>
                    <th
                      className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                    >
                      Customer
                    </th>
                    <th
                      className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                    >
                      Project
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Status
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Next Billing
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Amount
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left rounded-r-lg"
                        >
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Status
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Next Billing
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Amount
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Billing Cycle
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left"
                        >
                          Date Subscribed
                        </th>
                        <th
                          className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-left rounded-r-lg"
                        >
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((subscription) => (
                    <tr
                      key={subscription._id}
                      className="bg-white shadow rounded-lg hover:bg-white/70 relative"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.includes(
                              subscription._id
                            )}
                            onChange={() =>
                              toggleSubscriptionSelection(subscription._id)
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0">{subscription.name}</td>
                      <td className="p-3 border-0">
                        {subscription.customer
                          ? subscription.customer.company
                          : "N/A"}
                        {subscription.customer && (
                          <div className="text-xs text-slate-500">
                            {subscription.customer.contact} •{" "}
                            {subscription.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-0">{subscription.project}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                subscription.status
                              )}`}
                            >
                              {subscription.status}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {subscription.nextBilling
                              ? new Date(
                                  subscription.nextBilling
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-3 border-0 tabular-nums">
                            {formatBDT(subscription.amount)}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleEditSubscription(subscription)
                                }
                                className="rounded-lg p-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSubscription(subscription._id)
                                }
                                className="rounded-lg p-2 bg-red-100 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                subscription.status
                              )}`}
                            >
                              {subscription.status}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {subscription.nextBilling
                              ? new Date(
                                  subscription.nextBilling
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-3 border-0 tabular-nums">
                            {formatBDT(subscription.amount)}
                          </td>
                          <td className="p-3 border-0">
                            {subscription.billingCycle}
                          </td>
                          <td className="p-3 border-0 whitespace-nowrap">
                            {subscription.dateSubscribed
                              ? new Date(
                                  subscription.dateSubscribed
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleEditSubscription(subscription)
                                }
                                className="rounded-lg p-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSubscription(subscription._id)
                                }
                                className="rounded-lg p-2 bg-red-100 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredSubscriptions.length
                )}{" "}
                of {filteredSubscriptions.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold hover:bg-white ${
                      currentPage === i + 1
                        ? "bg-slate-900 text-white"
                        : "bg-white/80 text-slate-700"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/60 bg-white shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Import Subscriptions</h2>

            {importProgress ? (
              <div className="mb-4">
                <p className="text-sm">{importProgress.message}</p>
              </div>
            ) : importResult ? (
              <div
                className={`mb-4 p-3 rounded ${
                  importResult.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {importResult.success ? (
                  <>
                    <p className="font-semibold">Import completed!</p>
                    <p className="text-sm">Imported: {importResult.imported}</p>
                    <p className="text-sm">Errors: {importResult.errorCount}</p>
                    {importResult.errorMessages &&
                      importResult.errorMessages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold">
                            Error details:
                          </p>
                          <ul className="text-xs max-h-32 overflow-auto">
                            {importResult.errorMessages.map((error, index) => (
                              <li key={index} className="mt-1">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-sm">Error: {importResult.message}</p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm mb-2">
                  Select a CSV or Excel file to import subscriptions:
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-sm"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              {!importResult && (
                <button
                  onClick={closeImportModal}
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              )}
              {!importProgress && !importResult && (
                <button
                  onClick={handleImportSubmit}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                  disabled={!importFile}
                >
                  Import
                </button>
              )}
              {importResult && (
                <button
                  onClick={closeImportModal}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
