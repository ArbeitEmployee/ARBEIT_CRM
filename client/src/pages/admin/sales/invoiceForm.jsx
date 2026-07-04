/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaPlus,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatBDT } from "../../../utils/currency";
import { PAYMENT_METHODS } from "../../../utils/bd";

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

const InvoiceForm = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Form state matching your schema exactly
  const [formData, setFormData] = useState({
    customer: "",
    customerId: "",
    billTo: "",
    shipTo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    tags: "",
    paymentMode: "bKash",
    currency: "BDT",
    salesAgent: "",
    salesAgentId: "",
    recurringInvoice: "No",
    discountType: "percent",
    discountValue: 0,
    adminNote: "",
    status: "Draft",
    paidAmount: 0,
  });

  // Items state
  const [errors, setErrors] = useState({});
  const [invoiceItems, setInvoiceItems] = useState([]);
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
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Staff search state
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [staffSearchResults, setStaffSearchResults] = useState([]);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Use the custom hook for detecting outside clicks
  const customerRef = useOutsideClick(() => {
    setShowCustomerDropdown(false);
  });

  const staffRef = useOutsideClick(() => {
    setShowStaffDropdown(false);
  });

  // Static data matching your schema enums
  const tagOptions = ["Bug", "Follow Up", "Urgent", "Design", "Development"];
  const paymentModes = ["Bank", "Stripe Checkout"];
  const recurringOptions = ["No", "Every one month", "Custom"];
  const statusOptions = ["Draft", "Unpaid", "Paid", "Partiallypaid", "Overdue"];
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
      if (error.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setCustomerSearchResults([]);
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
      if (customerSearchTerm) {
        searchCustomers(customerSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchTerm]);

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
    const { name, value } = e.target;

    // If status changes to "Partiallypaid", validate paid amount
    if (name === "status" && value === "Partiallypaid") {
      setFormData({
        ...formData,
        [name]: value,
        paidAmount: formData.paidAmount > total ? total : formData.paidAmount,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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

  const handleStaffSearchChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      salesAgent: value,
      salesAgentId: "",
    });
    setStaffSearchTerm(value);
    setShowStaffDropdown(true);
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

  const handleSelectStaff = (staff) => {
    setFormData({
      ...formData,
      salesAgentId: staff._id,
      salesAgent: staff.name,
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
    const newInvoiceItem = {
      description: item.description,
      quantity: 1,
      rate: parseFloat(item.rate?.replace("$", "") || 0),
      tax1: parseFloat(item.tax1) || 0,
      tax2: parseFloat(item.tax2) || 0,
    };
    // Calculate amount
    newInvoiceItem.amount = newInvoiceItem.quantity * newInvoiceItem.rate;

    setInvoiceItems([...invoiceItems, newInvoiceItem]);
    setShowItemsDropdown(false);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
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

    setInvoiceItems(newItems);
  };

  const deleteItem = (index) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(newItems);
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

      // Add to invoice items
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
  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const discount =
    formData.discountType === "percent"
      ? subtotal * (formData.discountValue / 100)
      : parseFloat(formData.discountValue);
  const total = subtotal - discount;

  // Handle paid amount change
  const handlePaidAmountChange = (e) => {
    const value = Math.max(0, Math.min(total, parseFloat(e.target.value) || 0));
    setFormData({
      ...formData,
      paidAmount: value,
    });
  };

  // Form validation
  const validate = () => {
    let newErrors = {};
    if (!formData.customer.trim()) newErrors.customer = "Customer is required";
    if (!formData.customerId)
      newErrors.customer = "Please select a valid customer from the dropdown";
    if (invoiceItems.length === 0)
      newErrors.items = "At least one item is required";

    // Validate Partiallypaid amount
    if (formData.status === "Partiallypaid" && formData.paidAmount <= 0) {
      newErrors.paidAmount =
        "Paid amount must be greater than 0 for Partiallypaid invoices";
    }

    if (formData.status === "Partiallypaid" && formData.paidAmount >= total) {
      newErrors.paidAmount =
        "Paid amount must be less than total for Partiallypaid invoices";
    }

    // Validate each item
    invoiceItems.forEach((item, index) => {
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
      const config = createAxiosConfig();

      // Prepare items with proper structure
      const items = invoiceItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
        amount: Number(item.amount || 0),
      }));

      // Prepare invoice data matching your schema
      const invoiceData = {
        customer: formData.customer,
        customerId: formData.customerId,
        billTo: formData.billTo,
        shipTo: formData.shipTo,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags || undefined,
        paymentMode: formData.paymentMode,
        currency: formData.currency,
        salesAgent: formData.salesAgent,
        salesAgentId: formData.salesAgentId,
        recurringInvoice: formData.recurringInvoice,
        discountType: formData.discountType,
        discountValue: formData.discountValue || 0,
        adminNote: formData.adminNote || undefined,
        status: formData.status,
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: total,
      };

      // Add paidAmount if status is Partiallypaid
      if (formData.status === "Partiallypaid") {
        invoiceData.paidAmount = formData.paidAmount;
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/invoices`,
        invoiceData,
        config
      );

      if (response.data.success) {
        alert("Invoice saved successfully!");
        navigate("../sales/invoices");
      } else {
        throw new Error(response.data.message || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Submission error:", error);

      let errorMessage =
        "Failed to save invoice. Please check your data and try again.";

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
        <h2 className="text-2xl font-bold text-white mt-1">New Invoice</h2>
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
              <div className="relative" ref={customerRef}>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={handleCustomerSearchChange}
                  className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    errors.customer ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="Search customer by company name..."
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400 text-sm" />
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

            {/* Date fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {PAYMENT_METHODS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Status Field */}
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
                {statusOptions.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Partiallypaid Amount Field - Only show when status is Partiallypaid */}
            {formData.status === "Partiallypaid" && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Paid Amount (Max: ${total.toFixed(2)})
                </label>
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handlePaidAmountChange}
                  className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    errors.paidAmount ? "border-red-500" : "border-slate-200"
                  }`}
                  min="0"
                  max={total}
                  step="0.01"
                />
                {errors.paidAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.paidAmount}
                  </p>
                )}
              </div>
            )}

            {/* Recurring Invoice */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                Recurring Invoice
              </label>
              <select
                name="recurringInvoice"
                value={formData.recurringInvoice}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {recurringOptions.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency and Sales Agent */}
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
                  <option value="USD">USD</option>
                  <option value="BDT">BDT</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                  Sales Agent
                </label>
                <div className="relative" ref={staffRef}>
                  <input
                    type="text"
                    name="salesAgent"
                    value={formData.salesAgent}
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
                placeholder="Internal notes about this invoice"
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

        {/* Item Selection Dropdown */}
        <div className="mb-4">
          <div className="relative">
            <button
              onClick={() => setShowItemsDropdown(!showItemsDropdown)}
              className="w-full flex justify-between items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <span>Select Items to Add</span>
              {showItemsDropdown ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showItemsDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                {databaseItems.length > 0 ? (
                  databaseItems.map((item) => (
                    <div
                      key={item._id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex justify-between items-center"
                      onClick={() => addItemFromDatabase(item)}
                    >
                      <div>
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-gray-600">
                          $
                          {parseFloat(item.rate?.replace("$", "") || 0).toFixed(
                            2
                          )}{" "}
                          | Tax1: {item.tax1}% | Tax2: {item.tax2}%
                        </div>
                      </div>
                      <button
                        className="text-blue-500 hover:text-blue-700 px-2 py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItemFromDatabase(item);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">
                    No items available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Item Database Table - Now Collapsible */}
        <div className="mb-4">
          <button
            onClick={() => setShowItemsDropdown(!showItemsDropdown)}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            {showItemsDropdown
              ? "Hide Item Database"
              : "Show Full Item Database"}
            {showItemsDropdown ? (
              <FaChevronUp className="ml-1" />
            ) : (
              <FaChevronDown className="ml-1" />
            )}
          </button>
        </div>

        {showItemsDropdown && (
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
                  <tr
                    key={item._id}
                    className="hover:bg-white/70 transition-colors"
                  >
                    <td className="p-3 text-slate-700">{item.description}</td>
                    <td className="p-3 text-slate-700 tabular-nums">{item.rate}</td>
                    <td className="p-3 text-slate-700">{item.tax1}%</td>
                    <td className="p-3 text-slate-700">{item.tax2}%</td>
                    <td className="p-3">
                      <button
                        onClick={() => addItemFromDatabase(item)}
                        className="text-sm font-semibold text-slate-900 hover:text-slate-600"
                      >
                        Add to Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Items Section */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Line Items
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Invoice Items</h3>
          </div>
          <button
            onClick={() => {
              setInvoiceItems([
                ...invoiceItems,
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
            <FaPlus /> Add Custom Item
          </button>
        </div>

        {errors.items && (
          <p className="text-red-500 text-xs mb-2">{errors.items}</p>
        )}

        {/* Invoice Items Table */}
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
              {invoiceItems.map((item, i) => (
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
                      className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 ${
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
                      className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 ${
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
                  <td className="p-3 text-right font-semibold text-slate-900 tabular-nums">
                    ${item.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteItem(i)}
                      className="text-red-600 hover:text-red-800"
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
            <span className="tabular-nums text-slate-900">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-200/70">
            <div className="flex items-center">
              <span className="font-medium text-slate-600 mr-2">Discount:</span>
              <span className="text-sm text-slate-600">
                (
                {formData.discountType === "percent"
                  ? `${formData.discountValue}%`
                  : `$${formData.discountValue}`}
                )
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-red-500 mr-1">-</span>
              <span className="tabular-nums text-slate-900">${discount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-2 mt-2">
            <span className="font-semibold text-slate-600">Total:</span>
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">${total.toFixed(2)}</span>
          </div>

          {/* Show paid amount and balance if Partiallypaid */}
          {formData.status === "Partiallypaid" && (
            <>
              <div className="flex justify-between py-2 border-t border-slate-200/70 mt-2">
                <span className="font-medium text-slate-600">Paid Amount:</span>
                <span className="text-green-600 tabular-nums">
                  ${formData.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline py-2 border-t border-slate-200/70">
                <span className="font-semibold text-slate-600">Balance Due:</span>
                <span className="text-2xl font-extrabold text-slate-900 tabular-nums">${(total - formData.paidAmount).toFixed(2)}</span>
              </div>
            </>
          )}
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
                      Rate - USD
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

export default InvoiceForm;
