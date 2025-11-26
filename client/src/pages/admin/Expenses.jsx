import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaChevronRight,
  FaTimes,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaFileImport,
  FaReceipt,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ExpensesPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    billable: 0,
    notInvoiced: 0,
  });
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    name: "",
    date: "",
    project: "",
    customerId: "",
    customerName: "",
    isInvoiced: false,
    paymentMode: "",
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const fileInputRef = useRef(null);

  const categoryOptions = [
    "Travel Expense",
    "Meals & Entertainment",
    "Office Supplies",
    "Software & Tools",
    "Transportation",
    "Accommodation",
    "Communication",
    "Training & Education",
    "Other",
  ];

  const paymentModeOptions = [
    "CASH",
    "BANK",
    "CREDIT CARD",
    "DEBIT CARD",
    "DIGITAL WALLET",
    "OTHER",
  ];

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

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

  const [loading, setLoading] = useState(true);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/expenses`, config);
      setExpenses(data.expenses || []);
      setStats(
        data.stats || {
          total: 0,
          billable: 0,
          notInvoiced: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching expenses:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        // Redirect to login page
        window.location.href = "/admin/login";
      }
      setExpenses([]);
      setStats({
        total: 0,
        billable: 0,
        notInvoiced: 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/expenses/customers/search?q=${searchTerm}`,
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
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.customer &&
        expense.customer.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      expense.paymentMode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredExpenses.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleExpenseSelection = (id) => {
    setSelectedExpenses((prev) =>
      prev.includes(id)
        ? prev.filter((expenseId) => expenseId !== id)
        : [...prev, id]
    );
  };

  const handleNewExpenseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExpense((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewExpense((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  // Add this function to format date for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";

    // Convert YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Update handleSaveExpense function
  const handleSaveExpense = async () => {
    if (isSaving) return;

    if (
      !newExpense.category ||
      !newExpense.amount ||
      !newExpense.name ||
      !newExpense.customerId ||
      !newExpense.date
    ) {
      alert(
        "Please fill in all required fields (Category, Amount, Name, Customer, Date)"
      );
      return;
    }

    setIsSaving(true);

    try {
      const config = createAxiosConfig();
      const expenseData = {
        ...newExpense,
        date: formatDateForBackend(newExpense.date), // Format the date
      };

      if (editingExpense) {
        // Update existing expense
        await axios.put(
          `${API_BASE_URL}/expenses/${editingExpense._id}`,
          expenseData,
          config
        );
        setShowNewExpenseForm(false);
        setEditingExpense(null);
        fetchExpenses();
        alert("Expense updated successfully!");
      } else {
        // Create new expense
        await axios.post(`${API_BASE_URL}/expenses`, expenseData, config);
        setShowNewExpenseForm(false);
        fetchExpenses();
        alert("Expense created successfully!");
      }

      // Reset form
      setNewExpense({
        category: "",
        amount: "",
        name: "",
        date: "",
        project: "",
        customerId: "",
        customerName: "",
        isInvoiced: false,
        paymentMode: "",
      });
    } catch (error) {
      console.error("Error saving expense:", error);
      alert(
        `Error saving expense: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      category: expense.category,
      amount: expense.amount,
      name: expense.name,
      date: expense.date,
      project: expense.project,
      customerId: expense.customerId,
      customerName: expense.customer ? expense.customer.company : "",
      isInvoiced: expense.isInvoiced,
      paymentMode: expense.paymentMode,
    });
    setShowNewExpenseForm(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/expenses/${id}`, config);
        fetchExpenses();
        alert("Expense deleted successfully!");
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(
          `Error deleting expense: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedExpenses.length} selected expenses?`
      )
    ) {
      try {
        const config = createAxiosConfig();
        await axios.post(
          `${API_BASE_URL}/expenses/bulk-delete`,
          { ids: selectedExpenses },
          config
        );
        setSelectedExpenses([]);
        fetchExpenses();
        alert("Selected expenses deleted successfully!");
      } catch (error) {
        console.error("Error bulk deleting expenses:", error);
        alert(
          `Error deleting expenses: ${
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
        `${API_BASE_URL}/expenses/import`,
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

      // Refresh expense list
      fetchExpenses();
    } catch (error) {
      console.error("Error importing expenses:", error);
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

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredExpenses.map((expense) => ({
      ID: expense._id,
      Category: expense.category,
      Amount: expense.amount,
      Name: expense.name,
      Date: expense.date,
      Project: expense.project,
      Customer: expense.customer ? expense.customer.company : "N/A",
      Invoiced: expense.isInvoiced ? "YES" : "NO",
      "Payment Mode": expense.paymentMode,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "Expenses.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredExpenses.map((expense) => ({
      ID: expense._id,
      Category: expense.category,
      Amount: expense.amount,
      Name: expense.name,
      Date: expense.date,
      Project: expense.project,
      Customer: expense.customer ? expense.customer.company : "N/A",
      Invoiced: expense.isInvoiced ? "YES" : "NO",
      "Payment Mode": expense.paymentMode,
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Expenses.csv");
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
      "Category",
      "Amount",
      "Name",
      "Date",
      "Project",
      "Customer",
      "Invoiced",
      "Payment Mode",
    ];

    const tableRows = filteredExpenses.map((expense) => [
      expense._id,
      expense.category,
      `$${expense.amount.toFixed(2)}`,
      expense.name,
      expense.date,
      expense.project,
      expense.customer ? expense.customer.company : "N/A",
      expense.isInvoiced ? "YES" : "NO",
      expense.paymentMode,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Expenses.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open("", "", "height=600,width=1000");
    printWindow.document.write("<html><head><title>Expenses</title>");
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
    printWindow.document.write("<h1>Expenses</h1>");
    printWindow.document.write("<table>");

    // Table header
    printWindow.document.write("<thead><tr>");
    [
      "ID",
      "Category",
      "Amount",
      "Name",
      "Date",
      "Project",
      "Customer",
      "Invoiced",
      "Payment Mode",
    ].forEach((header) => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write("</tr></thead>");

    // Table body
    printWindow.document.write("<tbody>");
    filteredExpenses.forEach((expense) => {
      printWindow.document.write("<tr>");
      [
        expense._id,
        expense.category,
        `$${expense.amount.toFixed(2)}`,
        expense.name,
        expense.date,
        expense.project,
        expense.customer ? expense.customer.company : "N/A",
        expense.isInvoiced ? "YES" : "NO",
        expense.paymentMode,
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading)
    return (
      <div className="bg-gray-100 min-h-screen p-4">Loading expenses...</div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {showNewExpenseForm
            ? editingExpense
              ? "Edit Expense"
              : "Add New Expense"
            : "Expenses"}
        </h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Expenses</span>
        </div>
      </div>

      {showNewExpenseForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Expense Details</h2>
            <button
              onClick={() => {
                setShowNewExpenseForm(false);
                setEditingExpense(null);
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
                  Category *
                </label>
                <select
                  name="category"
                  value={newExpense.category}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newExpense.name}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={newExpense.customerName}
                    onChange={handleNewExpenseChange}
                    className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <input
                  type="text"
                  name="project"
                  value={newExpense.project}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  name="paymentMode"
                  value={newExpense.paymentMode}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Payment Mode</option>
                  {paymentModeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isInvoiced"
                checked={newExpense.isInvoiced}
                onChange={handleNewExpenseChange}
                className="mr-2"
                id="isInvoiced"
              />
              <label htmlFor="isInvoiced" className="text-sm text-gray-700">
                Is Invoiced
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowNewExpenseForm(false);
                setEditingExpense(null);
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExpense}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : editingExpense
                ? "Update Expense"
                : "Save Expense"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.total)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaReceipt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Billable Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Billable</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.billable)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaReceipt className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Not Invoiced Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Not Invoiced</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.notInvoiced)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaReceipt className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm rounded flex items-center gap-2"
                style={{ backgroundColor: "#333333", color: "white" }}
                onClick={() => setShowNewExpenseForm(true)}
              >
                <FaPlus /> New Expense
              </button>
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={handleImportClick}
              >
                Import Expenses
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={() => setCompactView(!compactView)}
              >
                {compactView ? "<<" : ">>"}
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div
            className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
              compactView ? "w-1/2" : "w-full"
            }`}
          >
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedExpenses.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected ({selectedExpenses.length})
                  </button>
                )}

                {/* Entries per page */}
                <select
                  className="border rounded px-2 py-1 text-sm"
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
                    className="border px-2 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <HiOutlineDownload /> Export
                  </button>

                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div
                      ref={exportMenuRef}
                      className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10"
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
                  className="border px-2.5 py-1.5 rounded text-sm flex items-center"
                  onClick={fetchExpenses}
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
                  className="border rounded pl-8 pr-3 py-1 text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedExpenses.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses(currentData.map((c) => c._id));
                          } else {
                            setSelectedExpenses([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Category
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Name
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Project
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Invoiced
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Payment Mode
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((expense) => (
                    <tr
                      key={expense._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(expense._id)}
                            onChange={() => toggleExpenseSelection(expense._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0">{expense.category}</td>
                      <td className="p-3 border-0">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="p-3 border-0">{expense.name}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            {expense.customer
                              ? expense.customer.company
                              : "N/A"}
                          </td>
                          <td className="p-3 border-0">{expense.date}</td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">{expense.date}</td>
                          <td className="p-3 border-0">
                            {expense.project || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {expense.customer
                              ? expense.customer.company
                              : "N/A"}
                            {expense.customer && (
                              <div className="text-xs text-gray-500">
                                {expense.customer.contact} •{" "}
                                {expense.customer.email}
                              </div>
                            )}
                          </td>
                          <td className="p-3 border-0">
                            {expense.isInvoiced ? (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-0">
                            {expense.paymentMode || "-"}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-red-500 hover:text-red-700"
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredExpenses.length)}{" "}
                of {filteredExpenses.length} entries
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="flex space-x-1">
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
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === pageNum
                            ? "bg-gray-800 text-white"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 py-1">...</span>
                      <button
                        className="px-3 py-1 border rounded text-sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Expenses</h3>
              <button
                onClick={closeImportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {importProgress ? (
              <div className="text-center py-4">
                <div className="text-blue-500 mb-2">
                  {importProgress.message}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>
            ) : importResult ? (
              <div
                className={`p-4 rounded mb-4 ${
                  importResult.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {importResult.success ? (
                  <>
                    <p className="font-semibold">
                      Import completed successfully!
                    </p>
                    <p className="mt-2">
                      Imported: {importResult.imported} expenses
                    </p>
                    {importResult.errorCount > 0 && (
                      <p className="mt-1">Errors: {importResult.errorCount}</p>
                    )}
                    {importResult.errorMessages &&
                      importResult.errorMessages.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Error details:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {importResult.errorMessages.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                ) : (
                  <p>Error: {importResult.message}</p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Upload an Excel or CSV file with expense data. The file
                    should include columns for: Category, Amount, Name, Date,
                    Project, Customer, IsInvoiced, and PaymentMode.
                  </p>
                  <a
                    href="/expenses-template.xlsx"
                    download
                    className="text-blue-500 text-sm flex items-center gap-1 mb-3"
                  >
                    <HiOutlineDownload /> Download template
                  </a>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="w-full border rounded p-2"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeImportModal}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!importFile}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
