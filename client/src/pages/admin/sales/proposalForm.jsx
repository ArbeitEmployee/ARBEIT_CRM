import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ProposalForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    status: "Draft",
    items: [],
    total: 0,
    date: "",
    openTill: "",
    currency: "USD",
    discountType: "percent",
    discountValue: 0,
    tags: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    phone: "",
    assigned: ""
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
    groupName: ""
  });

  // Static data
  const customers = ["Acme Corp", "Tech Solutions", "Global Traders"];
  const staffMembers = ["John Doe", "Jane Smith", "Mike Johnson"];
  const tagOptions = ["Bug", "Follow Up", "Urgent", "Design", "Development"];
  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected"];
  const taxOptions = ["", "0%", "5%", "10%", "15%", "20%"];

  // Fetch items from database
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/admin/items");
        setDatabaseItems(data);
      } catch (err) {
        console.error("Error fetching items", err);
      }
    };
    fetchItems();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
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
    const newProposalItem = {
      description: item.description,
      qty: 1,
      rate: parseFloat(item.rate.replace('$', '')),
      amount: parseFloat(item.rate.replace('$', ''))
    };
    setProposalItems([...proposalItems, newProposalItem]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...proposalItems];
    newItems[index][field] = value;
    
    // Recalculate amount if qty or rate changes
    if (field === 'qty' || field === 'rate') {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
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
      const response = await axios.post("http://localhost:5000/api/admin/items", {
        ...newItem,
        rate: newItem.rate.startsWith('$') ? newItem.rate : `$${newItem.rate}`
      });
      
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
        groupName: ""
      });
      setShowItemForm(false);
    } catch (err) {
      console.error("Error saving item", err);
    }
  };

  // Calculations
  const subtotal = proposalItems.reduce((sum, item) => sum + item.amount, 0);
  const discount = formData.discountType === "percent" 
    ? subtotal * (formData.discountValue / 100) 
    : formData.discountValue;
  const total = subtotal - discount;

  // Form validation and submission
  const validate = () => {
    let newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.clientEmail) newErrors.clientEmail = "Email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (send = false) => {
  try {
    // Prepare items without any total calculations
    const items = proposalItems.map(item => ({
      description: item.description,
      quantity: Number(item.qty || item.quantity),
      rate: Number(item.rate),
      tax1: Number(item.tax1 || 0),
      tax2: Number(item.tax2 || 0)
    }));

    const proposalData = {
      title: formData.title,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      status: formData.status,
      items: items,
      date: formData.date ? new Date(formData.date) : new Date(),
      openTill: formData.openTill ? new Date(formData.openTill) : null,
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
      assigned: formData.assigned
    };

    console.log("Submitting:", proposalData);

    const response = await axios.post('http://localhost:5000/api/admin/proposals', proposalData);
    
    if (response.data.success) {
      alert("Proposal saved successfully!");
      navigate("../sales/proposals");
    } else {
      throw new Error(response.data.message || "Failed to save proposal");
    }
  } catch (error) {
    console.error("Submission error:", error.response?.data || error.message);
    
    let errorMessage = "Failed to save proposal";
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
      <h2 className="text-2xl font-bold text-gray-800 mb-2">New Proposal</h2>
      
      {/* Main Form Container */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        {/* Two-column form layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded text-sm ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Client Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name*</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              />
            </div>

            {/* Date fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open Till</label>
                <input
                  type="date"
                  name="openTill"
                  value={formData.openTill}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
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
          </div>

          {/* Right Column */}
          <div>
            {/* Status and Assigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned</label>
                <select
                  name="assigned"
                  value={formData.assigned}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                >
                  <option value="">Select Staff</option>
                  {staffMembers.map((staff, i) => (
                    <option key={i} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email*</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded text-sm ${
                  errors.clientEmail ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail}</p>}
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                rows="3"
              />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-sm border-gray-300"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded text-sm border-gray-300"
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
                <th className="p-3 font-medium">Unit</th>
                <th className="p-3 font-medium">Tax 1</th>
                <th className="p-3 font-medium">Tax 2</th>
                <th className="p-3 font-medium">Group</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {databaseItems.map((item) => (
                <tr key={item._id}>
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.rate}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">{item.tax1}</td>
                  <td className="p-3">{item.tax2}</td>
                  <td className="p-3">{item.groupName}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => addItemFromDatabase(item)}
                      className="text-blue-500 hover:text-blue-700"
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
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Proposal Items</h3>
          <button
            onClick={() => {
              setProposalItems([
                ...proposalItems,
                {
                  description: "",
                  qty: 1,
                  rate: 0,
                  amount: 0
                }
              ]);
            }}
            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center"
          >
            <FaPlus /> <span className="ml-1">Add Custom Item</span>
          </button>
        </div>

        {/* Proposal Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">Item Description</th>
                <th className="p-3 font-medium">Qty</th>
                <th className="p-3 font-medium">Rate</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {proposalItems.map((item, i) => (
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
                value={item.qty}
                onChange={(e) => {
                  const qty = Math.max(1, parseInt(e.target.value) || 1);
                  handleItemChange(i, "qty", qty);
                  handleItemChange(i, "amount", item.rate * qty);
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
                        handleItemChange(i, "amount", item.qty * rate);
                      }}
                      className="w-full border px-2 py-1 rounded"
                      min="0"
                      step="0.01"
                    />
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
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="border px-2 py-1 rounded text-xs"
              >
                <option value="percent">%</option>
                <option value="fixed">$</option>
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
                    discountValue: Math.max(0, parseFloat(e.target.value) || 0)
                  });
                }}
                className="w-20 border px-2 py-1 rounded text-sm text-right"
                min="0"
                step={formData.discountType === "percent" ? "1" : "0.01"}
              />
              <span className="ml-1">
                {formData.discountType === "percent" ? "%" : "$"}
              </span>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                  <textarea
                    name="longDescription"
                    value={newItem.longDescription}
                    onChange={handleNewItemChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate - USD (Base Currency)</label>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax 1</label>
                    <select
                      name="tax1"
                      value={newItem.tax1}
                      onChange={handleNewItemChange}
                      className="w-full border px-3 py-2 rounded text-sm"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
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
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={newItem.unit}
                    onChange={handleNewItemChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Group</label>
                  <input
                    type="text"
                    name="groupName"
                    value={newItem.groupName}
                    onChange={handleNewItemChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
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
          onClick={() => handleSubmit(true)}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Save
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

export default ProposalForm;