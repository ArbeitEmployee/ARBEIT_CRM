import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaSyncAlt, FaUpload, FaTasks, FaTimes, FaTrash, FaChevronRight } from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

const Items = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [items, setItems] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
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
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch items from backend for the logged-in admin only
  useEffect(() => {
    fetchItems();
  }, []);

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchItems = async () => {
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get("http://localhost:5000/api/admin/items", config);
      setItems(data);
    } catch (err) {
      console.error("Error fetching items", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!items.length) return;

    const exportData = items.map((item) => ({
      Description: item.description || "-",
      "Long Description": item.longDescription || "-",
      Rate: item.rate || "-",
      Tax1: item.tax1 || "-",
      Tax2: item.tax2 || "-",
      Unit: item.unit || "-",
      "Group Name": item.groupName || "-",
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) => Object.values(row).map((val) => `"${val}"`).join(","))
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "items.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Items");
        XLSXWriteFile(workbook, "items.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) => columns.map((col) => row[col]));
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("items.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write("<html><head><title>Items</title></head><body>");
        printWindow.document.write("<table border='1' style='border-collapse: collapse; width: 100%;'>");
        printWindow.document.write("<thead><tr>");
        Object.keys(exportData[0]).forEach((col) => {
          printWindow.document.write(`<th>${col}</th>`);
        });
        printWindow.document.write("</tr></thead><tbody>");
        exportData.forEach((row) => {
          printWindow.document.write("<tr>");
          Object.values(row).forEach((val) => {
            printWindow.document.write(`<td>${val}</td>`);
          });
          printWindow.document.write("</tr>");
        });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
        break;
      }

      default:
        console.log("Unknown export type:", type);
    }

    setShowExportMenu(false);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) return;

    try {
      const config = createAxiosConfig();
      await axios.post("http://localhost:5000/api/admin/items/bulk-delete", { ids: selectedItems }, config);
      setItems(items.filter(item => !selectedItems.includes(item._id)));
      setSelectedItems([]);
      setSelectAll(false);
      alert("Items deleted successfully!");
    } catch (err) {
      console.error("Error deleting items", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting items");
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item._id));
    }
    setSelectAll(!selectAll);
  };

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
      const config = createAxiosConfig();
      const formattedItem = {
        ...formData,
        rate: formData.rate.startsWith('$') ? formData.rate : `$${formData.rate}`
      };
      const { data } = await axios.post("http://localhost:5000/api/admin/items", formattedItem, config);
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
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      
      // Parse the CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setCsvData(results.data);
        },
        error: function(error) {
          console.error("Error parsing CSV:", error);
          alert("Error parsing CSV file. Please check the format.");
        }
      });
    } else {
      alert("Please select a file");
    }
  };

  // Simulate CSV data (preview)
  const handleSimulateData = () => {
    if (csvData.length === 0) {
      alert("Please upload a CSV file first");
      return;
    }
    
    // Display the preview in an alert
    alert(JSON.stringify(csvData.slice(0, 5), null, 2)); // Show first 5 rows
  };

  // Import CSV data to database
  const handleImport = async () => {
    if (csvData.length === 0) {
      alert("No data to import");
      return;
    }

    try {
      const config = createAxiosConfig();
      
      // Format the data before sending - handle different CSV formats
      const formattedData = csvData.map(item => {
        // Handle different column name variations
        const description = item.description || item.Description || "";
        const longDescription = item.longDescription || item["Long Description"] || item.long_desc || "";
        const rate = item.rate || item.Rate || "";
        const tax1 = item.tax1 || item.Tax1 || "";
        const tax2 = item.tax2 || item.Tax2 || "";
        const unit = item.unit || item.Unit || "";
        const groupName = item.groupName || item["Group Name"] || item.group_name || "";

        return {
          description,
          longDescription,
          rate: rate ? (rate.startsWith('$') ? rate : `$${rate}`) : "$0",
          tax1,
          tax2,
          unit,
          groupName
        };
      });

      const { data } = await axios.post("http://localhost:5000/api/admin/items/import", formattedData, config);
      setItems([...data, ...items]);
      setShowImportForm(false);
      setCsvFile(null);
      setCsvData([]);
      alert("Items imported successfully!");
    } catch (err) {
      console.error("Error importing items", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error importing items. Please try again.");
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Items</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Items</span>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 text-sm rounded flex items-center gap-2" 
            style={{ backgroundColor: '#333333', color: 'white' }}
            onClick={() => setShowForm(true)}
          >
            <FaPlus /> New Item
          </button>
          <button 
            className="px-3 py-1 text-sm rounded flex items-center gap-2" 
            style={{ backgroundColor: '#333333', color: 'white' }}
            onClick={() => setShowImportForm(true)}
          >
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
                <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Items Form */}
      {showImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">Import Items from CSV</h2>
              <button
                onClick={() => {
                  setShowImportForm(false);
                  setCsvFile(null);
                  setCsvData([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full border px-3 py-2 rounded text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV should contain item data with columns like description, rate, tax1, tax2, unit, groupName
                </p>
              </div>

              {csvData.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Preview (First 5 rows)</h3>
                  <div className="border rounded p-2 max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(csvData[0]).map((key, i) => (
                            <th key={i} className="p-1 border text-left">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((value, j) => (
                              <td key={j} className="p-1 border">{value}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleSimulateData}
                  className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  disabled={csvData.length === 0}
                >
                  Simulate Data
                </button>
                
                <div className="space-x-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowImportForm(false);
                      setCsvFile(null);
                      setCsvData([]);
                    }} 
                    className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleImport} 
                    className="px-4 py-2 bg-black text-white rounded text-sm"
                    disabled={csvData.length === 0}
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* White box for table */}
      <div className="bg-white shadow-md rounded p-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Bulk delete button */}
            {selectedItems.length > 0 && (
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedItems.length})
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
                <div ref={exportMenuRef} className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Excel")}
                  >
                    Excel
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("CSV")}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("PDF")}
                  >
                    PDF
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    onClick={() => handleExport("Print")}
                  >
                    Print
                  </button>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={fetchItems}
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
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Description</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Long Description</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Rate</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tax1</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Tax2</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Unit</th>
                <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Group Name</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr
                  key={item._id}
                  className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                  style={{ color: 'black' }}
                >
                  <td className="p-3 rounded-l-lg border-0">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleCheckboxChange(item._id)}
                        className="h-4 w-4"
                      />
                    </div>
                  </td>
                  <td className="p-3 border-0">{item.description}</td>
                  <td className="p-3 border-0">{item.longDescription}</td>
                  <td className="p-3 border-0">{item.rate}</td>
                  <td className="p-3 border-0">{item.tax1}</td>
                  <td className="p-3 border-0">{item.tax2}</td>
                  <td className="p-3 border-0">{item.unit}</td>
                  <td className="p-3 rounded-r-lg border-0">{item.groupName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <span>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + entriesPerPage, filteredItems.length)} of{" "}
            {filteredItems.length} entries
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

export default Items;