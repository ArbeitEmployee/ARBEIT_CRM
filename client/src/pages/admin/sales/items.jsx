import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaSyncAlt, FaUpload, FaTasks, FaTimes } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";

const Items = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    description: "",
    longDescription: "",
    rate: "",
    tax1: "",
    tax2: "",
    unit: "",
    groupName: ""
  });

  const taxOptions = ["", "0%", "5%", "10%", "15%", "20%"];

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/admin/items");
        setItems(data);
      } catch (err) {
        console.error("Error fetching items", err);
      }
    };
    fetchItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedItem = {
        ...formData,
        rate: formData.rate.startsWith('$') ? formData.rate : `$${formData.rate}`
      };
      const { data } = await axios.post("http://localhost:5000/api/admin/items", formattedItem);
      setItems([data, ...items]);
      setFormData({
        description: "",
        longDescription: "",
        rate: "",
        tax1: "",
        tax2: "",
        unit: "",
        groupName: ""
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving item", err);
    }
  };

  // Filter by search
  const filteredItems = items.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredItems.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Top action buttons */}
      <div className="flex items-center justify-between mt-8 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            className="bg-black text-white px-3 py-1 text-sm rounded flex items-center gap-2"
            onClick={() => setShowForm(true)}
          >
            <FaPlus /> New Item
          </button>
          <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded flex items-center gap-2">
            <FaUpload /> Import Items
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">Add Item</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    required
                  />
                </div>
                {/* Long Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                  <textarea
                    name="longDescription"
                    value={formData.longDescription}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                    rows="3"
                  />
                </div>
                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate - USD (Base Currency)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2">$</span>
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded text-sm pl-6"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                {/* Tax */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax 1</label>
                    <select
                      name="tax1"
                      value={formData.tax1}
                      onChange={handleChange}
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
                      value={formData.tax2}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded text-sm"
                    >
                      {taxOptions.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                </div>
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Group</label>
                  <input
                    type="text"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Close</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table & Controls */}
      <div className="bg-white shadow-md rounded p-4 mt-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="border px-2 py-1 rounded text-sm flex items-center gap-1">
                <HiOutlineDownload /> Export
              </button>
              {showExportMenu && (
                <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
                  {["Excel", "CSV", "PDF", "Print"].map((item) => (
                    <button key={item} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setShowExportMenu(false)}>{item}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="border px-3 py-1 rounded text-sm flex items-center gap-2"><FaTasks /> Bulk Action</button>
            <button className="border px-2 py-1 rounded text-sm flex items-center" onClick={() => window.location.reload()}><FaSyncAlt /></button>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="border rounded pl-8 pr-3 py-1 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Long Description</th>
                <th className="p-2 border">Rate</th>
                <th className="p-2 border">Tax1</th>
                <th className="p-2 border">Tax2</th>
                <th className="p-2 border">Unit</th>
                <th className="p-2 border">Group Name</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.description}</td>
                  <td className="p-2 border">{item.longDescription}</td>
                  <td className="p-2 border">{item.rate}</td>
                  <td className="p-2 border">{item.tax1}</td>
                  <td className="p-2 border">{item.tax2}</td>
                  <td className="p-2 border">{item.unit}</td>
                  <td className="p-2 border">{item.groupName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredItems.length)} of {filteredItems.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-gray-200" : ""}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Items;
