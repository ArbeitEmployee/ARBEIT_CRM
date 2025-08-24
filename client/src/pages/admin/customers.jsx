import { useState, useEffect, useRef } from "react";
import { FaPlus, FaFilter, FaSearch, FaSyncAlt, FaUser, FaUserCheck, FaUserTimes, FaUserClock, FaChevronRight, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomersPage = () => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    activeContacts: 0,
    inactiveContacts: 0,
    loggedInContacts: 0
  });
  const [newCustomer, setNewCustomer] = useState({
    company: "",
    vatNumber: "",
    contact: "",
    phone: "",
    email: "",
    website: "",
    groups: [],
    currency: "System Default",
    language: "System Default",
    active: true,
    contactsActive: true
  });
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const groupOptions = ["Low Budget", "High Budget", "VIP", "Wholesaler"];

  const filteredGroupOptions = groupOptions.filter(option =>
    option.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/customers");
      setCustomers(data.customers || []);
      setStats({
        totalCustomers: data.stats?.totalCustomers ?? 0,
        activeCustomers: data.stats?.activeCustomers ?? 0,
        inactiveCustomers: data.stats?.inactiveCustomers ?? 0,
        activeContacts: data.stats?.activeContacts ?? 0,
        inactiveContacts: data.stats?.inactiveContacts ?? 0,
        loggedInContacts: data.stats?.loggedInContacts ?? 0,
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        activeContacts: 0,
        inactiveContacts: 0,
        loggedInContacts: 0,
      });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Toggle customer active status
  const toggleCustomerActive = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/customers/${id}/active`);
      fetchCustomers();
    } catch (error) {
      console.error("Error updating customer status:", error);
      alert(`Error updating customer status: ${error.response?.data?.message || error.message}`);
    }
  };

  // Toggle contacts active status
  const toggleContactsActive = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/customers/${id}/contacts-active`);
      fetchCustomers();
    } catch (error) {
      console.error("Error updating contacts status:", error);
      alert(`Error updating contacts status: ${error.response?.data?.message || error.message}`);
    }
  };

  // Search filter
  const filteredCustomers = (customers || []).filter((c) =>
    Object.values(c).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
  ));

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredCustomers.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleCustomerSelection = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(customerId => customerId !== id)
        : [...prev, id]
    );
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddGroup = (group) => {
    if (!newCustomer.groups.includes(group)) {
      setNewCustomer(prev => ({
        ...prev,
        groups: [...prev.groups, group]
      }));
    }
    setGroupSearchTerm("");
    setShowGroupDropdown(false);
  };

  const handleRemoveGroup = (index) => {
    setNewCustomer(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCustomer = async () => {
    if (isSaving) return;
    
    if (!newCustomer.company || !newCustomer.contact || !newCustomer.email) {
      alert("Please fill in all required fields (Company, Contact, Email)");
      return;
    }

    setIsSaving(true);
    
    try {
      if (editingCustomer) {
        // Update existing customer
        const response = await axios.put(`http://localhost:5000/api/customers/${editingCustomer._id}`, newCustomer);
        if (response.status === 200) {
          setShowNewCustomerForm(false);
          setEditingCustomer(null);
          fetchCustomers();
          alert("Customer updated successfully!");
        }
      } else {
        // Create new customer
        const response = await axios.post("http://localhost:5000/api/customers", newCustomer);
        if (response.status === 201) {
          setShowNewCustomerForm(false);
          fetchCustomers();
          alert("Customer created successfully!");
        }
      }
      
      // Reset form
      setNewCustomer({
        company: "",
        vatNumber: "",
        contact: "",
        phone: "",
        email: "",
        website: "",
        groups: [],
        currency: "System Default",
        language: "System Default",
        active: true,
        contactsActive: true
      });
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(`Error saving customer: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      company: customer.company,
      vatNumber: customer.vatNumber,
      contact: customer.contact,
      phone: customer.phone,
      email: customer.email,
      website: customer.website,
      groups: [...customer.groups],
      currency: customer.currency,
      language: customer.language,
      active: customer.active,
      contactsActive: customer.contactsActive
    });
    setShowNewCustomerForm(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await axios.delete(`http://localhost:5000/api/customers/${id}`);
        fetchCustomers();
        alert("Customer deleted successfully!");
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert(`Error deleting customer: ${error.response?.data?.message || error.message}`);
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
      
      const { data } = await axios.post('http://localhost:5000/api/customers/import', formData, {
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
      
      // Refresh customer list
      fetchCustomers();
    } catch (error) {
      console.error("Error importing customers:", error);
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

  // Export functions (remain the same as before)
  const exportToExcel = () => {
    const dataToExport = filteredCustomers.map(customer => ({
      Company: customer.company,
      'Primary Contact': customer.contact,
      Email: customer.email,
      Phone: customer.phone,
      'Active Customer': customer.active ? 'Yes' : 'No',
      'Active Contacts': customer.contactsActive ? 'Yes' : 'No',
      Groups: customer.groups.join(', '),
      'Date Created': new Date(customer.dateCreated).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "Customers.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredCustomers.map(customer => ({
      Company: customer.company,
      'Primary Contact': customer.contact,
      Email: customer.email,
      Phone: customer.phone,
      'Active Customer': customer.active ? 'Yes' : 'No',
      'Active Contacts': customer.contactsActive ? 'Yes' : 'No',
      Groups: customer.groups.join(', '),
      'Date Created': new Date(customer.dateCreated).toLocaleString()
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Customers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Company",
      "Primary Contact",
      "Email",
      "Phone",
      "Active Customer",
      "Active Contacts",
      "Groups",
      "Date Created"
    ];
    
    const tableRows = filteredCustomers.map(customer => [
      customer.company,
      customer.contact,
      customer.email,
      customer.phone,
      customer.active ? 'Yes' : 'No',
      customer.contactsActive ? 'Yes' : 'No',
      customer.groups.join(', '),
      new Date(customer.dateCreated).toLocaleString()
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Customers.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Customers</title>');
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
    printWindow.document.write('<h1>Customers</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['Company', 'Primary Contact', 'Email', 'Phone', 'Active Customer', 'Active Contacts', 'Groups', 'Date Created'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredCustomers.forEach(customer => {
      printWindow.document.write('<tr>');
      [
        customer.company,
        customer.contact,
        customer.email,
        customer.phone,
        customer.active ? 'Yes' : 'No',
        customer.contactsActive ? 'Yes' : 'No',
        customer.groups.join(', '),
        new Date(customer.dateCreated).toLocaleString()
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

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewCustomerForm ? (editingCustomer ? "Edit Customer" : "Add New Customer") : "Customers"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Contacts</span>
          <FaChevronRight className="mx-1 text-xs" />
        </div>
      </div>

      {showNewCustomerForm ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Customer Details</h2>
            <button 
              onClick={() => {
                setShowNewCustomerForm(false);
                setEditingCustomer(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={newCustomer.company}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                <input
                  type="text"
                  name="vatNumber"
                  value={newCustomer.vatNumber}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact *</label>
                <input
                  type="text"
                  name="contact"
                  value={newCustomer.contact}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={newCustomer.website}
                  onChange={handleNewCustomerChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
                <div className="relative">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Search groups..."
                      value={groupSearchTerm}
                      onChange={(e) => setGroupSearchTerm(e.target.value)}
                      onFocus={() => setShowGroupDropdown(true)}
                      className="w-full border rounded-l px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        if (groupSearchTerm && !newCustomer.groups.includes(groupSearchTerm)) {
                          handleAddGroup(groupSearchTerm);
                        }
                      }}
                      className="bg-gray-200 px-3 py-2 rounded-r"
                    >
                      Add
                    </button>
                  </div>
                  {showGroupDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                      {filteredGroupOptions.map((group, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleAddGroup(group)}
                        >
                          {group}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newCustomer.groups.map((group, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center">
                      {group}
                      <button 
                        onClick={() => handleRemoveGroup(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={newCustomer.currency}
                    onChange={handleNewCustomerChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>System Default</option>
                    <option>USD </option>
                    <option>EUR </option>
                    <option>IDR </option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                  <select
                    name="language"
                    value={newCustomer.language}
                    onChange={handleNewCustomerChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option>System Default</option>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Status</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      checked={newCustomer.active}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacts Status</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="contactsActive"
                      checked={newCustomer.contactsActive}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, contactsActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewCustomerForm(false);
                setEditingCustomer(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomer}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newCustomer.company || !newCustomer.contact || !newCustomer.email || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Customers */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUser className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Customers</p>
                  <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUserCheck className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Inactive Customers */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Customers</p>
                  <p className="text-2xl font-bold">{stats.inactiveCustomers}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaUserTimes className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Active Contacts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Contacts</p>
                  <p className="text-2xl font-bold">{stats.activeContacts}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUserCheck className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Inactive Contacts */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Contacts</p>
                  <p className="text-2xl font-bold">{stats.inactiveContacts}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaUserTimes className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Contacts Logged In */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Contacts Logged In</p>
                  <p className="text-2xl font-bold">{stats.loggedInContacts}</p>
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
                onClick={() => setShowNewCustomerForm(true)}
              >
                <FaPlus /> New Customer
              </button>
              <button 
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={handleImportClick}
              >
                Import Customers
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


                {/* Delete Selected button before the select */}
      {selectedCustomers.length > 0 && (
        <button
          className="bg-red-600 text-white px-3 py-1 rounded"
          onClick={async () => {
            if (window.confirm(`Delete ${selectedCustomers.length} selected customers?`)) {
              try {
                await Promise.all(selectedCustomers.map(id =>
                  axios.delete(`http://localhost:5000/api/customers/${id}`)
                ));
                setSelectedCustomers([]);
                fetchCustomers();
                alert("Selected customers deleted!");
              } catch {
                alert("Error deleting selected customers.");
              }
            }
          }}
        >
          Delete Selected ({selectedCustomers.length})
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
                  onClick={fetchCustomers}
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
                {selectedCustomers.length > 0 && (
                  <tr>
                    <td colSpan={compactView ? 7 : 10} className="p-2 border bg-red-50">
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          if (window.confirm(`Delete ${selectedCustomers.length} selected customers?`)) {
                            try {
                              await Promise.all(selectedCustomers.map(id =>
                                axios.delete(`http://localhost:5000/api/customers/${id}`)
                              ));
                              setSelectedCustomers([]);
                              fetchCustomers();
                              alert("Selected customers deleted!");
                            } catch {
                              alert("Error deleting selected customers.");
                            }
                          }
                        }}
                      >
                        Delete Selected ({selectedCustomers.length})
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
                        checked={selectedCustomers.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(currentData.map(c => c._id));
                          } else {
                            setSelectedCustomers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Company</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Primary Contact</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Primary Email</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Active Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Active Contacts</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Phone</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Active Customer</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Active Contacts</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Groups</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Created</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((customer) => (
                      <tr
                        key={customer._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50"
                        style={{ color: 'black' }}
                      >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer._id)}
                            onChange={() => toggleCustomerSelection(customer._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0">{customer.company}</td>
                      <td className="p-3 border-0">{customer.contact}</td>
                      <td className="p-3 border-0">{customer.email}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs cursor-pointer ${customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                              onClick={() => toggleCustomerActive(customer._id)}
                              title="Toggle customer active status"
                            >
                              {customer.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            <span
                            className={`px-2 py-1 rounded text-xs cursor-pointer ${customer.contactsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                            onClick={() => toggleContactsActive(customer._id)}
                            title="Toggle contacts active status"
                          >
                            {customer.contactsActive ? 'Active' : 'Inactive'}
                          </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer._id)}
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
                          <td className="p-3 border-0">{customer.phone}</td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs cursor-pointer ${customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                              onClick={() => toggleCustomerActive(customer._id)}
                              title="Toggle customer active status"
                            >
                              {customer.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs cursor-pointer ${customer.contactsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                              onClick={() => toggleContactsActive(customer._id)}
                              title="Toggle contacts active status"
                            >
                              {customer.contactsActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 border-0">
                            {customer.groups.map((group, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 px-2 py-1 rounded text-xs mr-1"
                              >
                                {group}
                              </span>
                            ))}
                          </td>
                          <td className="p-3 border-0">
                            {new Date(customer.dateCreated).toLocaleString()}
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer._id)}
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
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries
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
                  disabled={currentPage === totalPages || totalPages === 0}
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
            <h2 className="text-xl font-semibold mb-4">Import Customers</h2>
            
            {importProgress ? (
              <div className="mb-4">
                <p className="text-sm">{importProgress.message}</p>
              </div>
            ) : importResult ? (
              <div className={`mb-4 p-3 rounded ${importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {importResult.success ? (
                  <>
                    <p className="font-semibold">Import completed!</p>
                    <p className="text-sm">Imported: {importResult.imported}</p>
                    <p className="text-sm">Errors: {importResult.errorCount}</p>
                    {importResult.errorMessages && importResult.errorMessages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold">Error details:</p>
                        <ul className="text-xs max-h-32 overflow-auto">
                          {importResult.errorMessages.map((error, index) => (
                            <li key={index} className="mt-1">{error}</li>
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
                <p className="text-sm mb-2">Select a CSV or Excel file to import customers:</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              {!importResult && (
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>
              )}
              {!importProgress && !importResult && (
                <button
                  onClick={handleImportSubmit}
                  className="px-4 py-2 bg-black text-white rounded text-sm"
                  disabled={!importFile}
                >
                  Import
                </button>
              )}
              {importResult && (
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 bg-black text-white rounded text-sm"
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

export default CustomersPage;