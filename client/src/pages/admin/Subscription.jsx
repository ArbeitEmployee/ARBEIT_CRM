import { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaFilter, FaSearch, FaSyncAlt, FaChevronRight, 
  FaTimes, FaEdit, FaTrash, FaChevronDown, FaFileImport 
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
    customer: "",
    project: "",
    status: "Active",
    nextBilling: "",
    dateSubscribed: "",
    lastSent: ""
  });
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
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
    "Incomplete Expired"
  ];

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    try {
      // This would be your actual API endpoint
      // const { data } = await axios.get("http://localhost:5000/api/subscriptions");
      // setSubscriptions(data.subscriptions || []);
      
      // For demo purposes, using the dummy data
      setSubscriptions([
        {
          _id: "SUB-001",
          name: "SEO Proposal",
          customer: "Makibul Hossain Tamim",
          project: "Project name",
          status: "Active",
          nextBilling: "20-09-2025",
          dateSubscribed: "20-08-2025",
          lastSent: "20-07-2025"
        },
        {
          _id: "SUB-002",
          name: "Website Redesign",
          customer: "Jane Smith",
          project: "Corporate Site",
          status: "Past Due",
          nextBilling: "15-10-2025",
          dateSubscribed: "15-07-2025",
          lastSent: "15-09-2025"
        },
        {
          _id: "SUB-003",
          name: "Social Media Package",
          customer: "John Doe",
          project: "Brand Awareness",
          status: "Canceled",
          nextBilling: "N/A",
          dateSubscribed: "01-06-2025",
          lastSent: "01-08-2025"
        },
        {
          _id: "SUB-004",
          name: "PPC Campaign",
          customer: "Alice Johnson",
          project: "Lead Generation",
          status: "Future",
          nextBilling: "05-11-2025",
          dateSubscribed: "05-08-2025",
          lastSent: "05-10-2025"
        },
        {
          _id: "SUB-005",
          name: "Content Marketing",
          customer: "Bob Williams",
          project: "Blog Management",
          status: "Unpaid",
          nextBilling: "10-09-2025",
          dateSubscribed: "10-06-2025",
          lastSent: "10-08-2025"
        },
        {
          _id: "SUB-006",
          name: "Email Marketing",
          customer: "Sarah Davis",
          project: "Newsletter",
          status: "Incomplete",
          nextBilling: "25-10-2025",
          dateSubscribed: "25-07-2025",
          lastSent: "25-09-2025"
        },
        {
          _id: "SUB-007",
          name: "E-commerce SEO",
          customer: "Michael Brown",
          project: "Online Store",
          status: "Incomplete Expired",
          nextBilling: "N/A",
          dateSubscribed: "15-05-2025",
          lastSent: "15-07-2025"
        },
        {
          _id: "SUB-008",
          name: "Local SEO",
          customer: "Emily Wilson",
          project: "Brick & Mortar",
          status: "Active",
          nextBilling: "30-09-2025",
          dateSubscribed: "30-06-2025",
          lastSent: "30-08-2025"
        },
        {
          _id: "SUB-009",
          name: "Analytics Setup",
          customer: "David Miller",
          project: "Data Tracking",
          status: "Active",
          nextBilling: "12-10-2025",
          dateSubscribed: "12-07-2025",
          lastSent: "12-09-2025"
        },
        {
          _id: "SUB-010",
          name: "Conversion Optimization",
          customer: "Lisa Taylor",
          project: "Sales Funnel",
          status: "Past Due",
          nextBilling: "08-10-2025",
          dateSubscribed: "08-07-2025",
          lastSent: "08-09-2025"
        },
        {
          _id: "SUB-011",
          name: "Conversion Optimization",
          customer: "Lisa Taylor",
          project: "Sales Funnel",
          status: "Past Due",
          nextBilling: "08-10-2025",
          dateSubscribed: "08-07-2025",
          lastSent: "08-09-2025"
        }
      ]);
      
      // Calculate stats
      const totalSubscriptions = 10; // In real app, this would come from API
      const activeSubscriptions = 3;
      const pastDueSubscriptions = 2;
      const canceledSubscriptions = 1;
      const futureSubscriptions = 1;
      
      setStats({
        totalSubscriptions,
        activeSubscriptions,
        pastDueSubscriptions,
        canceledSubscriptions,
        futureSubscriptions
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

  // Search filter
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  };

  const handleSaveSubscription = async () => {
    if (isSaving) return;
    
    if (!newSubscription.name || !newSubscription.customer || !newSubscription.project) {
      alert("Please fill in all required fields (Name, Customer, Project)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingSubscription) {
        // Update existing subscription
        // await axios.put(`http://localhost:5000/api/subscriptions/${editingSubscription._id}`, newSubscription);
        setShowNewSubscriptionForm(false);
        setEditingSubscription(null);
        fetchSubscriptions();
        alert("Subscription updated successfully!");
      } else {
        // Create new subscription
        // await axios.post("http://localhost:5000/api/subscriptions", newSubscription);
        setShowNewSubscriptionForm(false);
        fetchSubscriptions();
        alert("Subscription created successfully!");
      }
      
      // Reset form
      setNewSubscription({
        name: "",
        customer: "",
        project: "",
        status: "Active",
        nextBilling: "",
        dateSubscribed: "",
        lastSent: ""
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
      customer: subscription.customer,
      project: subscription.project,
      status: subscription.status,
      nextBilling: subscription.nextBilling,
      dateSubscribed: subscription.dateSubscribed,
      lastSent: subscription.lastSent
    });
    setShowNewSubscriptionForm(true);
  };

  const handleDeleteSubscription = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        // await axios.delete(`http://localhost:5000/api/subscriptions/${id}`);
        fetchSubscriptions();
        alert("Subscription deleted successfully!");
      } catch (error) {
        console.error("Error deleting subscription:", error);
        alert(`Error deleting subscription: ${error.response?.data?.message || error.message}`);
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
      
      // This would be your actual API endpoint
      // const { data } = await axios.post('http://localhost:5000/api/subscriptions/import', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });

      // Simulate API call
      setTimeout(() => {
        setImportProgress(null);
        setImportResult({
          success: true,
          imported: 5,
          errorCount: 0,
          errorMessages: []
        });
        
        // Refresh subscription list
        fetchSubscriptions();
      }, 1500);
    } catch (error) {
      console.error("Error importing subscriptions:", error);
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
    const dataToExport = filteredSubscriptions.map(subscription => ({
      ID: subscription._id,
      Name: subscription.name,
      Customer: subscription.customer,
      Project: subscription.project,
      Status: subscription.status,
      'Next Billing': subscription.nextBilling,
      'Date Subscribed': subscription.dateSubscribed,
      'Last Sent': subscription.lastSent
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
      Customer: subscription.customer,
      Project: subscription.project,
      Status: subscription.status,
      'Next Billing': subscription.nextBilling,
      'Date Subscribed': subscription.dateSubscribed,
      'Last Sent': subscription.lastSent
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
      "Date Subscribed",
      "Last Sent"
    ];
    
    const tableRows = filteredSubscriptions.map(subscription => [
      subscription._id,
      subscription.name,
      subscription.customer,
      subscription.project,
      subscription.status,
      subscription.nextBilling,
      subscription.dateSubscribed,
      subscription.lastSent
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
    ['ID', 'Name', 'Customer', 'Project', 'Status', 'Next Billing', 'Date Subscribed', 'Last Sent'].forEach(header => {
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
        subscription.customer,
        subscription.project,
        subscription.status,
        subscription.nextBilling,
        subscription.dateSubscribed,
        subscription.lastSent
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
                <input
                  type="text"
                  name="customer"
                  value={newSubscription.customer}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
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
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newSubscription.status}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Cycle</label>
                <input
                  type="text"
                  name="nextBilling"
                  value={newSubscription.nextBilling}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Subscribed</label>
                <input
                  type="text"
                  name="dateSubscribed"
                  value={newSubscription.dateSubscribed}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Sent</label>
                <input
                  type="text"
                  name="lastSent"
                  value={newSubscription.lastSent}
                  onChange={handleNewSubscriptionChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewSubscriptionForm(false);
                setEditingSubscription(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSubscription}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newSubscription.name || !newSubscription.customer || !newSubscription.project || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
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
                  <FaSyncAlt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaSyncAlt className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Past Due Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Past Due Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.pastDueSubscriptions}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaSyncAlt className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Canceled Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Canceled Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.canceledSubscriptions}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaSyncAlt className="text-gray-600" />
                </div>
              </div>
            </div>

            {/* Future Subscriptions */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Future Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.futureSubscriptions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaSyncAlt className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* White box for table */}
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`} 
               style={{ borderRadius: '8px', border: '1px solid #E0E0E0', backgroundColor: '#F2F4F7' }}>
            {/* Controls - Updated to match the second image */}
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

                {/* New Subscription button */}
                <button 
                  className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                  onClick={() => setShowNewSubscriptionForm(true)}
                >
                  <FaPlus /> New Subscription
                </button>
                
                {/* Import Subscriptions button */}
                <button 
                  className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                  onClick={handleImportClick}
                >
                  <FaFileImport /> Import Subscriptions
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
                  onClick={fetchSubscriptions}
                >
                  <FaSyncAlt />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Bulk delete button */}
              {selectedSubscriptions.length > 0 && (
                <div className="p-2 border bg-red-50 mb-2 rounded-lg">
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={async () => {
                    if (window.confirm(`Delete ${selectedSubscriptions.length} selected subscriptions?`)) {
                        try {
                          // await Promise.all(selectedSubscriptions.map(id =>
                          //   axios.delete(`http://localhost:5000/api/subscriptions/${id}`)
                          // ));
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
                </div>
              )}
              
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
                  <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>ID</th>
                  <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subscription Name</th>
                  {compactView ? (
                    <>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                      <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Next Billing</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Next Billing</th>
                      <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Subscribed</th>
                      <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Last Sent</th>
                    </>
                  )}
                </tr>
              </thead>
                
                <tbody>
                {currentData.map((subscription) => (
                  <tr 
                    key={subscription._id} 
                    className="hover:bg-gray-50 relative"
                    onMouseEnter={() => setHoveredRow(subscription._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: 'white', color: 'black' }}
                  >
                    <td className="p-3 rounded-l-lg border-0">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedSubscriptions.includes(subscription._id)}
                          onChange={() => toggleSubscriptionSelection(subscription._id)}
                          className="h-4 w-4"
                        />
                        {hoveredRow === subscription._id && (
                          <div className="absolute left-8 flex space-x-1 bg-white shadow-md rounded p-1 z-10">
                            <button 
                              onClick={() => handleEditSubscription(subscription)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSubscription(subscription._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-0">{subscription._id}</td>
                    <td className="p-3 border-0">{subscription.name}</td>
                    <td className="p-3 border-0">{subscription.customer}</td>
                    {compactView ? (
                      <>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subscription.status)}`}>
                            {subscription.status}
                          </span>
                        </td>
                        <td className="p-3 rounded-r-lg border-0">{subscription.nextBilling}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 border-0">{subscription.project}</td>
                        <td className="p-3 border-0">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(subscription.status)}`}>
                            {subscription.status}
                          </span>
                        </td>
                        <td className="p-3 border-0">{subscription.nextBilling}</td>
                        <td className="p-3 border-0">{subscription.dateSubscribed}</td>
                        <td className="p-3 rounded-r-lg border-0">{subscription.lastSent}</td>
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

      {/* Import Subscriptions Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Subscriptions</h2>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your CSV data should include <strong>Name</strong>, <strong>Customer</strong>, and <strong>Project</strong> columns.
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

export default SubscriptionPage;