import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaFileAlt, FaFilter, FaEye // Import FaEye icon
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const KnowledgeBasePage = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [articles, setArticles] = useState([]);
  // Removed useState for groups as it's static and setGroups was unused
  const groups = [
    "All",
    "General",
    "Technical",
    "Sales",
    "Support",
    "HR",
    "Finance"
  ];
  const [isSaving, setIsSaving] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    group: "",
    dateCreated: ""
  });
  const [editingArticle, setEditingArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null); // New state for viewing article
  const [filterGroup, setFilterGroup] = useState("All");

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

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Format date from DD-MM-YYYY to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

    const [loading, setLoading] = useState(true);

  // Fetch articles from API
  // Moved inside useEffect or wrapped in useCallback for better dependency management
  // For simplicity, we'll make useEffect depend on filterGroup and searchTerm
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/knowledge-base", {
        params: {
          group: filterGroup !== "All" ? filterGroup : null,
          search: searchTerm
        }
      });
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, [filterGroup, searchTerm]); // Added searchTerm to dependency array

  // Search filter
  const filteredArticles = articles.filter(article => 
    article._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredArticles.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const toggleArticleSelection = (id) => {
    setSelectedArticles(prev =>
      prev.includes(id)
        ? prev.filter(articleId => articleId !== id)
        : [...prev, id]
    );
  };

  const handleNewArticleChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveArticle = async () => {
    if (isSaving) return;
    
    if (!newArticle.title || !newArticle.content || !newArticle.group) {
      alert("Please fill in all required fields (Title, Content, Group)");
      return;
    }

    setIsSaving(true);
    
    // Format dates for backend
    const articleData = {
      ...newArticle,
      dateCreated: newArticle.dateCreated ? formatDateForBackend(newArticle.dateCreated) : "" // Ensure date is formatted or empty
    };
    
    try {
      if (editingArticle) {
        // Update existing article
        await axios.put(`http://localhost:5000/api/knowledge-base/${editingArticle._id}`, articleData);
        setShowNewArticleForm(false);
        setEditingArticle(null);
        fetchArticles();
        alert("Article updated successfully!");
      } else {
        // Create new article
        await axios.post("http://localhost:5000/api/knowledge-base", articleData);
        setShowNewArticleForm(false);
        fetchArticles();
        alert("Article created successfully!");
      }
      
      // Reset form
      setNewArticle({
        title: "",
        content: "",
        group: "",
        dateCreated: ""
      });
    } catch (error) {
      console.error("Error saving article:", error);
      alert(`Error saving article: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setNewArticle({
      title: article.title,
      content: article.content,
      group: article.group,
      dateCreated: formatDateForInput(article.dateCreated) // Format for input field
    });
    setShowNewArticleForm(true);
  };

  const handleDeleteArticle = async (id) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await axios.delete(`http://localhost:5000/api/knowledge-base/${id}`);
        fetchArticles();
        alert("Article deleted successfully!");
      } catch (error) {
        console.error("Error deleting article:", error);
        alert(`Error deleting article: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredArticles.map(article => ({
      ID: article._id,
      "Article Name": article.title,
      Group: article.group,
      "Date Created": article.dateCreated
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Knowledge Base");
    XLSX.writeFile(workbook, "Knowledge_Base.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const dataToExport = filteredArticles.map(article => ({
      ID: article._id,
      "Article Name": article.title,
      Group: article.group,
      "Date Created": article.dateCreated
    }));

    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataToExport));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Knowledge_Base.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "ID",
      "Article Name",
      "Group",
      "Date Created"
    ];
    
    const tableRows = filteredArticles.map(article => [
      article._id,
      article.title,
      article.group,
      article.dateCreated
    ]);

    autoTable(doc,{
      head: [tableColumn],
      body: tableRows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("Knowledge_Base.pdf");
    setShowExportMenu(false);
  };

  const printTable = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Knowledge Base</title>');
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
    printWindow.document.write('<h1>Knowledge Base</h1>');
    printWindow.document.write('<table>');
    
    // Table header
    printWindow.document.write('<thead><tr>');
    ['ID', 'Article Name', 'Group', 'Date Created'].forEach(header => {
      printWindow.document.write(`<th>${header}</th>`);
    });
    printWindow.document.write('</tr></thead>');
    
    // Table body
    printWindow.document.write('<tbody>');
    filteredArticles.forEach(article => {
      printWindow.document.write('<tr>');
      [
        article._id,
        article.title,
        article.group,
        article.dateCreated
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateString;
  };

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading KnowledgeBase...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showNewArticleForm ? (editingArticle ? "Edit Article" : "Add New Article") : "Knowledge Base"}</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Knowledge Base</span>
        </div>
      </div>

      {showNewArticleForm ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Article Details</h2>
            <button 
              onClick={() => {
                setShowNewArticleForm(false);
                setEditingArticle(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={newArticle.title}
                onChange={handleNewArticleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                name="content"
                value={newArticle.content}
                onChange={handleNewArticleChange}
                className="w-full border rounded px-3 py-2 h-32"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select
                  name="group"
                  value={newArticle.group}
                  onChange={handleNewArticleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Group</option>
                  {groups.filter(g => g !== "All").map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                <input
                  type="date"
                  name="dateCreated"
                  value={newArticle.dateCreated}
                  onChange={handleNewArticleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewArticleForm(false);
                setEditingArticle(null);
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveArticle}
              className="px-4 py-2 bg-black text-white rounded text-sm"
              disabled={!newArticle.title || !newArticle.content || !newArticle.group || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewArticleForm(true)}
              >
                <FaPlus /> New Article
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="border px-3 py-1 text-sm rounded flex items-center gap-2"
                onClick={() => setCompactView(!compactView)}
              >
                {compactView ? "<<" : ">>"}
              </button>
            </div>
          </div>

          {/* White box for table */}
          <div className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${compactView ? "w-1/2" : "w-full"}`}>
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Delete Selected button */}
                {selectedArticles.length > 0 && (
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      if (window.confirm(`Delete ${selectedArticles.length} selected articles?`)) {
                        try {
                          await axios.post("http://localhost:5000/api/knowledge-base/bulk-delete", {
                            articleIds: selectedArticles
                          });
                          setSelectedArticles([]);
                          fetchArticles();
                          alert("Selected articles deleted!");
                        } catch {
                          alert("Error deleting selected articles.");
                        }
                      }
                    }}
                  >
                    Delete Selected ({selectedArticles.length})
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                
                {/* Group filter */}
                <div className="flex items-center gap-1 border rounded px-2 py-1 text-sm">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="border-none focus:ring-0 p-0"
                  >
                    {groups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                
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
                  onClick={fetchArticles}
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
                        checked={selectedArticles.length === currentData.length && currentData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArticles(currentData.map((article) => article._id));
                          } else {
                            setSelectedArticles([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Article Name</th>
                    <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Group</th>
                    {compactView ? (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Created</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Created</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((article) => (
                      <tr
                        key={article._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                        style={{ color: 'black' }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(article._id)}
                              onChange={() => toggleArticleSelection(article._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0 font-medium">{article.title}</td>
                        <td className="p-3 border-0">{article.group}</td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">{formatDate(article.dateCreated)}</td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                {/* View Button */}
                                <button
                                  onClick={() => setViewingArticle(article)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="View"
                                >
                                  <FaEye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditArticle(article)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(article._id)}
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
                            <td className="p-3 border-0">{formatDate(article.dateCreated)}</td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
                                {/* View Button */}
                                <button
                                  onClick={() => setViewingArticle(article)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="View"
                                >
                                  <FaEye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditArticle(article)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(article._id)}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={compactView ? 5 : 5} className="p-4 text-center text-gray-500">
                        {articles.length === 0 ? "No articles found. Create your first article!" : "No articles match your search criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredArticles.length)} of{" "}
                {filteredArticles.length} entries
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Article Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{viewingArticle.title}</h2>
              <button 
                onClick={() => setViewingArticle(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p><b>Group:</b> {viewingArticle.group}</p>
              <p><b>Date Created:</b> {formatDate(viewingArticle.dateCreated)}</p>
              <p><b>Content:</b></p>
              <div className="border p-3 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                {viewingArticle.content}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewingArticle(null)} 
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
