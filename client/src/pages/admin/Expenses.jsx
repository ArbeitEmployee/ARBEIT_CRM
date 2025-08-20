import { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaFilter, FaSearch, FaSyncAlt, FaChevronRight, 
  FaTimes, FaEdit, FaTrash, FaChevronDown, FaFileImport,
  FaReceipt
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExpensesPage = () => {
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    billable: 0,
    nonBillable: 0,
    notInvoiced: 0
  });
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    name: "",
    hasReceipt: false,
    date: "",
    project: "",
    customer: "",
    isInvoiced: false,
    referenceId: "",
    paymentMode: ""
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
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
    "Other"
  ];

  const paymentModeOptions = [
    "CASH",
    "BANK",
    "CREDIT CARD",
    "DEBIT CARD",
    "DIGITAL WALLET",
    "OTHER"
  ];

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      // For demo purposes, using dummy data
      const dummyExpenses = [
        {
          _id: "EXP-001",
          category: "Travel Expense",
          amount: 2234.00,
          name: "Makibul Hossain Tamim",
          hasReceipt: true,
          date: "18-08-2025",
          project: "Project",
          customer: "RFL Group, Rahul Rahman",
          isInvoiced: false,
          referenceId: "#996",
          paymentMode: "BANK"
        },
        {
          _id: "EXP-002",
          category: "Meals & Entertainment",
          amount: 125.50,
          name: "John Smith",
          hasReceipt: true,
          date: "19-08-2025",
          project: "Client Meeting",
          customer: "ABC Corp, Sarah Johnson",
          isInvoiced: true,
          referenceId: "#997",
          paymentMode: "CREDIT CARD"
        },
        {
          _id: "EXP-003",
          category: "Office Supplies",
          amount: 345.75,
          name: "Emily Wilson",
          hasReceipt: false,
          date: "20-08-2025",
          project: "Office Upgrade",
          customer: "Internal",
          isInvoiced: false,
          referenceId: "#998",
          paymentMode: "CASH"
        },
        {
          _id: "EXP-004",
          category: "Travel Expense",
          amount: 1890.00,
          name: "Robert Davis",
          hasReceipt: true,
          date: "21-08-2025",
          project: "Client Visit",
          customer: "XYZ Ltd, Michael Brown",
          isInvoiced: true,
          referenceId: "#999",
          paymentMode: "BANK"
        },
        {
          _id: "EXP-005",
          category: "Software & Tools",
          amount: 499.99,
          name: "Lisa Taylor",
          hasReceipt: true,
          date: "22-08-2025",
          project: "Development",
          customer: "Tech Solutions, David Miller",
          isInvoiced: false,
          referenceId: "#1000",
          paymentMode: "DEBIT CARD"
        },
        {
          _id: "EXP-006",
          category: "Transportation",
          amount: 85.25,
          name: "James Wilson",
          hasReceipt: false,
          date: "23-08-2025",
          project: "Client Meeting",
          customer: "Global Inc, Jennifer Lee",
          isInvoiced: true,
          referenceId: "#1001",
          paymentMode: "CASH"
        },
        {
          _id: "EXP-007",
          category: "Accommodation",
          amount: 320.00,
          name: "Makibul Hossain Tamim",
          hasReceipt: true,
          date: "24-08-2025",
          project: "Business Trip",
          customer: "RFL Group, Rahul Rahman",
          isInvoiced: false,
          referenceId: "#1002",
          paymentMode: "BANK"
        },
        {
          _id: "EXP-008",
          category: "Training & Education",
          amount: 750.00,
          name: "Sarah Johnson",
          hasReceipt: true,
          date: "25-08-2025",
          project: "Skill Development",
          customer: "Internal",
          isInvoiced: true,
          referenceId: "#1003",
          paymentMode: "BANK"
        },
        {
          _id: "EXP-009",
          category: "Communication",
          amount: 45.00,
          name: "Michael Brown",
          hasReceipt: false,
          date: "26-08-2025",
          project: "Client Call",
          customer: "ABC Corp, Sarah Johnson",
          isInvoiced: false,
          referenceId: "#1004",
          paymentMode: "DIGITAL WALLET"
        },
        {
          _id: "EXP-010",
          category: "Other",
          amount: 120.50,
          name: "David Miller",
          hasReceipt: true,
          date: "27-08-2025",
          project: "Miscellaneous",
          customer: "Tech Solutions, David Miller",
          isInvoiced: true,
          referenceId: "#1005",
          paymentMode: "CREDIT CARD"
        }
      ];
      
      setExpenses(dummyExpenses);
      
      // Calculate stats
      const total = dummyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const billable = dummyExpenses
        .filter(expense => expense.isInvoiced)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const nonBillable = total - billable;
      const notInvoiced = dummyExpenses
        .filter(expense => !expense.isInvoiced)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      setStats({
        total,
        billable,
        nonBillable,
        notInvoiced
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
      setStats({
        total: 0,
        billable: 0,
        nonBillable: 0,
        notInvoiced: 0
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Search filter
  const filteredExpenses = expenses.filter(expense => 
    expense._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setSelectedExpenses(prev =>
      prev.includes(id)
        ? prev.filter(expenseId => expenseId !== id)
        : [...prev, id]
    );
  };

  const handleNewExpenseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExpense(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSaveExpense = async () => {
    if (isSaving) return;
    
    if (!newExpense.category || !newExpense.amount || !newExpense.name) {
      alert("Please fill in all required fields (Category, Amount, Name)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingExpense) {
        // Update existing expense
        // await axios.put(`http://localhost:5000/api/expenses/${editingExpense._id}`, newExpense);
        setShowNewExpenseForm(false);
        setEditingExpense(null);
        fetchExpenses();
        alert("Expense updated successfully!");
      } else {
        // Create new expense
        // await axios.post("http://localhost:5000/api/expenses", newExpense);
        setShowNewExpenseForm(false);
        fetchExpenses();
        alert("Expense created successfully!");
      }
      
      // Reset form
      setNewExpense({
        category: "",
        amount: "",
        name: "",
        hasReceipt: false,
        date: "",
        project: "",
        customer: "",
        isInvoiced: false,
        referenceId: "",
        paymentMode: ""
      });
    } catch (error) {
      console.error("Error saving expense:", error);
      alert(`Error saving expense: ${error.response?.data?.message || error.message}`);
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
      hasReceipt: expense.hasReceipt,
      date: expense.date,
      project: expense.project,
      customer: expense.customer,
      isInvoiced: expense.isInvoiced,
      referenceId: expense.referenceId,
      paymentMode: expense.paymentMode
    });
    setShowNewExpenseForm(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        // await axios.delete(`http://localhost:5000/api/expenses/${id}`);
        fetchExpenses();
        alert("Expense deleted successfully!");
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(`Error deleting expense: ${error.response?.data?.message || error.message}`);
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
    formData.append('file', importFile);

    try {
      setImportProgress({ status: 'uploading', message: 'Uploading file...' });
      
      // Simulate API call
      setTimeout(() => {
        setImportProgress(null);
        setImportResult({
          success: true,
          imported: 5,
          errorCount: 0,
          errorMessages: []
        });
        
        // Refresh expense list
        fetchExpenses();
      }, 1500);
    } catch (error) {
      console.error("Error importing expenses:", error);
      setImportProgress(null);
      setImportResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Import failed'
      });
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportProgress(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredExpenses.map(expense => ({
      ID: expense._id,
      Category: expense.category,
      Amount: expense.amount,
      Name: expense.name,
      Receipt: expense.hasReceipt ? "YES" : "NO",
      Date: expense.date,
      Project: expense.project,
      Customer: expense.customer,
      Invoiced: expense.isInvoiced ? "YES" : "NO",
      'Reference ID': expense.referenceId,
      'Payment Mode': expense.paymentMode
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "Expenses.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredExpenses.map(expense => ({
      ID: expense._id,
      Category: expense.category,
      Amount: expense.amount,
      Name: expense.name,
      Receipt: expense.hasReceipt ? "YES" : "NO",
      Date: expense.date,
      Project: expense.project,
      Customer: expense.customer,
      Invoiced: expense.isInvoiced ? "YES" : "NO",
      'Reference ID': expense.referenceId,
      'Payment Mode': expense.paymentMode
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Expenses.csv');
    link.style.visibility = 'hidden';
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
      "Receipt",
      "Date",
      "Project",
      "Customer",
      "Invoiced",
      "Reference ID",
      "Payment Mode"
    ];
    
    const tableRows = filteredExpenses.map(expense => [
      expense._id,
      expense.category,
      `$${expense.amount.toFixed(2)}`,
      expense.name,
      expense.hasReceipt ? "YES" : "NO",
      expense.date,
      expense.project,
      expense.customer,
      expense.isInvoiced ? "YES" : "NO",
      expense.referenceId,
      expense.paymentMode
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Expenses.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=1000');
    printWindow.document.write('<html><head><title>Expenses</title>');
    printWindow.document.write('<style>');
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
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Expenses</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Category', 'Amount', 'Name', 'Receipt', 'Date', 'Project', 'Customer', 'Invoiced', 'Reference ID', 'Payment Mode'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredExpenses.forEach(expense => {
      printWindow.document.write('<tr>');
      [
        expense._id,
        expense.category,
        `$${expense.amount.toFixed(2)}`,
        expense.name,
        expense.hasReceipt ? "YES" : "NO",
        expense.date,
        expense.project,
        expense.customer,
        expense.isInvoiced ? "YES" : "NO",
        expense.referenceId,
        expense.paymentMode
      ].forEach(value => {
        printWindow.document.write(`<td>${value}</td>`);
      });
      printWindow.document.write('</tr>');
    });
    printWindow.document.write('</tbody>');
    
    printWindow.document.write('</table>');
    printWindow.document.write('<p class="no-print">Printed on: ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
    setShowExportMenu(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewExpenseForm ? (editingExpense ? "Edit Expense" : "Add New Expense") : "Expenses"}</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={newExpense.category}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  name="date"
                  value={newExpense.date}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <input
                  type="text"
                  name="project"
                  value={newExpense.project}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  type="text"
                  name="customer"
                  value={newExpense.customer}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
                <input
                  type="text"
                  name="referenceId"
                  value={newExpense.referenceId}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={newExpense.paymentMode}
                  onChange={handleNewExpenseChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Payment Mode</option>
                  {paymentModeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasReceipt"
                    checked={newExpense.hasReceipt}
                    onChange={handleNewExpenseChange}
                    className="h-4 w-4"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Has Receipt</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isInvoiced"
                    checked={newExpense.isInvoiced}
                    onChange={handleNewExpenseChange}
                    className="h-4 w-4"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Invoiced</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewExpenseForm(false);
                setEditingExpense(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveExpense}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newExpense.category || !newExpense.amount || !newExpense.name || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaReceipt className="text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <button className="text-xs text-gray-500 flex items-center">
                  <FaFilter className="mr-1" /> Filter
                </button>
              </div>
            </div>

            {/* Billable Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Billable</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.billable)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaReceipt className="text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <button className="text-xs text-gray-500 flex items-center">
                  <FaSearch className="mr-1" /> Search
                </button>
              </div>
            </div>

            {/* Non Billable Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Non Billable</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.nonBillable)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaReceipt className="text-red-600" />
                </div>
              </div>
              <div className="mt-2">
                <button className="text-xs text-gray-500 flex items-center">
                  <span className="line-through">Billed</span>
                </button>
              </div>
            </div>

            {/* Not Invoiced Expenses */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Not Invoiced</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.notInvoiced)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaReceipt className="text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <button className="text-xs text-gray-500 flex items-center">
                  <FaFileImport className="mr-1" /> Import
                </button>
              </div>
            </div>
          </div>

          {/* White box for table */}
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`} 
               style={{ borderRadius: '8px', border: '1px solid #E0E0E0', backgroundColor: '#F2F4F7' }}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Entries per page */}
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                {/* Filter button */}
                <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
                  <FaFilter /> Filter
                </button>
                
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

              <div className="flex items-center gap-2">
                {/* Arrow button */}
                <button
                  className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                  onClick={() => setCompactView(!compactView)}
                >
                  {compactView ? "<<" : ">>"}
                </button>

                {/* New Expense button */}
                <button 
                  className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                  onClick={() => setShowNewExpenseForm(true)}
                >
                  <FaPlus /> New Expense
                </button>
                
                {/* Import Expenses button */}
                <button 
                  className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                  onClick={handleImportClick}
                >
                  <FaFileImport /> Import Expenses
                </button>
                
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
                    <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
                  className="border px-2 py-1 rounded text-sm flex items-center"
                  onClick={fetchExpenses}
                >
                  <FaSyncAlt />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Bulk delete button */}
              {selectedExpenses.length > 0 && (
                <div className="p-2 border bg-red-50 mb-2 rounded-lg">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedExpenses.length} selected expenses?`)) {
                        try {
                          // await Promise.all(selectedExpenses.map(id =>
                          //   axios.delete(`http://localhost:5000/api/expenses/${id}`)
                          // ));
                          setSelectedExpenses([]);
                          fetchExpenses();
                          alert("Selected expenses deleted!");
                        } catch {
                          alert("Error deleting selected expenses.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedExpenses.length})
                  </button>
                </div>
              )}
              
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses(currentData.map(c => c._id));
                          } else {
                            setSelectedExpenses([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Category</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Name</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Receipt</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Receipt</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Invoice</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Reference ID</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Payment Mode</th>
                      </>
                    )}
                  </tr>
                </thead>
                
                <tbody>
                  {currentData.map((expense) => (
                    <tr 
                      key={expense._id} 
                      className="hover:bg-gray-50 relative"
                      onMouseEnter={() => setHoveredRow(expense._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: 'white', color: 'black' }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(expense._id)}
                            onChange={() => toggleExpenseSelection(expense._id)}
                            className="h-4 w-4"
                          />
                          {hoveredRow === expense._id && (
                            <div className="absolute left-8 flex space-x-1 bg-white shadow-md rounded p-1 z-10">
                              <button 
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-0 font-medium">{expense.category}</td>
                      <td className="p-3 border-0 font-bold">{formatCurrency(expense.amount)}</td>
                      <td className="p-3 border-0">{expense.name}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${expense.hasReceipt ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {expense.hasReceipt ? "YES" : "NO"}
                            </span>
                          </td>
                          <td className="p-3 border-0">{expense.date}</td>
                          <td className="p-3 rounded-r-lg border-0">{expense.project}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${expense.hasReceipt ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {expense.hasReceipt ? "YES" : "NO"}
                            </span>
                          </td>
                          <td className="p-3 border-0">{expense.date}</td>
                          <td className="p-3 border-0">{expense.project}</td>
                          <td className="p-3 border-0">{expense.customer}</td>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${expense.isInvoiced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {expense.isInvoiced ? "YES" : "NO"}
                            </span>
                          </td>
                          <td className="p-3 border-0">{expense.referenceId}</td>
                          <td className="p-3 rounded-r-lg border-0">{expense.paymentMode}</td>
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
                {Math.min(startIndex + entriesPerPage, filteredExpenses.length)} of{" "}
                {filteredExpenses.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1 ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
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

      {/* Import Expenses Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Expenses</h2>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your CSV data should include <strong>Category</strong>, <strong>Amount</strong>, and <strong>Name</strong> columns.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="cursor-pointer block"
                >
                  {importFile ? (
                    <div className="text-green-600">
                      <p>Selected file: {importFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <HiOutlineDownload className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Only CSV files are accepted
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {importProgress && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p>{importProgress.message}</p>
              </div>
            )}

            {importResult && (
              <div className={`mb-4 p-3 rounded text-sm ${
                  importResult.success && (!importResult.errorCount || importResult.errorCount === 0)
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}>
                {importResult.success ? (
                  <>
                    <p>Import completed with {importResult.imported} successful and {importResult.errorCount} failed.</p>
                    {importResult.errorCount > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Show error details</summary>
                        <div className="bg-white p-2 mt-1 rounded border text-xs max-h-32 overflow-auto">
                          {importResult.errorMessages?.map((msg, i) => (
                            <p key={i}>{msg}</p>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <p>Error: {importResult.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importProgress}
                className={`px-4 py-2 rounded text-sm ${
                  !importFile || importProgress
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white'
                }`}
              >
                {importProgress ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;