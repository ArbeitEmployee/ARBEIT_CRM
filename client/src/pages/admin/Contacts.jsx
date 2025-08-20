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
    active: 16,
    expired: 8,
    aboutToExpire: 5,
    recentlyAdded: 5,
    trash: 0
  });
  const [newContact, setNewContact] = useState({
    subject: "",
    customer: "",
    contractType: "Express Contract",
    contractValue: "",
    startDate: "",
    endDate: "",
    project: "",
    signature: "Not Signed"
  });
  const [editingContact, setEditingContact] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
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
  const [chartData, setChartData] = useState([
    { name: 'Express', value: 45, color: '#8884d8' },
    { name: 'Standard', value: 30, color: '#82ca9d' },
    { name: 'Custom', value: 25, color: '#ffc658' },
  ]);

  const contractValueData = [
    { type: 'Express Contract', value: 45657 },
    { type: 'Standard Contract', value: 125000 },
    { type: 'Custom Contract', value: 75000 },
    { type: 'New Contract', value: 89000 },
  ];
  

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      // For demo purposes, using dummy data
      setContacts([
        {
          _id: "01",
          subject: "She was a little bottle that stood...",
          customer: "RFL_Bilai Khan",
          contractType: "Express Contract",
          contractValue: 45857.00,
          startDate: "20-09-2025",
          endDate: "20-09-2025",
          project: "Project Alpha",
          signature: "Not Signed"
        },
        {
          _id: "02",
          subject: "Website Development Agreement",
          customer: "ABC Corporation",
          contractType: "Standard Contract",
          contractValue: 125000.00,
          startDate: "15-08-2025",
          endDate: "15-08-2026",
          project: "Corporate Website",
          signature: "Signed"
        },
        {
          _id: "03",
          subject: "Marketing Services Contract",
          customer: "XYZ Enterprises",
          contractType: "Custom Contract",
          contractValue: 75000.00,
          startDate: "01-10-2025",
          endDate: "01-10-2026",
          project: "Digital Marketing",
          signature: "Not Signed"
        },
        {
          _id: "04",
          subject: "Software License Agreement",
          customer: "Tech Solutions Ltd",
          contractType: "Express Contract",
          contractValue: 35000.00,
          startDate: "05-09-2025",
          endDate: "05-09-2026",
          project: "Software Implementation",
          signature: "Signed"
        },
        {
          _id: "05",
          subject: "Consulting Services Agreement",
          customer: "Global Consulting Inc",
          contractType: "Standard Contract",
          contractValue: 89000.00,
          startDate: "12-11-2025",
          endDate: "12-11-2026",
          project: "Business Consulting",
          signature: "Signed"
        },
        {
          _id: "06",
          subject: "Maintenance and Support Contract",
          customer: "Service Providers LLC",
          contractType: "Custom Contract",
          contractValue: 45000.00,
          startDate: "18-07-2025",
          endDate: "18-07-2026",
          project: "IT Support",
          signature: "Not Signed"
        },
        {
          _id: "07",
          subject: "Product Supply Agreement",
          customer: "Retail Chain Inc",
          contractType: "Express Contract",
          contractValue: 225000.00,
          startDate: "22-08-2025",
          endDate: "22-08-2026",
          project: "Product Supply",
          signature: "Signed"
        },
        {
          _id: "08",
          subject: "Partnership Agreement",
          customer: "Strategic Partners Co",
          contractType: "Standard Contract",
          contractValue: 150000.00,
          startDate: "30-10-2025",
          endDate: "30-10-2026",
          project: "Joint Venture",
          signature: "Not Signed"
        },
        {
          _id: "09",
          subject: "Non-Disclosure Agreement",
          customer: "Innovative Solutions Ltd",
          contractType: "Express Contract",
          contractValue: 0.00,
          startDate: "03-09-2025",
          endDate: "03-09-2028",
          project: "Confidential Discussion",
          signature: "Signed"
        },
        {
          _id: "10",
          subject: "Service Level Agreement",
          customer: "Cloud Services Inc",
          contractType: "Custom Contract",
          contractValue: 65000.00,
          startDate: "14-12-2025",
          endDate: "14-12-2026",
          project: "Cloud Services",
          signature: "Signed"
        }
      ]);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Search filter
  const filteredContacts = contacts.filter(contact => 
    contact._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  };

  const handleSaveContact = async () => {
    if (isSaving) return;
    
    if (!newContact.subject || !newContact.customer || !newContact.project) {
      alert("Please fill in all required fields (Subject, Customer, Project)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingContact) {
        // Update existing contact
        setShowNewContactForm(false);
        setEditingContact(null);
        fetchContacts();
        alert("Contact updated successfully!");
      } else {
        // Create new contact
        setShowNewContactForm(false);
        fetchContacts();
        alert("Contact created successfully!");
      }
      
      // Reset form
      setNewContact({
        subject: "",
        customer: "",
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
      customer: contact.customer,
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

    // Simulate import process
    setImportProgress({ status: 'uploading', message: 'Uploading file...' });
    
    setTimeout(() => {
      setImportProgress(null);
      setImportResult({
        success: true,
        imported: 5,
        errorCount: 0,
        errorMessages: []
      });
      
      // Refresh contact list
      fetchContacts();
    }, 1500);
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
      Customer: contact.customer,
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
      Customer: contact.customer,
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
      contact.customer,
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
        contact.customer,
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
                <input
                  type="text"
                  name="customer"
                  value={newContact.customer}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value (USD)</label>
                <input
                  type="number"
                  name="contractValue"
                  value={newContact.contractValue}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="text"
                  name="startDate"
                  value={newContact.startDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="text"
                  name="endDate"
                  value={newContact.endDate}
                  onChange={handleNewContactChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DD-MM-YYYY"
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
              type="button"
              onClick={() => {
                setShowNewContactForm(false);
                setEditingContact(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveContact}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newContact.subject || !newContact.customer || !newContact.project || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
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
                  <FaSyncAlt className="text-red-600" />
                </div>
              </div>
            </div>

            {/* About To Expire Contracts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">About To Expire</p>
                  <p className="text-2xl font-bold">{stats.aboutToExpire}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FaSyncAlt className="text-orange-600" />
                </div>
              </div>
            </div>

            {/* Recently Added Contracts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Recently Added</p>
                  <p className="text-2xl font-bold">{stats.recentlyAdded}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaSyncAlt className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Trash Contracts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Trash</p>
                  <p className="text-2xl font-bold">{stats.trash}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaSyncAlt className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>



          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contracts by Type Chart */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="font-semibold mb-4">Contracts by Type</h3>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">25</div>
                <div className="flex items-center text-sm text-gray-500">
                  <FaFilter className="mr-1" /> Filter
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contracts Value by Type Chart */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Contracts Value by Type(USD)</h3>
                <div className="flex space-x-2">
                  <button className="text-sm flex items-center px-2 py-1 border rounded">
                    New Contract
                  </button>
                  <button className="text-sm flex items-center px-2 py-1 border rounded">
                    Export
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={contractValueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
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

                {/* New Contract button */}
                <button 
                  className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                  onClick={() => setShowNewContactForm(true)}
                >
                  <FaPlus /> New Contract
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
                  onClick={fetchContacts}
                >
                  <FaSyncAlt />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {/* Bulk delete button */}
              {selectedContacts.length > 0 && (
                <div className="p-2 border bg-red-50 mb-2 rounded-lg">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedContacts.length} selected contracts?`)) {
                        try {
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
                </div>
              )}
              
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
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>ID</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Subject</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Customer</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Type</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Contract Value</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Start Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>End Date</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Project</th>
                    <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Signature</th>
                  </tr>
                </thead>
                
                <tbody>
                  {currentData.map((contact) => (
                    <tr 
                      key={contact._id} 
                      className="hover:bg-gray-50 relative"
                      onMouseEnter={() => setHoveredRow(contact._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: 'white', color: 'black' }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact._id)}
                            onChange={() => toggleContactSelection(contact._id)}
                            className="h-4 w-4"
                          />
                          {hoveredRow === contact._id && (
                            <div className="absolute left-8 flex space-x-1 bg-white shadow-md rounded p-1 z-10">
                              <button 
                                onClick={() => handleEditContact(contact)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(contact._id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-0">#{contact._id}</td>
                      <td className="p-3 border-0">{contact.subject}</td>
                      <td className="p-3 border-0">{contact.customer}</td>
                      <td className="p-3 border-0">{contact.contractType}</td>
                      <td className="p-3 border-0">{formatCurrency(contact.contractValue)}</td>
                      <td className="p-3 border-0">{contact.startDate}</td>
                      <td className="p-3 border-0">{contact.endDate}</td>
                      <td className="p-3 border-0">{contact.project}</td>
                      <td className="p-3 rounded-r-lg border-0">{contact.signature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredContacts.length)} of{" "}
                {filteredContacts.length} entries
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

      {/* Import Contacts Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Contracts</h2>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your CSV data should include <strong>Subject</strong>, <strong>Customer</strong>, and <strong>Project</strong> columns.
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

export default ContactsPage;