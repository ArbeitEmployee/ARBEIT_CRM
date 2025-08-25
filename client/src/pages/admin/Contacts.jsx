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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ContactsPage = () => {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    aboutToExpire: 0,
    recentlyAdded: 0,
    trash: 0
  });
  const [newContact, setNewContact] = useState({
    subject: "",
    customerId: "",
    customerName: "",
    contractType: "Express Contract",
    contractValue: "",
    startDate: "",
    endDate: "",
    project: "",
    signature: "Not Signed"
  });
  const [editingContact, setEditingContact] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [contractValueData, setContractValueData] = useState([]);
  const fileInputRef = useRef(null);

  const contractTypeOptions = [
    "Express Contract",
    "Standard Contract",
    "Custom Contract"
  ];

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/contacts");
      setContacts(data.contacts || []);
      setStats(data.stats || {
        active: 0,
        expired: 0,
        aboutToExpire: 0,
        recentlyAdded: 0,
        trash: 0
      });
      setChartData(data.chartData || []);
      setContractValueData(data.contractValueData || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
      setStats({
        active: 0,
        expired: 0,
        aboutToExpire: 0,
        recentlyAdded: 0,
        trash: 0
      });
      setChartData([]);
      setContractValueData([]);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    try {
      const { data } = await axios.get(`http://localhost:5000/api/contacts/customers/search?q=${searchTerm}`);
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
  const filteredContacts = contacts.filter(contact => 
    contact._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.customer && contact.customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    contact.contractType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredContacts.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleContactSelection = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id)
        ? prev.filter(contactId => contactId !== id)
        : [...prev, id]
    );
  };

  const handleNewContactChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === "customerName") {
      setCustomerSearchTerm(value);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setNewContact(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.company
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const handleSaveContact = async () => {
    if (isSaving) return;
    
    if (!newContact.subject || !newContact.customerId || !newContact.project || 
        !newContact.contractValue || !newContact.startDate || !newContact.endDate) {
      alert("Please fill in all required fields (Subject, Customer, Project, Contract Value, Start Date, End Date)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingContact) {
        // Update existing contact
        await axios.put(`http://localhost:5000/api/contacts/${editingContact._id}`, newContact);
        setShowNewContactForm(false);
        setEditingContact(null);
        fetchContacts();
        alert("Contact updated successfully!");
      } else {
        // Create new contact
        await axios.post("http://localhost:5000/api/contacts", newContact);
        setShowNewContactForm(false);
        fetchContacts();
        alert("Contact created successfully!");
      }
      
      // Reset form
      setNewContact({
        subject: "",
        customerId: "",
        customerName: "",
        contractType: "Express Contract",
        contractValue: "",
        startDate: "",
        endDate: "",
        project: "",
        signature: "Not Signed"
      });
    } catch (error) {
      console.error("Error saving contact:", error);
      alert(`Error saving contact: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setNewContact({
      subject: contact.subject,
      customerId: contact.customerId,
      customerName: contact.customer ? contact.customer.company : "",
      contractType: contact.contractType,
      contractValue: contact.contractValue,
      startDate: contact.startDate,
      endDate: contact.endDate,
      project: contact.project,
      signature: contact.signature
    });
    setShowNewContactForm(true);
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`http://localhost:5000/api/contacts/${id}`);
        fetchContacts();
        alert("Contact deleted successfully!");
      } catch (error) {
        console.error("Error deleting contact:", error);
        alert(`Error deleting contact: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedContacts.length} selected contacts?`)) {
      try {
        await axios.post("http://localhost:5000/api/contacts/bulk-delete", { ids: selectedContacts });
        setSelectedContacts([]);
        fetchContacts();
        alert("Selected contacts deleted successfully!");
      } catch (error) {
        console.error("Error bulk deleting contacts:", error);
        alert(`Error deleting contacts: ${error.response?.data?.message || error.message}`);
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
      
      const { data } = await axios.post('http://localhost:5000/api/contacts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportProgress(null);
      setImportResult({
        success: true,
        imported: data.importedCount,
        errorCount: data.errorMessages?.length || 0,
        errorMessages: data.errorMessages
      });
      
      // Refresh contact list
      fetchContacts();
    } catch (error) {
      console.error("Error importing contacts:", error);
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
    const dataToExport = filteredContacts.map(contact => ({
      ID: contact._id,
      Subject: contact.subject,
      Customer: contact.customer ? contact.customer.company : "N/A",
      'Contract Type': contact.contractType,
      'Contract Value': contact.contractValue,
      'Start Date': contact.startDate,
      'End Date': contact.endDate,
      Project: contact.project,
      Signature: contact.signature
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "Contacts.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredContacts.map(contact => ({
      ID: contact._id,
      Subject: contact.subject,
      Customer: contact.customer ? contact.customer.company : "N/A",
      'Contract Type': contact.contractType,
      'Contract Value': contact.contractValue,
      'Start Date': contact.startDate,
      'End Date': contact.endDate,
      Project: contact.project,
      Signature: contact.signature
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Contacts.csv');
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
      "Subject",
      "Customer",
      "Contract Type",
      "Contract Value",
      "Start Date",
      "End Date",
      "Project",
      "Signature"
    ];
    
    const tableRows = filteredContacts.map(contact => [
      contact._id,
      contact.subject,
      contact.customer ? contact.customer.company : "N/A",
      contact.contractType,
      `$${contact.contractValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      contact.startDate,
      contact.endDate,
      contact.project,
      contact.signature
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Contacts.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Contacts</title>');
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
    printWindow.document.write('<h1>Contacts</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Subject', 'Customer', 'Contract Type', 'Contract Value', 'Start Date', 'End Date', 'Project', 'Signature'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredContacts.forEach(contact => {
      printWindow.document.write('<tr>');
      [
        contact._id,
        contact.subject,
        contact.customer ? contact.customer.company : "N/A",
        contact.contractType,
        `$${contact.contractValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        contact.startDate,
        contact.endDate,
        contact.project,
        contact.signature
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 ">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewContactForm ? (editingContact ? "Edit Contact" : "Add New Contact") : "Contracts"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Contracts</span>
        </div>
      </div>

      {showNewContactForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Contract Details</h2>
            <button 
              onClick={() => {
                setShowNewContactForm(false);
                setEditingContact(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={newContact.subject}
                  onChange={handleNewContactChange}
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
                    value={newContact.customerName}
                    onChange={handleNewContactChange}
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="Search customer by company name..."
                  />
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.company}</div>
                          <div className="text-sm text-gray-600">{customer.contact} - {customer.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
                <select
                  name="contractType"
                  value={newContact.contractType}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {contractTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value *</label>
                <input
                  type="number"
                  name="contractValue"
                  value={newContact.contractValue}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="text"
                  name="startDate"
                  value={newContact.startDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="text"
                  name="endDate"
                  value={newContact.endDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <input
                  type="text"
                  name="project"
                  value={newContact.project}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Status *</label>
                <select
                  name="signature"
                  value={newContact.signature}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Not Signed">Not Signed</option>
                  <option value="Signed">Signed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowNewContactForm(false);
                setEditingContact(null);
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveContact}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : (editingContact ? "Update Contact" : "Save Contact")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { title: "Active", value: stats.active, color: "bg-blue-500" },
              { title: "Expired", value: stats.expired, color: "bg-red-500" },
              { title: "About to Expire", value: stats.aboutToExpire, color: "bg-yellow-500" },
              { title: "Recently Added", value: stats.recentlyAdded, color: "bg-green-500" },
              { title: "Trash", value: stats.trash, color: "bg-gray-500" }
            ].map((stat, index) => (
              <div key={index} className="bg-white shadow rounded-lg p-4 border border-black">
                <div className="flex items-center">
                  <div className={`${stat.color} w-4 h-4 rounded-full mr-3`}></div>
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contract Type Distribution */}
            <div className="bg-white shadow rounded-lg p-6 border border-black">
              <h3 className="text-lg font-semibold mb-4">Contract Type Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} contracts`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contract Value by Type */}
            <div className="bg-white shadow rounded-lg p-6 border border-black">
              <h3 className="text-lg font-semibold mb-4">Contract Value by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contractValueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Contract Value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewContactForm(true)}
              >
                <FaPlus /> New Contract
              </button>
              <button 
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={handleImportClick}
              >
                Import Contracts
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={() => setCompactView(!compactView)}
              >
                {compactView ? "<<" : ">>"}
              </button>
              <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
                <FaFilter /> Filters
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedContacts.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected ({selectedContacts.length})
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
                  onClick={fetchContacts}
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
            <div className="overflow-x-auto ">      
                
              <table className="w-full text-sm border-separate border-spacing-y-2 ">
                <thead>
                  <tr className="text-left">
                    <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts(currentData.map(c => c._id));
                          } else {
                            setSelectedContacts([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>ID</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subject</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Type</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Value</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Type</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Value</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Start Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>End Date</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Signature</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={compactView ? 7 : 11} className="px-6 py-4 text-center text-gray-500">
                        {contacts.length === 0 ? "No contacts found. Create your first contact!" : "No matching contacts found."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((contact) => (
                      <tr
                        key={contact._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50"
                        style={{ color: 'black' }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact._id)}
                              onChange={() => toggleContactSelection(contact._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0">{contact._id.substring(0, 8)}...</td>
                        <td className="p-3 border-0">{contact.subject}</td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">
                              {contact.customer ? contact.customer.company : "N/A"}
                            </td>
                            <td className="p-3 border-0">{contact.contractType}</td>
                            <td className="p-3 border-0">{formatCurrency(contact.contractValue)}</td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditContact(contact)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(contact._id)}
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
                              {contact.customer ? contact.customer.company : "N/A"}
                            </td>
                            <td className="p-3 border-0">{contact.contractType}</td>
                            <td className="p-3 border-0">{formatCurrency(contact.contractValue)}</td>
                            <td className="p-3 border-0">{contact.startDate}</td>
                            <td className="p-3 border-0">{contact.endDate}</td>
                            <td className="p-3 border-0">{contact.project}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${
                                contact.signature === "Signed" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {contact.signature}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditContact(contact)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(contact._id)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div>
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredContacts.length)} of {filteredContacts.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                      className={`px-3 py-1 border rounded ${currentPage === pageNum ? 'bg-black text-white' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
              <h3 className="text-lg font-semibold">Import Contracts</h3>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            
            {!importResult ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload an Excel or CSV file with your contract data. The file should include columns for:
                    Subject, Customer ID, Contract Type, Contract Value, Start Date, End Date, Project, and Signature Status.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="w-full border rounded p-2"
                  />
                </div>
                
                {importProgress && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded text-sm">
                    {importProgress.message}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeImportModal}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!importFile || importProgress}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              </>
            ) : (
              <div className={`p-4 rounded ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {importResult.success ? (
                  <>
                    <p className="font-medium">Import completed successfully!</p>
                    <p className="mt-2">{importResult.imported} contracts imported.</p>
                    {importResult.errorCount > 0 && (
                      <p className="mt-2">{importResult.errorCount} rows had errors and were skipped.</p>
                    )}
                    
                    {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Error details:</p>
                        <ul className="mt-1 text-sm max-h-40 overflow-auto">
                          {importResult.errorMessages.map((error, index) => (
                            <li key={index} className="mt-1">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium">Import failed!</p>
                    <p className="mt-2">{importResult.message}</p>
                  </>
                )}
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeImportModal}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;