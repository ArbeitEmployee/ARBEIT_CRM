import { useState, useEffect } from "react";
import { FaPlus, FaFilter, FaSearch, FaSyncAlt, FaUser, FaUserCheck, FaUserTimes, FaUserClock, FaChevronRight } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";

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
    )
  );

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

  const handleAddGroup = () => {
    const newGroup = prompt("Enter group name");
    if (newGroup) {
      setNewCustomer(prev => ({
        ...prev,
        groups: [...prev.groups, newGroup]
      }));
    }
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
    console.log("Attempting to save customer:", newCustomer);
    
    try {
      const response = await axios.post("http://localhost:5000/api/customers", newCustomer);
      console.log("API response:", response);
      
      if (response.status === 201) {
        setShowNewCustomerForm(false);
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
        fetchCustomers();
        alert("Customer created successfully!");
      }
    } catch (error) {
      console.error("Full error details:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      }
      alert(`Error creating customer: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center text-gray-600">
          <span>Contacts</span>
          <FaChevronRight className="mx-1 text-xs" />
        </div>
      </div>

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
            className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          >
            <FaPlus /> New Customer
          </button>
          <button className="border px-3 py-1 text-sm rounded flex items-center gap-2">
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

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <div className="bg-white shadow-md rounded p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">Customer Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
              <input
                type="text"
                name="vatNumber"
                value={newCustomer.vatNumber}
                onChange={handleNewCustomerChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={newCustomer.phone}
                onChange={handleNewCustomerChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                name="website"
                value={newCustomer.website}
                onChange={handleNewCustomerChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
              <div className="flex">
                <select
                  className="border rounded-l px-3 py-2 flex-grow"
                  disabled
                >
                  <option>Select a group</option>
                </select>
                <button
                  onClick={handleAddGroup}
                  className="bg-gray-200 px-3 py-2 rounded-r"
                >
                  Add
                </button>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={newCustomer.currency}
                onChange={handleNewCustomerChange}
                className="w-full border rounded px-3 py-2"
              >
                <option>System Default</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
            
            <div>
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
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowNewCustomerForm(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomer}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!newCustomer.company || !newCustomer.contact || !newCustomer.email || isSaving}
            >
              {isSaving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </div>
      )}

      {/* White box for table */}
      <div className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Entries per page */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
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
                  {["Excel", "CSV", "PDF", "Print"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        console.log(`${item} export triggered`);
                        setShowExportMenu(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
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
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border w-8"></th>
                <th className="p-2 border">Company</th>
                {compactView ? (
                  <>
                    <th className="p-2 border">Primary Contact</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Active Customer</th>
                    <th className="p-2 border">Active Contacts</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Primary Contact</th>
                    <th className="p-2 border">Primary Email</th>
                    <th className="p-2 border">Phone</th>
                    <th className="p-2 border">Active Customer</th>
                    <th className="p-2 border">Active Contacts</th>
                    <th className="p-2 border">Groups</th>
                    <th className="p-2 border">Date Created</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer._id)}
                      onChange={() => toggleCustomerSelection(customer._id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2 border">{customer.company}</td>
                  <td className="p-2 border">{customer.contact}</td>
                  <td className="p-2 border">{customer.email}</td>
                  {compactView ? (
                    <>
                      <td className="p-2 border">
                        <button 
                          onClick={() => toggleCustomerActive(customer._id)}
                          className={`px-2 py-1 rounded text-xs ${customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {customer.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-2 border">
                        <button 
                          onClick={() => toggleContactsActive(customer._id)}
                          className={`px-2 py-1 rounded text-xs ${customer.contactsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {customer.contactsActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 border">{customer.phone}</td>
                      <td className="p-2 border">
                        <button 
                          onClick={() => toggleCustomerActive(customer._id)}
                          className={`px-2 py-1 rounded text-xs ${customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {customer.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-2 border">
                        <button 
                          onClick={() => toggleContactsActive(customer._id)}
                          className={`px-2 py-1 rounded text-xs ${customer.contactsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {customer.contactsActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-2 border">
                        <div className="flex flex-wrap gap-1">
                          {customer.groups.map((group, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {group}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 border whitespace-nowrap">
                        {new Date(customer.dateCreated).toLocaleString()}
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
            {Math.min(startIndex + entriesPerPage, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} entries
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
    </div>
  );
};

export default CustomersPage;