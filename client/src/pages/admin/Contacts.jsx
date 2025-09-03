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
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const contractTypeOptions = [
    "Express Contract",
    "Standard Contract",
    "Custom Contract"
  ];
  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [loading, setLoading] = useState(true);

  // Fetch contacts from API
  const fetchContacts = async () => {
    setLoading(true);
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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
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
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
    
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
      startDate: contact.startDate ? new Date(contact.startDate).toISOString().split('T')[0] : "",
      endDate: contact.endDate ? new Date(contact.endDate).toISOString().split('T')[0] : "",
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
        errorCount: data.errorCount,
        errorMessages: data.errorMessages
      });
      
      // Refresh contact list
      fetchContacts();
    } catch (error) {
      console.error("Error importing contacts:", error);
      setImportProgress(null);
      setImportResult({
        success: false,
        message: error.response?.data?.message || error.message
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
      'Start Date': contact.startDate ? new Date(contact.startDate).toLocaleDateString() : "N/A",
      'End Date': contact.endDate ? new Date(contact.endDate).toLocaleDateString() : "N/A",
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
      'Start Date': contact.startDate ? new Date(contact.startDate).toLocaleDateString() : "N/A",
      'End Date': contact.endDate ? new Date(contact.endDate).toLocaleDateString() : "N/A",
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
      contact.startDate ? new Date(contact.startDate).toLocaleDateString() : "N/A",
      contact.endDate ? new Date(contact.endDate).toLocaleDateString() : "N/A",
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
    ['Subject', 'Customer', 'Contract Type', 'Contract Value', 'Start Date', 'End Date', 'Project', 'Signature'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredContacts.forEach(contact => {
      printWindow.document.write('<tr>');
      [
        contact.subject,
        contact.customer ? contact.customer.company : "N/A",
        contact.contractType,
        `$${contact.contractValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        contact.startDate ? new Date(contact.startDate).toLocaleDateString() : "N/A",
        contact.endDate ? new Date(contact.endDate).toLocaleDateString() : "N/A",
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Calculate chart data based on actual contacts
  const chartData = [
    { 
      name: 'Express', 
      value: contacts.filter(c => c.contractType === 'Express Contract').length, 
      color: '#8884d8' 
    },
    { 
      name: 'Standard', 
      value: contacts.filter(c => c.contractType === 'Standard Contract').length, 
      color: '#82ca9d' 
    },
    { 
      name: 'Custom', 
      value: contacts.filter(c => c.contractType === 'Custom Contract').length, 
      color: '#ffc658' 
    },
  ];

  const contractValueData = [
    { 
      type: 'Express Contract', 
      value: contacts
        .filter(c => c.contractType === 'Express Contract')
        .reduce((sum, c) => sum + c.contractValue, 0) 
    },
    { 
      type: 'Standard Contract', 
      value: contacts
        .filter(c => c.contractType === 'Standard Contract')
        .reduce((sum, c) => sum + c.contractValue, 0) 
    },
    { 
      type: 'Custom Contract', 
      value: contacts
        .filter(c => c.contractType === 'Custom Contract')
        .reduce((sum, c) => sum + c.contractValue, 0) 
    },
  ];

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading Contacts...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
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
        <div className="bg-white shadow-md rounded p-6 mb-6 border">
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
                  value={newContact.project}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                <select
                  name="contractType"
                  value={newContact.contractType}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {contractTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value (USD) *</label>
                <input
                  type="number"
                  name="contractValue"
                  value={newContact.contractValue}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={newContact.startDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={newContact.endDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Status</label>
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
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveContact}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : (editingContact ? "Update Contract" : "Save")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Active Contracts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaSyncAlt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Expired Contracts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Expired</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaTimes className="text-red-600" />
                </div>
              </div>
            </div>

            {/* About to Expire */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">About to Expire</p>
                  <p className="text-2xl font-bold">{stats.aboutToExpire}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaFilter className="text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Recently Added */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Recently Added</p>
                  <p className="text-2xl font-bold">{stats.recentlyAdded}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaPlus className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Trash */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Trash</p>
                  <p className="text-2xl font-bold">{stats.trash}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaTrash className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-4 border">
              <h3 className="text-lg font-semibold mb-4">Contracts by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white shadow rounded-lg p-4 border">
              <h3 className="text-lg font-semibold mb-4">Contract Value by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contractValueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Contract Value" />
                </BarChart>
              </ResponsiveContainer>
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
                onClick={handleImportClick}
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
              >
                <FaFileImport /> Import
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
          <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"} border`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedContacts.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedContacts.length} selected contracts?`)) {
                        try {
                          await Promise.all(selectedContacts.map(id =>
                            axios.delete(`http://localhost:5000/api/contacts/${id}`)
                          ));
                          setSelectedContacts([]);
                          fetchContacts();
                          alert("Selected contracts deleted!");
                        } catch {
                          alert("Error deleting selected contracts.");
                        }
                      }
                    }}
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
                    <div ref={exportMenuRef} className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
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
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subject</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Type</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Value</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>End Date</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
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
                  {currentData.map((contact) => (
                    <tr
                      key={contact._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
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
                      <td className="p-3 border-0">{contact.subject}</td>
                      <td className="p-3 border-0">
                        {contact.customer ? contact.customer.company : "N/A"}
                        {contact.customer && (
                          <div className="text-xs text-gray-500">
                            {contact.customer.contact} • {contact.customer.email}
                          </div>
                        )}
                      </td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              contact.contractType === "Express Contract" ? "bg-blue-100 text-blue-800" :
                              contact.contractType === "Standard Contract" ? "bg-green-100 text-green-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {contact.contractType}
                            </span>
                          </td>
                          <td className="p-3 border-0">{formatCurrency(contact.contractValue)}</td>
                          <td className="p-3 border-0">{formatDate(contact.endDate)}</td>
                          <td className="p-3 border-0 rounded-r-lg">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              contact.contractType === "Express Contract" ? "bg-blue-100 text-blue-800" :
                              contact.contractType === "Standard Contract" ? "bg-green-100 text-green-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {contact.contractType}
                            </span>
                          </td>
                          <td className="p-3 border-0">{formatCurrency(contact.contractValue)}</td>
                          <td className="p-3 border-0">{formatDate(contact.startDate)}</td>
                          <td className="p-3 border-0">{formatDate(contact.endDate)}</td>
                          <td className="p-3 border-0">{contact.project}</td>
                          <td className="p-3 border-0">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              contact.signature === "Signed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {contact.signature}
                            </span>
                          </td>
                          <td className="p-3 border-0 rounded-r-lg">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
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
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredContacts.length)} of {filteredContacts.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
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

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Import Contracts</h2>
            
            {importProgress ? (
              <div className="mb-4">
                <p className="text-gray-600">{importProgress.message}</p>
                {importProgress.status === 'processing' && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${importProgress.progress}%` }}></div>
                  </div>
                )}
              </div>
            ) : importResult ? (
              <div className={`mb-4 p-4 rounded border ${
                importResult.success ? "bg-green-100 border-green-400 text-green-800" : "bg-red-100 border-red-400 text-red-800"
              }`}>
                {importResult.success ? (
                  <>
                    <p className="font-semibold">Import completed successfully!</p>
                    <p className="mt-2">Imported: {importResult.imported} contracts</p>
                    {importResult.errorCount > 0 && (
                      <p className="mt-2">Failed: {importResult.errorCount} contracts</p>
                    )}
                    {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc pl-5 mt-1">
                          {importResult.errorMessages.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Import failed!</p>
                    <p className="mt-2">{importResult.message}</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">Upload an Excel file to import contracts.</p>
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="w-full border rounded p-2"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  The Excel file should have columns: Subject, Customer, Contract Type, Contract Value, Start Date, End Date, Project, Signature
                </p>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              >
                {importResult ? "Close" : "Cancel"}
              </button>
              {!importResult && !importProgress && (
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile}
                  className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
