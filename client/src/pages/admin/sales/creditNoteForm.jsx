/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTimes, FaSearch, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatBDT, CURRENCY_SYMBOL } from "../../../utils/currency";

const CreditNoteForm = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Form state matching your schema exactly
  const [formData, setFormData] = useState({
    customer: "",
    customerId: "",
    billTo: "",
    shipTo: "",
    creditNoteDate: new Date().toISOString().split("T")[0],
    currency: "BDT",
    status: "Draft",
    discountType: "percent",
    discountValue: 0,
    adminNote: "",
    reference: "",
    project: "",
  });

  // Items state
  const [errors, setErrors] = useState({});
  const [creditNoteItems, setCreditNoteItems] = useState([]);
  const [databaseItems, setDatabaseItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    quantity: 1,
    rate: "",
    tax1: 0,
    tax2: 0,
  });
  const [loading, setLoading] = useState(false);

  // Static data matching your schema enums
  const statusOptions = ["Draft", "Pending", "Issued", "Cancelled"];
  const taxOptions = [0, 5, 10, 15, 20];

  // Get auth token from localStorage
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
        setDatabaseItems(data.data || data);
      } catch (err) {
        console.error("Error fetching items", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("crm_token");
          navigate("/login");
        }
      }
    };
    fetchItems();
  }, []);

  // Customer search function
  const searchCustomers = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/subscriptions/customers/search?q=${searchTerm}`,
        config
      );
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

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(true);

    // Update form data
    setFormData({
      ...formData,
      customer: value,
      customerId: "", // Reset customer ID when typing
    });
  };

  const handleSelectCustomer = (customer) => {
    setFormData({
      ...formData,
      customer: customer.company,
      customerId: customer._id,
      billTo: customer.billingAddress || "",
      shipTo: customer.shippingAddress || "",
    });
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
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
    const newCreditNoteItem = {
      description: item.description,
      quantity: 1,
      rate: parseFloat(item.rate?.replace("$", "") || 0),
      tax1: parseFloat(item.tax1) || 0,
      tax2: parseFloat(item.tax2) || 0,
    };
    // Calculate amount
    newCreditNoteItem.amount =
      newCreditNoteItem.quantity * newCreditNoteItem.rate;

    setCreditNoteItems([...creditNoteItems, newCreditNoteItem]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...creditNoteItems];
    newItems[index][field] =
      field === "quantity" ||
      field === "rate" ||
      field === "tax1" ||
      field === "tax2"
        ? Number(value)
        : value;

    // Recalculate amount if qty or rate changes
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setCreditNoteItems(newItems);
  };

  const deleteItem = (index) => {
    const newItems = creditNoteItems.filter((_, i) => i !== index);
    setCreditNoteItems(newItems);
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

      // Add to credit note items
      addItemFromDatabase(response.data);

      // Reset form
      setNewItem({
        description: "",
        quantity: 1,
        rate: "",
        tax1: 0,
        tax2: 0,
      });
      setShowItemForm(false);
    } catch (err) {
      console.error("Error saving item", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert(
        "Failed to save item: " + (err.response?.data?.message || err.message)
      );
    }
  };

  // Calculations
  const subtotal = creditNoteItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const discount =
    formData.discountType === "percent"
      ? subtotal * (formData.discountValue / 100)
      : parseFloat(formData.discountValue);
  const total = subtotal - discount;

  // Form validation
  const validate = () => {
    let newErrors = {};
    if (!formData.customer.trim() || !formData.customerId)
      newErrors.customer = "Customer is required";
    if (creditNoteItems.length === 0)
      newErrors.items = "At least one item is required";

    // Validate each item
    creditNoteItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = "Item description is required";
      }
      if (item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = "Quantity must be greater than 0";
      }
      if (item.rate <= 0) {
        newErrors[`item-${index}-rate`] = "Rate must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (send = false) => {
    if (!validate()) return;

    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Authentication token missing. Please login again.");
        navigate("/login");
        return;
      }

      // Prepare items with proper structure
      const items = creditNoteItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
        amount: Number(item.amount || 0),
      }));

      // Prepare credit note data matching your schema
      // REMOVE customerId as it's not needed by the backend
      const creditNoteData = {
        customer: formData.customer, // Only send customer name, not customerId
        billTo: formData.billTo || undefined,
        shipTo: formData.shipTo || undefined,
        creditNoteDate: formData.creditNoteDate,
        currency: formData.currency,
        status: formData.status,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
        adminNote: formData.adminNote || undefined,
        reference: formData.reference || undefined,
        project: formData.project || undefined,
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: total,
      };

      // Remove undefined values
      Object.keys(creditNoteData).forEach((key) => {
        if (creditNoteData[key] === undefined || creditNoteData[key] === "") {
          delete creditNoteData[key];
        }
      });

      const config = createAxiosConfig();
      const response = await axios.post(
        `${API_BASE_URL}/admin/credit-notes`,
        creditNoteData,
        config
      );

      if (response.data.success) {
        alert("Credit note saved successfully!");
        navigate("../sales/creditNotes");
      } else {
        throw new Error(response.data.message || "Failed to save credit note");
      }
    } catch (error) {
      console.error("Submission error:", error);

      let errorMessage =
        "Failed to save credit note. Please check your data and try again.";

      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("crm_token");
        navigate("/login");
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors
          .map((err) => err.msg || err)
          .join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {/* Hero band */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
          Sales
        </p>
        <h2 className="text-2xl font-bold text-white mt-1">New Credit Note</h2>
        <div className="flex items-center text-slate-300 mt-2 text-sm">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Credit Notes</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>New Credit Note</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        {/* Two-column form layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {/* Customer */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Customer*
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.customer}
                  onChange={handleCustomerSearchChange}
                  className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    errors.customer ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="Search customer by company name..."
                />
                <FaSearch className="absolute right-3 top-3 text-slate-400 text-sm" />
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                    {customerSearchResults.map((customer, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.company}</div>
                        <div className="text-sm text-gray-600">
                          {customer.contact} - {customer.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showCustomerDropdown &&
                  customerSearchResults.length === 0 &&
                  customerSearchTerm.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                      <div className="px-3 py-2 text-gray-500">
                        No customers found
                      </div>
                    </div>
                  )}
              </div>
              {errors.customer && (
                <p className="text-red-500 text-xs mt-1">{errors.customer}</p>
              )}
            </div>

            {/* Bill To */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Bill To
              </label>
              <textarea
                name="billTo"
                value={formData.billTo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows="3"
                placeholder="Billing address"
              />
            </div>

            {/* Ship To */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Ship To
              </label>
              <textarea
                name="shipTo"
                value={formData.shipTo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows="3"
                placeholder="Shipping address"
              />
            </div>

            {/* Date field */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Credit Note Date
              </label>
              <input
                type="date"
                name="creditNoteDate"
                value={formData.creditNoteDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Reference */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Reference
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Reference number"
              />
            </div>

            {/* Project */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Project
              </label>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Project name"
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {statusOptions.map((status, i) => (
                  <option key={i} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="mb-4">
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

            {/* Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  min="0"
                  step={formData.discountType === "percent" ? "1" : "0.01"}
                />
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Admin Note
              </label>
              <textarea
                name="adminNote"
                value={formData.adminNote}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows="3"
                placeholder="Internal notes about this credit note"
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
            <FaPlus /> <span>Add New Item</span>
          </button>
        </div>

        {/* Item Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                <th className="p-3 rounded-l-xl">Description</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Tax 1</th>
                <th className="p-3">Tax 2</th>
                <th className="p-3 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {databaseItems.map((item) => (
                <tr key={item._id} className="hover:bg-white/70 transition-colors">
                  <td className="p-3 text-slate-700">{item.description}</td>
                  <td className="p-3 text-slate-700 tabular-nums">{item.rate}</td>
                  <td className="p-3 text-slate-700">{item.tax1}%</td>
                  <td className="p-3 text-slate-700">{item.tax2}%</td>
                  <td className="p-3">
                    <button
                      onClick={() => addItemFromDatabase(item)}
                      className="text-sm font-semibold text-slate-900 hover:text-slate-600"
                    >
                      Add to Credit Note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Note Items Section */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Line Items
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Credit Note Items</h3>
          </div>
          <button
            onClick={() => {
              setCreditNoteItems([
                ...creditNoteItems,
                {
                  description: "",
                  quantity: 1,
                  rate: 0,
                  tax1: 0,
                  tax2: 0,
                  amount: 0,
                },
              ]);
            }}
            className="rounded-xl border border-dashed border-slate-300 text-slate-600 px-5 py-2.5 text-sm font-semibold hover:bg-white flex items-center gap-2"
          >
            <FaPlus /> <span>Add Custom Item</span>
          </button>
        </div>
        {errors.items && (
          <p className="text-red-500 text-xs mb-2">{errors.items}</p>
        )}

        {/* Credit Note Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 text-left">
                <th className="p-3 rounded-l-xl">#</th>
                <th className="p-3">Item Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Tax 1 (%)</th>
                <th className="p-3">Tax 2 (%)</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {creditNoteItems.map((item, i) => (
                <tr key={i} className="hover:bg-white/70 transition-colors">
                  <td className="p-3 text-slate-500 tabular-nums">{i + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(i, "description", e.target.value)
                      }
                      className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        errors[`item-${i}-description`]
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      placeholder="Item description"
                      required
                    />
                    {errors[`item-${i}-description`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`item-${i}-description`]}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(i, "quantity", e.target.value)
                      }
                      className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        errors[`item-${i}-quantity`]
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      min="1"
                      step="1"
                      required
                    />
                    {errors[`item-${i}-quantity`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`item-${i}-quantity`]}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(i, "rate", e.target.value)
                      }
                      className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        errors[`item-${i}-rate`]
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors[`item-${i}-rate`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`item-${i}-rate`]}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={item.tax1}
                      onChange={(e) =>
                        handleItemChange(i, "tax1", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>
                          {option}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={item.tax2}
                      onChange={(e) =>
                        handleItemChange(i, "tax2", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>
                          {option}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-900 tabular-nums">{formatBDT(item.amount)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteItem(i)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove"
                      type="button"
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
              <span className="text-sm text-slate-600">
                (
                {formData.discountType === "percent"
                  ? `${formData.discountValue}%`
                  : `${CURRENCY_SYMBOL} ${formData.discountValue}`}
                )
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-red-500 mr-1">-</span>
              <span className="tabular-nums text-slate-900">{formatBDT(discount)}</span>
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
                type="button"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                      Rate - BDT
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2">{CURRENCY_SYMBOL}</span>
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
                          {option}%
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
                          {option}%
                        </option>
                      ))}
                    </select>
                  </div>
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
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
          type="button"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
          type="button"
        >
          {loading ? "Saving..." : "Save & Send"}
        </button>
      </div>
    </div>
  );
};

export default CreditNoteForm;
