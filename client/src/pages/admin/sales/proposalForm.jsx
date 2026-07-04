/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatBDT, CURRENCY_SYMBOL } from "../../../utils/currency";

// Custom hook for detecting outside clicks
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [ref, callback]);

  return ref;
};

const ProposalForm = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    clientId: "",
    clientEmail: "",
    status: "Draft",
    items: [],
    total: 0,
    date: "",
    openTill: "",
    currency: "BDT",
    discountType: "percent",
    discountValue: 0,
    tags: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    phone: "",
    assigned: "",
    assignedId: "",
  });

  // Items state
  const [errors, setErrors] = useState({});
  const [proposalItems, setProposalItems] = useState([]);
  const [databaseItems, setDatabaseItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    longDescription: "",
    rate: "",
    tax1: "",
    tax2: "",
    unit: "",
    groupName: "",
  });

  // Search states
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Use the custom hook for detecting outside clicks
  const clientRef = useOutsideClick(() => {
    setShowClientDropdown(false);
  });

  const staffRef = useOutsideClick(() => {
    setShowStaffDropdown(false);
  });

  const tagOptions = ["Bug", "Follow Up", "Urgent", "Design", "Development"];
  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected"];
  const taxOptions = ["", "0%", "5%", "10%", "15%", "20%"];

  // Get auth token from localStorage (using the same key as staff page: "crm_token")
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

  // Configure axios defaults
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch items from database
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const config = createAxiosConfig();
        const { data } = await axios.get(`${API_BASE_URL}/admin/items`, config);
        setDatabaseItems(data);
      } catch (err) {
        console.error("Error fetching items", err);
        if (err.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("crm_token");
          navigate("/login");
        }
      }
    };
    fetchItems();
  }, []);

  // Search customers by company name
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setClientSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/projects/customers/search?q=${searchTerm}`,
        config
      );
      setClientSearchResults(data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setClientSearchResults([]);
    }
  };

  // Search staff by name
  const searchStaff = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setStaffSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/staffs?search=${searchTerm}`,
        config
      );
      setStaffSearchResults(data.staffs || []);
    } catch (error) {
      console.error("Error searching staff:", error);
      setStaffSearchResults([]);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (clientSearchTerm) {
        searchCustomers(clientSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [clientSearchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (staffSearchTerm) {
        searchStaff(staffSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [staffSearchTerm]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleClientSearchChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      clientName: value,
      clientId: "",
      clientEmail: "",
    });
    setClientSearchTerm(value);
    setShowClientDropdown(true);
  };

  const handleStaffSearchChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      assigned: value,
      assignedId: "",
    });
    setStaffSearchTerm(value);
    setShowStaffDropdown(true);
  };

  const handleSelectClient = (client) => {
    setFormData({
      ...formData,
      clientId: client._id,
      clientName: client.company,
      clientEmail: client.email || "",
    });
    setShowClientDropdown(false);
    setClientSearchTerm("");
  };

  const handleSelectStaff = (staff) => {
    setFormData({
      ...formData,
      assignedId: staff._id,
      assigned: staff.name,
    });
    setShowStaffDropdown(false);
    setStaffSearchTerm("");
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value,
    });
  };

  // Item handlers
  const addItemFromDatabase = (item) => {
    const newProposalItem = {
      description: item.description,
      quantity: 1,
      rate: parseFloat(item.rate.replace("$", "")),
      tax1: parseFloat(item.tax1) || 0,
      tax2: parseFloat(item.tax2) || 0,
    };
    setProposalItems([...proposalItems, newProposalItem]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...proposalItems];
    newItems[index][field] = value;

    // Recalculate amount if quantity or rate changes
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setProposalItems(newItems);
  };

  const deleteItem = (index) => {
    if (proposalItems.length > 1) {
      const newItems = proposalItems.filter((_, i) => i !== index);
      setProposalItems(newItems);
    }
  };

  const saveNewItemToDatabase = async (e) => {
    e.preventDefault();
    try {
      const config = createAxiosConfig();
      const response = await axios.post(
        `${API_BASE_URL}/admin/items`,
        {
          ...newItem,
          rate: newItem.rate.startsWith("$")
            ? newItem.rate
            : `$${newItem.rate}`,
        },
        config
      );

      // Add to database items
      setDatabaseItems([response.data, ...databaseItems]);

      // Add to proposal items
      addItemFromDatabase(response.data);

      // Reset form
      setNewItem({
        description: "",
        longDescription: "",
        rate: "",
        tax1: "",
        tax2: "",
        unit: "",
        groupName: "",
      });
      setShowItemForm(false);
    } catch (err) {
      console.error("Error saving item", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Calculations
  const subtotal = proposalItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const discount =
    formData.discountType === "percent"
      ? subtotal * (formData.discountValue / 100)
      : formData.discountValue;
  const total = subtotal - discount;

  // Form validation and submission
  const validate = () => {
    let newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.clientName || !formData.clientId)
      newErrors.clientName = "Client is required";
    if (!formData.clientEmail) newErrors.clientEmail = "Email is required";
    if (proposalItems.length === 0)
      newErrors.items = "At least one item is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (send = false) => {
    if (!validate()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Authentication token missing. Please login again.");
        navigate("/login");
        return;
      }

      // Prepare items in the correct format for backend
      const items = proposalItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
      }));

      const proposalData = {
        title: formData.title,
        clientId: formData.clientId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        status: formData.status,
        items: items,
        date: formData.date || new Date().toISOString().split("T")[0],
        openTill: formData.openTill || null,
        currency: formData.currency,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue || 0),
        tags: formData.tags,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zip: formData.zip,
        phone: formData.phone,
        assigned: formData.assigned,
        assignedId: formData.assignedId,
      };

      const config = createAxiosConfig();
      const response = await axios.post(
        `${API_BASE_URL}/admin/proposals`,
        proposalData,
        config
      );

      if (response.data.success) {
        alert(`Proposal saved successfully!`);
        navigate("../sales/proposals");
      } else {
        throw new Error(response.data.message || "Failed to save proposal");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);

      let errorMessage = "Failed to save proposal";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("crm_token");
        navigate("/login");
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors
          .map((e) => e.message)
          .join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {/* Hero band */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
          Sales
        </p>
        <h2 className="text-2xl font-bold text-white mt-1">New Quotation</h2>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        {/* Two-column form layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  errors.title ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Client Name */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Client Name*
              </label>
              <div className="relative" ref={clientRef}>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleClientSearchChange}
                  className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    errors.clientName ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="Search client by company name..."
                />
                {showClientDropdown && clientSearchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                    {clientSearchResults.map((client, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="font-medium">{client.company}</div>
                        <div className="text-sm text-gray-600">
                          {client.contact} - {client.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showClientDropdown &&
                  clientSearchResults.length === 0 &&
                  clientSearchTerm.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                      <div className="px-3 py-2 text-gray-500">
                        No clients found
                      </div>
                    </div>
                  )}
              </div>
              {errors.clientName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
              )}
            </div>

            {/* Date fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Open Till
                </label>
                <input
                  type="date"
                  name="openTill"
                  value={formData.openTill}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Currency and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Discount Type
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Tags
              </label>
              <select
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Select Tag</option>
                {tagOptions.map((tag, i) => (
                  <option key={i} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Status and Assigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Assigned
                </label>
                <div className="relative" ref={staffRef}>
                  <input
                    type="text"
                    name="assigned"
                    value={formData.assigned}
                    onChange={handleStaffSearchChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Search staff by name..."
                  />
                  {showStaffDropdown && staffSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                      {staffSearchResults.map((staff, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleSelectStaff(staff)}
                        >
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-gray-600">
                            {staff.position} - {staff.department}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showStaffDropdown &&
                    staffSearchResults.length === 0 &&
                    staffSearchTerm.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="px-3 py-2 text-gray-500">
                          No staff found
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Client Email */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Client Email*
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  errors.clientEmail ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.clientEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.clientEmail}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows="3"
              />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Database Management Section */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Catalog
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Item Database</h3>
          </div>
          <button
            onClick={() => setShowItemForm(true)}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 flex items-center gap-2"
          >
            <FaPlus /> Add New Item
          </button>
        </div>

        {/* Item Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                <th className="p-3 rounded-l-xl">Description</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Tax 1</th>
                <th className="p-3">Tax 2</th>
                <th className="p-3">Group</th>
                <th className="p-3 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {databaseItems.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-white/70 transition-colors"
                >
                  <td className="p-3 text-slate-700">{item.description}</td>
                  <td className="p-3 text-slate-700 tabular-nums">{item.rate}</td>
                  <td className="p-3 text-slate-700">{item.unit}</td>
                  <td className="p-3 text-slate-700">{item.tax1}</td>
                  <td className="p-3 text-slate-700">{item.tax2}</td>
                  <td className="p-3 text-slate-700">{item.groupName}</td>
                  <td className="p-3">
                    <button
                      onClick={() => addItemFromDatabase(item)}
                      className="text-sm font-semibold text-slate-900 hover:text-slate-600"
                    >
                      Add to Proposal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Items Section */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Line Items
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Quotation Items</h3>
          </div>
          <button
            onClick={() => {
              setProposalItems([
                ...proposalItems,
                {
                  description: "",
                  quantity: 1,
                  rate: 0,
                  tax1: 0,
                  tax2: 0,
                },
              ]);
            }}
            className="rounded-xl border border-dashed border-slate-300 text-slate-600 px-5 py-2.5 text-sm font-semibold hover:bg-white flex items-center gap-2"
          >
            <FaPlus /> Add Custom Item
          </button>
        </div>

        {errors.items && (
          <p className="text-red-500 text-sm mb-3">{errors.items}</p>
        )}

        {/* Proposal Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                <th className="p-3 rounded-l-xl">#</th>
                <th className="p-3">Item Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Tax 1</th>
                <th className="p-3">Tax 2</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {proposalItems.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-white/70 transition-colors"
                >
                  <td className="p-3 text-slate-500 tabular-nums">{i + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(i, "description", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const quantity = Math.max(
                          1,
                          parseInt(e.target.value) || 1
                        );
                        handleItemChange(i, "quantity", quantity);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      min="1"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        handleItemChange(i, "rate", rate);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.tax1}
                      onChange={(e) =>
                        handleItemChange(
                          i,
                          "tax1",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.tax2}
                      onChange={(e) =>
                        handleItemChange(
                          i,
                          "tax2",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatBDT(item.quantity * item.rate)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteItem(i)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove"
                    >
                      <FaTimes />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur w-full md:w-1/3">
          <div className="flex justify-between py-2 border-b border-slate-200/70">
            <span className="font-medium text-slate-600">Subtotal:</span>
            <span className="tabular-nums text-slate-900">{formatBDT(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
            <div className="flex items-center">
              <span className="font-medium text-slate-600 mr-2">Discount:</span>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="percent">%</option>
                <option value="fixed">{CURRENCY_SYMBOL}</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-red-500 mr-1">-</span>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    discountValue: Math.max(0, parseFloat(e.target.value) || 0),
                  });
                }}
                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300"
                min="0"
                step={formData.discountType === "percent" ? "1" : "0.01"}
              />
              <span className="ml-1 text-slate-600">
                {formData.discountType === "percent" ? "%" : CURRENCY_SYMBOL}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-2 mt-2">
            <span className="font-semibold text-slate-600">Total:</span>
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{formatBDT(total)}</span>
          </div>
        </div>
      </div>

      {/* Add Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl border border-white/60 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,.25)] backdrop-blur w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/70 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Add Item</h2>
              <button
                onClick={() => setShowItemForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={saveNewItemToDatabase} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={newItem.description}
                    onChange={handleNewItemChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Long Description
                  </label>
                  <textarea
                    name="longDescription"
                    value={newItem.longDescription}
                    onChange={handleNewItemChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Rate - USD (Base Currency)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2">$</span>
                    <input
                      type="number"
                      name="rate"
                      value={newItem.rate}
                      onChange={handleNewItemChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 pl-6 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                      Tax 1
                    </label>
                    <select
                      name="tax1"
                      value={newItem.tax1}
                      onChange={handleNewItemChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                      Tax 2
                    </label>
                    <select
                      name="tax2"
                      value={newItem.tax2}
                      onChange={handleNewItemChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={newItem.unit}
                    onChange={handleNewItemChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                    Item Group
                  </label>
                  <input
                    type="text"
                    name="groupName"
                    value={newItem.groupName}
                    onChange={handleNewItemChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => handleSubmit(false)}
          className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
        >
          Save & Send
        </button>
      </div>
    </div>
  );
};

export default ProposalForm;
