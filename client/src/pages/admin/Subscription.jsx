import { useState, useEffect } from "react";
import { 
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight, 
  FaTimes, FaEdit, FaTrash, FaUser, FaUserCheck, 
  FaUserTimes, FaUserClock 
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SubscriptionPage = () => {
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
    futureSubscriptions: 0
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
    notes: ""
  });
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const statusOptions = [
    "Active",
    "Future",
    "Past Due",
    "Unpaid",
    "Incomplete",
    "Canceled",
    "Incomplete Expired"
  ];

  const billingCycleOptions = ["Monthly", "Quarterly", "Annual", "Custom"];

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/subscriptions");
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pastDueSubscriptions: 0,
        canceledSubscriptions: 0,
        futureSubscriptions: 0
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSubscriptions([]);
      setStats({
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pastDueSubscriptions: 0,
        canceledSubscriptions: 0,
        futureSubscriptions: 0
      });
    }
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
      const { data } = await axios.get(`http://localhost:5000/api/subscriptions/customers/search?q=${searchTerm}`);
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
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.customer && sub.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
    setSelectedSubscriptions(prev =>
      prev.includes(id)
        ? prev.filter(subscriptionId => subscriptionId !== id)
        : [...prev, id]
    );
  };

  const handleNewSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setNewSubscription(prev => ({ ...prev, [name]: value }));
    
    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewSubscription(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveSubscription = async () => {
    if (isSaving) return;
    
    if (!newSubscription.name || !newSubscription.customerId || !newSubscription.project || 
        !newSubscription.status || !newSubscription.nextBilling || !newSubscription.amount) {
      alert("Please fill in all required fields (Name, Customer, Project, Status, Next Billing, Amount)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingSubscription) {
        // Update existing subscription
        await axios.put(`http://localhost:5000/api/subscriptions/${editingSubscription._id}`, newSubscription);
        setShowNewSubscriptionForm(false);
        setEditingSubscription(null);
        fetchSubscriptions();
        alert("Subscription updated successfully!");
      } else {
        // Create new subscription
        await axios.post("http://localhost:5000/api/subscriptions", newSubscription);
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
        notes: ""
      });
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert(`Error saving subscription: ${error.response?.data?.message || error.message}`);
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
      nextBilling: subscription.nextBilling ? new Date(subscription.nextBilling).toISOString().split('T')[0] : "",
      dateSubscribed: subscription.dateSubscribed ? new Date(subscription.dateSubscribed).toISOString().split('T')[0] : "",
      lastSent: subscription.lastSent ? new Date(subscription.lastSent).toISOString().split('T')[0] : "",
      amount: subscription.amount,
      billingCycle: subscription.billingCycle || "Monthly",
      notes: subscription.notes || ""
    });
    setShowNewSubscriptionForm(true);
  };

  const handleDeleteSubscription = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        await axios.delete(`http://localhost:5000/api/subscriptions/${id}`);
        fetchSubscriptions();
        alert("Subscription deleted successfully!");
      } catch (error) {
        console.error("Error deleting subscription:", error);
        alert(`Error deleting subscription: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredSubscriptions.map(subscription => ({
      ID: subscription._id,
      Name: subscription.name,
      Customer: subscription.customer ? subscription.customer.company : "N/A",
      Project: subscription.project,
      Status: subscription.status,
      'Next Billing': subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A",
      'Date Subscribed': subscription.dateSubscribed ? new Date(subscription.dateSubscribed).toLocaleDateString() : "N/A",
      'Last Sent': subscription.lastSent ? new Date(subscription.lastSent).toLocaleDateString() : "N/A",
      Amount: subscription.amount,
      'Billing Cycle': subscription.billingCycle
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");
    XLSX.writeFile(workbook, "Subscriptions.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredSubscriptions.map(subscription => ({
      ID: subscription._id,
      Name: subscription.name,
      Customer: subscription.customer ? subscription.customer.company : "N/A",
      Project: subscription.project,
      Status: subscription.status,
      'Next Billing': subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A",
      'Date Subscribed': subscription.dateSubscribed ? new Date(subscription.dateSubscribed).toLocaleDateString() : "N/A",
      'Last Sent': subscription.lastSent ? new Date(subscription.lastSent).toLocaleDateString() : "N/A",
      Amount: subscription.amount,
      'Billing Cycle': subscription.billingCycle
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Subscriptions.csv');
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
      "Name",
      "Customer",
      "Project",
      "Status",
      "Next Billing",
      "Amount",
      "Billing Cycle"
    ];
    
    const tableRows = filteredSubscriptions.map(subscription => [
      subscription._id,
      subscription.name,
      subscription.customer ? subscription.customer.company : "N/A",
      subscription.project,
      subscription.status,
      subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A",
      `$${subscription.amount}`,
      subscription.billingCycle
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Subscriptions.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Subscriptions</title>');
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
    printWindow.document.write('<h1>Subscriptions</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Name', 'Customer', 'Project', 'Status', 'Next Billing', 'Amount', 'Billing Cycle'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredSubscriptions.forEach(subscription => {
      printWindow.document.write('<tr>');
      [
        subscription._id,
        subscription.name,
        subscription.customer ? subscription.customer.company : "N/A",
        subscription.project,
        subscription.status,
        subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A",
        `$${subscription.amount}`,
        subscription.billingCycle
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
      case "Active": return "bg-green-100 text-green-800";
      case "Future": return "bg-blue-100 text-blue-800";
      case "Past Due": return "bg-red-100 text-red-800";
      case "Unpaid": return "bg-orange-100 text-orange-800";
      case "Incomplete": return "bg-yellow-100 text-yellow-800";
      case "Canceled": return "bg-gray-100 text-gray-800";
      case "Incomplete Expired": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewSubscriptionForm ? (editingSubscription ? "Edit Subscription" : "Add New Subscription") : "Subscriptions"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Subscriptions</span>
        </div>
      </div>

      {showNewSubscriptionForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newSubscription.name}
                  onChange={handleNewSubscriptionChange}
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
                    value={newSubscription.customerName}
                    onChange={handleNewSubscriptionChange}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <input
                  type="text"
                  name="project"
                  value={newSubscription.project}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={newSubscription.amount}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                <select
                  name="billingCycle"
                  value={newSubscription.billingCycle}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {billingCycleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  name="status"
                  value={newSubscription.status}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Cycle *</label>
                <input
                  type="date"
                  name="nextBilling"
                  value={newSubscription.nextBilling}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Subscribed</label>
                <input
                  type="date"
                  name="dateSubscribed"
                  value={newSubscription.dateSubscribed}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Sent</label>
                <input
                  type="date"
                  name="lastSent"
                  value={newSubscription.lastSent}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={newSubscription.notes}
              onChange={handleNewSubscriptionChange}
              className="w-full border rounded px-3 py-2"
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowNewSubscriptionForm(false);
                setEditingSubscription(null);
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubscription}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded text-sm"
            >
              {isSaving ? "Saving..." : (editingSubscription ? "Update Subscription" : "Save")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.totalSubscriptions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUser className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active</p>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUserCheck className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Past Due Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Past Due</p>
                  <p className="text-2xl font-bold">{stats.pastDueSubscriptions}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaUserTimes className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Canceled Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Canceled</p>
                  <p className="text-2xl font-bold">{stats.canceledSubscriptions}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaUserTimes className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Future Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Future</p>
                  <p className="text-2xl font-bold">{stats.futureSubscriptions}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaUserClock className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewSubscriptionForm(true)}
              >
                <FaPlus /> New Subscription
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
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">

                
                {/* --- ADD THIS BLOCK: Delete Selected button before the select --- */}
      {selectedSubscriptions.length > 0 && (
        <button
          className="bg-red-600 text-white px-3 py-1 rounded"
          onClick={async () => {
            if (window.confirm(`Delete ${selectedSubscriptions.length} selected subscriptions?`)) {
              try {
                await Promise.all(selectedSubscriptions.map(id =>
                  axios.delete(`http://localhost:5000/api/subscriptions/${id}`)
                ));
                setSelectedSubscriptions([]);
                fetchSubscriptions();
                alert("Selected subscriptions deleted!");
              } catch {
                alert("Error deleting selected subscriptions.");
              }
            }
          }}
        >
          Delete Selected ({selectedSubscriptions.length})
        </button>
      )}
      {/* --- END BLOCK --- */}




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
                  className="border rounded pl-8 pr-3 py-1 text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              
              {/* Bulk delete button */}
              {/*
              {selectedSubscriptions.length > 0 && (
                <tr>
                  <td colSpan={compactView ? 8 : 10} className="p-2 border bg-red-50">
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded"
                      onClick={async () => {
                        if (window.confirm(`Delete ${selectedSubscriptions.length} selected subscriptions?`)) {
                          try {
                            await Promise.all(selectedSubscriptions.map(id =>
                              axios.delete(`http://localhost:5000/api/subscriptions/${id}`)
                            ));
                            setSelectedSubscriptions([]);
                            fetchSubscriptions();
                            alert("Selected subscriptions deleted!");
                          } catch {
                            alert("Error deleting selected subscriptions.");
                          }
                        }
                      }}
                    >
                      Delete Selected ({selectedSubscriptions.length})
                    </button>
                  </td>
                </tr>
              )}
              */}
         
              
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubscriptions(currentData.map(c => c._id));
                          } else {
                            setSelectedSubscriptions([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Name</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Next Billing</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Next Billing</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Billing Cycle</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Subscribed</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((subscription) => (
                    <tr
                      key={subscription._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: 'black' }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.includes(subscription._id)}
                            onChange={() => toggleSubscriptionSelection(subscription._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0">{subscription.name}</td>
                      <td className="p-3 border-0">
                        {subscription.customer ? subscription.customer.company : "N/A"}
                        {subscription.customer && (
                          <div className="text-xs text-gray-500">
                            {subscription.customer.contact} • {subscription.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-0">{subscription.project}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subscription.status)}`}>
                              {subscription.status}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-3 border-0">
                            ${subscription.amount}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditSubscription(subscription)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(subscription._id)}
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
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subscription.status)}`}>
                              {subscription.status}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-3 border-0">
                            ${subscription.amount}
                          </td>
                          <td className="p-3 border-0">
                            {subscription.billingCycle}
                          </td>
                          <td className="p-3 border-0 whitespace-nowrap">
                            {subscription.dateSubscribed ? new Date(subscription.dateSubscribed).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditSubscription(subscription)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(subscription._id)}
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
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredSubscriptions.length)} of{" "}
                {filteredSubscriptions.length} entries
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
    </div>
  );
};

export default SubscriptionPage;