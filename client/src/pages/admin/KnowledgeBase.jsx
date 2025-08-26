import { useState, useEffect } from "react";
import {
  FaPlus, FaSearch, FaSyncAlt, FaChevronRight,
  FaTimes, FaEdit, FaTrash, FaChevronDown,
  FaFileAlt, FaFolder, FaFilter
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
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
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalArticles: 0,
    published: 0,
    draft: 0,
    archived: 0
  });
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    group: "",
    status: "Published"
  });
  const [editingArticle, setEditingArticle] = useState(null);
  const [filterGroup, setFilterGroup] = useState("All");

  const statusOptions = [
    "Published",
    "Draft",
    "Archived"
  ];

  // Generate dummy groups
  const groupOptions = [
    "General",
    "Technical",
    "Sales",
    "Support",
    "HR",
    "Finance"
  ];

  // Generate dummy data
  useEffect(() => {
    const dummyArticles = [];
    const statuses = ["Published", "Draft", "Archived"];
    
    for (let i = 1; i <= 50; i++) {
      const randomGroup = groupOptions[Math.floor(Math.random() * groupOptions.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
      dummyArticles.push({
        _id: `KB-${1000 + i}`,
        title: `Knowledge Base Article ${i}`,
        content: `This is the content of knowledge base article ${i}. It contains helpful information about various topics.`,
        group: randomGroup,
        status: randomStatus,
        datePublished: randomDate.toLocaleDateString('en-GB') + " | " + 
                      randomDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    setArticles(dummyArticles);
    
    // Calculate stats
    setStats({
      totalArticles: dummyArticles.length,
      published: dummyArticles.filter(a => a.status === "Published").length,
      draft: dummyArticles.filter(a => a.status === "Draft").length,
      archived: dummyArticles.filter(a => a.status === "Archived").length
    });
  }, []);

  // Search filter
  const filteredArticles = articles.filter(article => 
    article._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.status.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(article => 
    filterGroup === "All" || article.group === filterGroup
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
    
    // Simulate API call with timeout
    setTimeout(() => {
      if (editingArticle) {
        // Update existing article
        setArticles(prev => prev.map(a => 
          a._id === editingArticle._id 
            ? { ...newArticle, _id: editingArticle._id, datePublished: new Date().toLocaleDateString('en-GB') + " | " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
            : a
        ));
        setShowNewArticleForm(false);
        setEditingArticle(null);
        alert("Article updated successfully!");
      } else {
        // Create new article
        const newArticleWithId = {
          ...newArticle,
          _id: `KB-${1000 + articles.length + 1}`,
          datePublished: new Date().toLocaleDateString('en-GB') + " | " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setArticles(prev => [...prev, newArticleWithId]);
        setShowNewArticleForm(false);
        alert("Article created successfully!");
      }
      
      // Reset form
      setNewArticle({
        title: "",
        content: "",
        group: "",
        status: "Published"
      });
      
      setIsSaving(false);
    }, 500);
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setNewArticle({
      title: article.title,
      content: article.content,
      group: article.group,
      status: article.status
    });
    setShowNewArticleForm(true);
  };

  const handleDeleteArticle = async (id) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      // Simulate API call with timeout
      setTimeout(() => {
        setArticles(prev => prev.filter(a => a._id !== id));
        setSelectedArticles(prev => prev.filter(articleId => articleId !== id));
        alert("Article deleted successfully!");
      }, 500);
    }
  };

  // Export functions
  const exportToExcel = () => {
    const dataToExport = filteredArticles.map(article => ({
      ID: article._id,
      "Article Name": article.title,
      Group: article.group,
      "Date Published": article.datePublished,
      Status: article.status
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
      "Date Published": article.datePublished,
      Status: article.status
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
      "Date Published",
      "Status"
    ];
    
    const tableRows = filteredArticles.map(article => [
      article._id,
      article.title,
      article.group,
      article.datePublished,
      article.status
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
    ['ID', 'Article Name', 'Group', 'Date Published', 'Status'].forEach(header => {
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
        article.datePublished,
        article.status
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

  const getStatusColor = (status) => {
    switch(status) {
      case "Published": return "bg-green-100 text-green-800";
      case "Draft": return "bg-yellow-100 text-yellow-800";
      case "Archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
                  {groupOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newArticle.status}
                  onChange={handleNewArticleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Articles */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Articles</p>
                  <p className="text-2xl font-bold">{stats.totalArticles}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaFileAlt className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Published */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Published</p>
                  <p className="text-2xl font-bold">{stats.published}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaFileAlt className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Draft */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Draft</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaFileAlt className="text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Archived */}
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Archived</p>
                  <p className="text-2xl font-bold">{stats.archived}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <FaFileAlt className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2" style={{ backgroundColor: '#333333', color: 'white' }}
                onClick={() => setShowNewArticleForm(true)}
              >
                <FaPlus /> New Article
              </button>
              <button 
                className="px-3 py-1 text-sm rounded flex items-center gap-2 border"
                onClick={() => {}}
              >
                <FaFolder /> New Group
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
                        // Simulate API call with timeout
                        setTimeout(() => {
                          setArticles(prev => prev.filter(a => !selectedArticles.includes(a._id)));
                          setSelectedArticles([]);
                          alert("Selected articles deleted!");
                        }, 500);
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
                    <option value="All">All Groups</option>
                    {groupOptions.map(group => (
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
                    <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
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
                  onClick={() => window.location.reload()}
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
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Published</th>
                        <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date Published</th>
                        <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
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
                            <td className="p-3 border-0">{article.datePublished}</td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
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
                            <td className="p-3 border-0">{article.datePublished}</td>
                            <td className="p-3 border-0">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(article.status)}`}>
                                {article.status}
                              </span>
                            </td>
                            <td className="p-3 rounded-r-lg border-0">
                              <div className="flex space-x-2">
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
                      <td colSpan={compactView ? 5 : 6} className="p-4 text-center text-gray-500">
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
    </div>
  );
};

export default KnowledgeBasePage;