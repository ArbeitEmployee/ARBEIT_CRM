import { useState, useEffect } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaCheckCircle, FaClock, FaPauseCircle, FaBan, FaCheckSquare,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EstimateRequestPage = () => {
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
    expired: 0
  });
  const [newEstimate, setNewEstimate] = useState({
    estimateNumber: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    projectName: "",
    amount: "",
    tags: "",
    createdDate: new Date().toISOString().split('T')[0],
    validUntil: "",
    status: "Draft"
  });
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const statusOptions = [
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
    "Expired"
  ];

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Format date from DD-MM-YYYY to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Generate a unique estimate number
  const generateEstimateNumber = () => {
    const prefix = "EST";
    const timestamp = new Date().getTime().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  // Fetch estimates from API (using dummy data for this example)
  const fetchEstimates = async () => {
    try {
      // In a real application, you would fetch from an API
      // const { data } = await axios.get("http://localhost:5000/api/estimates");
      
      // Using dummy data for demonstration
      const dummyEstimates = [
        {
          _id: "1",
          estimateNumber: "EST-001",
          customerId: "CUST001",
          customer: {
            company: "Acme Corp",
            contact: "John Doe",
            email: "john@acme.com",
            phone: "555-1234"
          },
          projectName: "Website Redesign",
          amount: 2500,
          tags: "urgent, design",
          createdDate: "2023-10-15",
          validUntil: "2023-11-15",
          status: "Sent"
        },
        {
          _id: "2",
          estimateNumber: "EST-002",
          customerId: "CUST002",
          customer: {
            company: "XYZ Ltd",
            contact: "Jane Smith",
            email: "jane@xyz.com",
            phone: "555-5678"
          },
          projectName: "Mobile App Development",
          amount: 5000,
          tags: "development",
          createdDate: "2023-10-10",
          validUntil: "2023-11-10",
          status: "Accepted"
        },
        {
          _id: "3",
          estimateNumber: "EST-003",
          customerId: "CUST003",
          customer: {
            company: "ABC Inc",
            contact: "Bob Johnson",
            email: "bob@abc.com",
            phone: "555-9012"
          },
          projectName: "SEO Optimization",
          amount: 1200,
          tags: "marketing",
          createdDate: "2023-10-05",
          validUntil: "2023-11-05",
          status: "Draft"
        },
        {
          _id: "4",
          estimateNumber: "EST-004",
          customerId: "CUST004",
          customer: {
            company: "Tech Solutions",
            contact: "Alice Brown",
            email: "alice@tech.com",
            phone: "555-3456"
          },
          projectName: "E-commerce Platform",
          amount: 7500,
          tags: "urgent, development",
          createdDate: "2023-10-01",
          validUntil: "2023-11-01",
          status: "Rejected"
        },
        {
          _id: "5",
          estimateNumber: "EST-005",
          customerId: "CUST005",
          customer: {
            company: "Global Services",
            contact: "Charlie Wilson",
            email: "charlie@global.com",
            phone: "555-7890"
          },
          projectName: "CRM Implementation",
          amount: 3000,
          tags: "business",
          createdDate: "2023-09-25",
          validUntil: "2023-10-25",
          status: "Expired"
        }
      ];

      const dummyStats = {
        totalEstimates: 5,
        draft: 1,
        sent: 1,
        accepted: 1,
        rejected: 1,
        expired: 1
      };

      setEstimates(dummyEstimates);
      setStats(dummyStats);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      setEstimates([]);
      setStats({
        totalEstimates: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0
      });
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCustomerSearchResults([]);
      return;
    }
    
    try {
      // In a real application, you would fetch from an API
      // const { data } = await axios.get(`http://localhost:5000/api/estimates/customers/search?q=${searchTerm}`);
      
      // Using dummy data for demonstration
      const dummyCustomers = [
        {
          _id: "CUST001",
          company: "Acme Corp",
          contact: "John Doe",
          email: "john@acme.com",
          phone: "555-1234"
        },
        {
          _id: "CUST002",
          company: "XYZ Ltd",
          contact: "Jane Smith",
          email: "jane@xyz.com",
          phone: "555-5678"
        },
        {
          _id: "CUST003",
          company: "ABC Inc",
          contact: "Bob Johnson",
          email: "bob@abc.com",
          phone: "555-9012"
        }
      ].filter(customer => 
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setCustomerSearchResults(dummyCustomers);
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
  const filteredEstimates = estimates.filter(estimate => 
    estimate.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (estimate.customer && estimate.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estimate.tags && estimate.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
    setSelectedEstimates(prev =>
      prev.includes(id)
        ? prev.filter(estimateId => estimateId !== id)
        : [...prev, id]
    );
  };

  const handleNewEstimateChange = (e) => {
    const { name, value } = e.target;
    setNewEstimate(prev => ({ ...prev, [name]: value }));
    
    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewEstimate(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company,
      customerEmail: customer.email,
      customerPhone: customer.phone
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveEstimate = async () => {
    if (isSaving) return;
    
    if (!newEstimate.projectName || !newEstimate.customerId) {
      alert("Please fill in all required fields (Project Name, Customer)");
      return;
    }

    setIsSaving(true);
    
    // Format dates for backend
    const estimateData = {
      ...newEstimate,
      estimateNumber: newEstimate.estimateNumber || generateEstimateNumber(),
      validUntil: formatDateForBackend(newEstimate.validUntil)
    };
    
    try {
      if (editingEstimate) {
        // Update existing estimate
        // await axios.put(`http://localhost:5000/api/estimates/${editingEstimate._id}`, estimateData);
        setShowNewEstimateForm(false);
        setEditingEstimate(null);
        fetchEstimates();
        alert("Estimate updated successfully!");
      } else {
        // Create new estimate
        // await axios.post("http://localhost:5000/api/estimates", estimateData);
        setShowNewEstimateForm(false);
        fetchEstimates();
        alert("Estimate created successfully!");
      }
      
      // Reset form
      setNewEstimate({
        estimateNumber: "",
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        projectName: "",
        amount: "",
        tags: "",
        createdDate: new Date().toISOString().split('T')[0],
        validUntil: "",
        status: "Draft"
      });
    } catch (error) {
      console.error("Error saving estimate:", error);
      alert(`Error saving estimate: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEstimate = (estimate) => {
    setEditingEstimate(estimate);
    setNewEstimate({
      estimateNumber: estimate.estimateNumber,
      customerId: estimate.customerId,
      customerName: estimate.customer ? estimate.customer.company : "",
      customerEmail: estimate.customer ? estimate.customer.email : "",
      customerPhone: estimate.customer ? estimate.customer.phone : "",
      projectName: estimate.projectName,
      amount: estimate.amount,
      tags: estimate.tags || "",
      createdDate: formatDateForInput(estimate.createdDate),
      validUntil: formatDateForInput(estimate.validUntil),
      status: estimate.status
    });
    setShowNewEstimateForm(true);
  };

  const handleDeleteEstimate = async (id) => {
    if (window.confirm("Are you sure you want to delete this estimate?")) {
      try {
        // await axios.delete(`http://localhost:5000/api/estimates/${id}`);
        fetchEstimates();
        alert("Estimate deleted successfully!");
      } catch (error) {
        console.error("Error deleting estimate:", error);
        alert(`Error deleting estimate: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredEstimates.map(estimate => ({
      "Estimate #": estimate.estimateNumber,
      "Project Name": estimate.projectName,
      Customer: estimate.customer ? estimate.customer.company : "N/A",
      "Customer Email": estimate.customer ? estimate.customer.email : "N/A",
      "Customer Phone": estimate.customer ? estimate.customer.phone : "N/A",
      Amount: estimate.amount,
      Tags: estimate.tags,
      "Created Date": estimate.createdDate,
      "Valid Until": estimate.validUntil,
      Status: estimate.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
    XLSX.writeFile(workbook, "Estimates.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredEstimates.map(estimate => ({
      "Estimate #": estimate.estimateNumber,
      "Project Name": estimate.projectName,
      Customer: estimate.customer ? estimate.customer.company : "N/A",
      "Customer Email": estimate.customer ? estimate.customer.email : "N/A",
      "Customer Phone": estimate.customer ? estimate.customer.phone : "N/A",
      Amount: estimate.amount,
      Tags: estimate.tags,
      "Created Date": estimate.createdDate,
      "Valid Until": estimate.validUntil,
      Status: estimate.status
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Estimates.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Estimate #",
      "Project Name",
      "Customer",
      "Amount",
      "Created Date",
      "Valid Until",
      "Status"
    ];
    
    const tableRows = filteredEstimates.map(estimate => [
      estimate.estimateNumber,
      estimate.projectName,
      estimate.customer ? estimate.customer.company : "N/A",
      `$${estimate.amount}`,
      estimate.createdDate,
      estimate.validUntil,
      estimate.status
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Estimates.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Estimate Requests</title>');
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
    printWindow.document.write('<h1>Estimate Requests</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['Estimate #', 'Project Name', 'Customer', 'Amount', 'Created Date', 'Valid Until', 'Status'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredEstimates.forEach(estimate => {
      printWindow.document.write('<tr>');
      [
        estimate.estimateNumber,
        estimate.projectName,
        estimate.customer ? estimate.customer.company : "N/A",
        `$${estimate.amount}`,
        estimate.createdDate,
        estimate.validUntil,
        estimate.status
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

  const getStatusColor = (status) => {
    switch(status) {
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Sent": return "bg-blue-100 text-blue-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Expired": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewEstimateForm ? (editingEstimate ? "Edit Estimate" : "Add New Estimate") : "Estimate Requests"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Estimates</span>
        </div>
      </div>

      {showNewEstimateForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Estimate Details</h2>
            <button 
              onClick={() => {
                setShowNewEstimateForm(false);
                setEditingEstimate(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Number</label>
                <input
                  type="text"
                  name="estimateNumber"
                  value={newEstimate.estimateNumber}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Will be auto-generated if empty"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  value={newEstimate.projectName}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="customerName"
                    value={newEstimate.customerName}
                    onChange={handleNewEstimateChange}
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
                          <div className="text-sm text-gray-600">{customer.contact} - {customer.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown && customerSearchResults.length === 0 && customerSearchTerm.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
                      <div className="px-3 py-2 text-gray-500">No customers found</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={newEstimate.customerEmail}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={newEstimate.customerPhone}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newEstimate.amount}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={newEstimate.tags}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., urgent, design, development"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <input
                  type="date"
                  name="createdDate"
                  value={newEstimate.createdDate}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={newEstimate.validUntil}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newEstimate.status}
                  onChange={handleNewEstimateChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewEstimateForm(false);
                setEditingEstimate(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEstimate}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newEstimate.projectName || !newEstimate.customerId || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Estimates */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Estimates</p>
                  <p className="text-2xl font-bold">{stats.totalEstimates}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaFileInvoiceDollar className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Draft */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Draft</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaClock className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Sent */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Sent</p>
                  <p className="text-2xl font-bold">{stats.sent}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaSyncAlt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Accepted */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Accepted</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaCheckCircle className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaBan className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Expired */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Expired</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaPauseCircle className="text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewEstimateForm(true)}
              >
                <FaPlus /> New Estimate
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
          <div className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
              {selectedEstimates.length > 0 && (
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={async () => {
                    if (window.confirm(`Delete ${selectedEstimates.length} selected estimates?`)) {
                      try {
                        // await Promise.all(selectedEstimates.map(id =>
                        //   axios.delete(`http://localhost:5000/api/estimates/${id}`)
                        // ));
                        setSelectedEstimates([]);
                        fetchEstimates();
                        alert("Selected estimates deleted!");
                      } catch {
                        alert("Error deleting selected estimates.");
                      }
                    }
                  }}
                >
                  Delete Selected ({selectedEstimates.length})
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
                  onClick={fetchEstimates}
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
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedEstimates.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEstimates(currentData.map((estimate) => estimate._id));
                          } else {
                            setSelectedEstimates([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Estimate #</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project Name</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer Email</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer Phone</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tags</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Created Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Valid Until</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={compactView ? 7 : 12} className="text-center py-4">
                        {searchTerm ? "No matching estimates found." : "No estimates available."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((estimate) => (
                      <tr key={estimate._id} className="hover:bg-gray-50">
                        <td className="p-3 rounded-l-lg bg-white">
                          <input
                            type="checkbox"
                            checked={selectedEstimates.includes(estimate._id)}
                            onChange={() => toggleEstimateSelection(estimate._id)}
                          />
                        </td>
                        <td className="p-3 bg-white">{estimate.estimateNumber}</td>
                        <td className="p-3 bg-white">{estimate.projectName}</td>
                        <td className="p-3 bg-white">
                          {estimate.customer ? estimate.customer.company : "N/A"}
                        </td>
                        {compactView ? (
                          <>
                            <td className="p-3 bg-white">{formatCurrency(estimate.amount)}</td>
                            <td className="p-3 bg-white">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(estimate.status)}`}>
                                {estimate.status}
                              </span>
                            </td>
                            <td className="p-3 bg-white rounded-r-lg">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditEstimate(estimate)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteEstimate(estimate._id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 bg-white">
                              {estimate.customer ? estimate.customer.email : "N/A"}
                            </td>
                            <td className="p-3 bg-white">
                              {estimate.customer ? estimate.customer.phone : "N/A"}
                            </td>
                            <td className="p-3 bg-white">{formatCurrency(estimate.amount)}</td>
                            <td className="p-3 bg-white">
                              {estimate.tags && estimate.tags.split(',').map((tag, index) => (
                                <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                  {tag.trim()}
                                </span>
                              ))}
                            </td>
                            <td className="p-3 bg-white">{formatDate(estimate.createdDate)}</td>
                            <td className="p-3 bg-white">{formatDate(estimate.validUntil)}</td>
                            <td className="p-3 bg-white">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(estimate.status)}`}>
                                {estimate.status}
                              </span>
                            </td>
                            <td className="p-3 bg-white rounded-r-lg">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditEstimate(estimate)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteEstimate(estimate._id)}
                                  className="text-red-600 hover:text-red-800"
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
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredEstimates.length)} of {filteredEstimates.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                      className={`px-3 py-1 border rounded text-sm ${currentPage === pageNum ? 'bg-gray-200' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-1">...</span>
                )}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EstimateRequestPage;