import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EstimateForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    customer: "",
    billTo: "",
    shipTo: "",
    estimateDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    tags: "",
    currency: "USD",
    status: "Draft",
    reference: "",
    salesAgent: "",
    discountType: "percent",
    discountValue: 0,
    adminNote: "",
    items: []
  });

  // Items state
  const [errors, setErrors] = useState({});
  const [estimateItems, setEstimateItems] = useState([]);
  const [databaseItems, setDatabaseItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    quantity: 1,
    rate: "",
    tax1: 0,
    tax2: 0
  });

  // Static data
  const customers = ["Acme Corp", "Tech Solutions", "Global Traders"];
  const staffMembers = ["John Doe", "Jane Smith", "Mike Johnson"];
  const tagOptions = ["Bug", "Follow Up", "Urgent", "Design", "Development"];
  const statusOptions = ["Draft", "Pending", "Approved", "Rejected"];
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
    const newEstimateItem = {
      description: item.description,
      quantity: 1,
      rate: parseFloat(item.rate?.replace('$', '') || 0),
      tax1: parseFloat(item.tax1) || 0,
      tax2: parseFloat(item.tax2) || 0,
      amount: parseFloat(item.rate?.replace('$', '') || 0)
    };
    setEstimateItems([...estimateItems, newEstimateItem]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...estimateItems];
    newItems[index][field] = value;
    
    // Recalculate amount if qty or rate changes
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    
    setEstimateItems(newItems);
  };

  const deleteItem = (index) => {
    if (estimateItems.length > 1) {
      const newItems = estimateItems.filter((_, i) => i !== index);
      setEstimateItems(newItems);
    }
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
      
      // Add to estimate items
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
    }
  };

  // Calculations
  const subtotal = estimateItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = formData.discountType === "percent" 
    ? subtotal * (formData.discountValue / 100) 
    : parseFloat(formData.discountValue);
  const total = subtotal - discount;

  // Form validation and submission
  const validate = () => {
    let newErrors = {};
    if (!formData.customer) newErrors.customer = "Customer is required";
    if (!formData.reference) newErrors.reference = "Reference is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (send = false) => {
    if (!validate()) return;
    
    try {
      // Prepare items with proper structure
      const items = estimateItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0)
      }));

      const estimateData = {
        customer: formData.customer,
        billTo: formData.billTo,
        shipTo: formData.shipTo,
        estimateDate: formData.estimateDate,
        expiryDate: formData.expiryDate,
        tags: formData.tags,
        currency: formData.currency,
        status: formData.status,
        reference: formData.reference,
        salesAgent: formData.salesAgent,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        adminNote: formData.adminNote,
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: total
      };

      console.log("Submitting:", estimateData);

      const response = await axios.post('http://localhost:5000/api/admin/estimates', estimateData);
      
      if (response.data.success) {
        alert("Estimate saved successfully!");
        navigate("../sales/estimates");
      } else {
        throw new Error(response.data.message || "Failed to save estimate");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      
      let errorMessage = "Failed to save estimate";
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">New Estimate</h2>
      
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
              />
            </div>

            {/* Date fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Date</label>
                <input
                  type="date"
                  name="estimateDate"
                  value={formData.estimateDate}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Reference */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference*</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded text-sm ${
                  errors.reference ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference}</p>}
            </div>

            {/* Status and Sales Agent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Agent</label>
                <select
                  name="salesAgent"
                  value={formData.salesAgent}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                >
                  <option value="">Select Agent</option>
                  {staffMembers.map((staff, i) => (
                    <option key={i} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
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
            </div>

            {/* Discount Value */}
            <div className="mb-4">
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

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <select
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              >
                <option value="">Select Tag</option>
                {tagOptions.map((tag, i) => (
                  <option key={i} value={tag}>{tag}</option>
                ))}
              </select>
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
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Add to Estimate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estimate Items Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Estimate Items</h3>
          <button
            onClick={() => {
              setEstimateItems([
                ...estimateItems,
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

        {/* Estimate Items Table */}
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
              {estimateItems.map((item, i) => (
                <tr key={i}>
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(i, "description", e.target.value)}
                      className="w-full border px-2 py-1 rounded"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const quantity = Math.max(1, parseInt(e.target.value) || 1);
                        handleItemChange(i, "quantity", quantity);
                        handleItemChange(i, "amount", item.rate * quantity);
                      }}
                      className="w-full border px-2 py-1 rounded"
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
                        handleItemChange(i, "amount", item.quantity * rate);
                      }}
                      className="w-full border px-2 py-1 rounded"
                      min="0"
                      step="0.01"
                    />
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
                      className="text-red-500 hover:text-red-700"
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
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save & Send
        </button>
      </div>
    </div>
  );
};

export default EstimateForm;