import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreditNoteForm = () => {
  const navigate = useNavigate();
  
  // Form state matching your schema exactly
  const [formData, setFormData] = useState({
    customer: "",
    billTo: "",
    shipTo: "",
    creditNoteDate: new Date().toISOString().split('T')[0],
    currency: "USD",
    status: "Draft",
    discountType: "percent",
    discountValue: 0,
    adminNote: "",
    reference: "",
    project: ""
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
    tax2: 0
  });
  const [loading, setLoading] = useState(false);

  // Static data matching your schema enums
  const customers = ["Acme Corp", "Tech Solutions", "Global Traders"];
  const statusOptions = ["Draft", "Pending", "Issued", "Cancelled"];
  const taxOptions = [0, 5, 10, 15, 20];

  // Fetch items from database
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/admin/items");
        setDatabaseItems(data.data || data);
      } catch (err) {
        console.error("Error fetching items", err);
      }
    };
    fetchItems();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  // Item handlers
  const addItemFromDatabase = (item) => {
    const newCreditNoteItem = {
      description: item.description,
      quantity: 1,
      rate: parseFloat(item.rate?.replace('$', '') || 0),
      tax1: parseFloat(item.tax1) || 0,
      tax2: parseFloat(item.tax2) || 0
    };
    // Calculate amount
    newCreditNoteItem.amount = newCreditNoteItem.quantity * newCreditNoteItem.rate;
    
    setCreditNoteItems([...creditNoteItems, newCreditNoteItem]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...creditNoteItems];
    newItems[index][field] = field === 'quantity' || field === 'rate' || field === 'tax1' || field === 'tax2' 
      ? Number(value) 
      : value;
    
    // Recalculate amount if qty or rate changes
    if (field === 'quantity' || field === 'rate') {
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
      const response = await axios.post("http://localhost:5000/api/admin/items", {
        ...newItem,
        rate: newItem.rate.startsWith('$') ? newItem.rate : `$${newItem.rate}`
      });
      
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
        tax2: 0
      });
      setShowItemForm(false);
    } catch (err) {
      console.error("Error saving item", err);
      alert("Failed to save item: " + (err.response?.data?.message || err.message));
    }
  };

  // Calculations
  const subtotal = creditNoteItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = formData.discountType === "percent" 
    ? subtotal * (formData.discountValue / 100) 
    : parseFloat(formData.discountValue);
  const total = subtotal - discount;

  // Form validation
  const validate = () => {
    let newErrors = {};
    if (!formData.customer.trim()) newErrors.customer = "Customer is required";
    if (creditNoteItems.length === 0) newErrors.items = "At least one item is required";
    
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
      // Prepare items with proper structure
      const items = creditNoteItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
        amount: Number(item.amount || 0)
      }));

      // Prepare credit note data matching your schema
      const creditNoteData = {
        customer: formData.customer,
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
        total: total
      };

      // Remove undefined values
      Object.keys(creditNoteData).forEach(key => {
        if (creditNoteData[key] === undefined || creditNoteData[key] === "") {
          delete creditNoteData[key];
        }
      });

      console.log("Submitting credit note:", creditNoteData);

      const response = await axios.post('http://localhost:5000/api/admin/credit-notes', creditNoteData);
      
      if (response.data.success) {
        alert("Credit note saved successfully!");
        navigate("../sales/creditNotes");
      } else {
        throw new Error(response.data.message || "Failed to save credit note");
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      let errorMessage = "Failed to save credit note. Please check your data and try again.";
      
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg || err).join("\n");
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">New Credit Note</h2>
      
      {/* Main Form Container */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        {/* Two-column form layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {/* Customer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer*</label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded text-sm ${
                  errors.customer ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer, i) => (
                  <option key={i} value={customer}>{customer}</option>
                ))}
              </select>
              {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer}</p>}
            </div>

            {/* Bill To */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill To</label>
              <textarea
                name="billTo"
                value={formData.billTo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                rows="3"
                placeholder="Billing address"
              />
            </div>

            {/* Ship To */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ship To</label>
              <textarea
                name="shipTo"
                value={formData.shipTo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                rows="3"
                placeholder="Shipping address"
              />
            </div>

            {/* Date field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Date</label>
              <input
                type="date"
                name="creditNoteDate"
                value={formData.creditNoteDate}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              />
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Reference */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                placeholder="Reference number"
              />
            </div>

            {/* Project */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                placeholder="Project name"
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              >
                {statusOptions.map((status, i) => (
                  <option key={i} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              >
                <option value="USD">USD</option>
                <option value="BDT">BDT</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                  min="0"
                  step={formData.discountType === "percent" ? "1" : "0.01"}
                />
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
              <textarea
                name="adminNote"
                value={formData.adminNote}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                rows="3"
                placeholder="Internal notes about this credit note"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Database Management Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Item Database</h3>
          <button
            onClick={() => setShowItemForm(true)}
            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center"
          >
            <FaPlus /> <span className="ml-1">Add New Item</span>
          </button>
        </div>

        {/* Item Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Rate</th>
                <th className="p-3 font-medium">Tax 1</th>
                <th className="p-3 font-medium">Tax 2</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {databaseItems.map((item) => (
                <tr key={item._id}>
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.rate}</td>
                  <td className="p-3">{item.tax1}%</td>
                  <td className="p-3">{item.tax2}%</td>
                  <td className="p-3">
                    <button 
                      onClick={() => addItemFromDatabase(item)}
                      className="text-blue-500 hover:text-blue-700 px-2 py-1 border border-blue-500 rounded hover:bg-blue-50"
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
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Credit Note Items</h3>
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
                  amount: 0
                }
              ]);
            }}
            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center"
          >
            <FaPlus /> <span className="ml-1">Add Custom Item</span>
          </button>
        </div>
                {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}

        {/* Credit Note Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">Item Description</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Rate</th>
                <th className="p-3 font-medium">Tax 1 (%)</th>
                <th className="p-3 font-medium">Tax 2 (%)</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {creditNoteItems.map((item, i) => (
                <tr key={i}>
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(i, "description", e.target.value)}
                      className={`w-full border px-2 py-1 rounded ${
                        errors[`item-${i}-description`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Item description"
                      required
                    />
                    {errors[`item-${i}-description`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item-${i}-description`]}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                      className={`w-full border px-2 py-1 rounded ${
                        errors[`item-${i}-quantity`] ? "border-red-500" : "border-gray-300"
                      }`}
                      min="1"
                      step="1"
                      required
                    />
                    {errors[`item-${i}-quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item-${i}-quantity`]}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(i, "rate", e.target.value)}
                      className={`w-full border px-2 py-1 rounded ${
                        errors[`item-${i}-rate`] ? "border-red-500" : "border-gray-300"
                      }`}
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors[`item-${i}-rate`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item-${i}-rate`]}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={item.tax1}
                      onChange={(e) => handleItemChange(i, "tax1", e.target.value)}
                      className="w-full border px-2 py-1 rounded"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}%</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={item.tax2}
                      onChange={(e) => handleItemChange(i, "tax2", e.target.value)}
                      className="w-full border px-2 py-1 rounded"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}%</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">${item.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteItem(i)}
                      className="text-red-500 hover:text-red-700 p-1"
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
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center">
              <span className="font-medium mr-2">Discount:</span>
              <span className="text-sm">
                ({formData.discountType === "percent" ? `${formData.discountValue}%` : `$${formData.discountValue}`})
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-red-500 mr-1">-</span>
              <span>${discount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between py-2 font-bold text-lg mt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Add Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">Add Item</h2>
              <button
                onClick={() => setShowItemForm(false)}
                className="text-gray-500 hover:text-gray-700"
                type="button"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={saveNewItemToDatabase} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={newItem.description}
                    onChange={handleNewItemChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate - USD</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2">$</span>
                      <input
                        type="number"
                        name="rate"
                        value={newItem.rate}
                        onChange={handleNewItemChange}
                        className="w-full border px-3 py-2 rounded text-sm pl-6"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax 1</label>
                    <select
                      name="tax1"
                      value={newItem.tax1}
                      onChange={handleNewItemChange}
                      className="w-full border px-3 py-2 rounded text-sm"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax 2</label>
                    <select
                      name="tax2"
                      value={newItem.tax2}
                      onChange={handleNewItemChange}
                      className="w-full border px-3 py-2 rounded text-sm"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}%</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowItemForm(false)} 
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          type="button"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          type="button"
        >
          {loading ? "Saving..." : "Save & Send"}
        </button>
      </div>
    </div>
  );
};

export default CreditNoteForm;