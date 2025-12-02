/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaFilter,
  FaSyncAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronRight,
  FaTimes,
  FaSearch,
  FaDownload,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Proposals = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [viewProposal, setViewProposal] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    title: "",
    total: 0,
    status: "Draft",
  });
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Status options
  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected"];

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Add a ref for the export menu
  const exportMenuRef = useRef(null);

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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch active document template
  const fetchTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/document-templates/active`,
        config
      );
      setTemplate(data.data);
    } catch (err) {
      console.error("Error fetching template:", err);
      // If no template exists, create a default one
      setTemplate({
        companyName: "Your Company",
        companyEmail: "info@company.com",
        companyPhone: "+1 (555) 123-4567",
        companyAddress: "123 Business Street, City, Country",
        logoUrl: "",
        watermarkEnabled: true,
        watermarkOpacity: 0.1,
        primaryColor: "#333333",
        fontFamily: "Arial",
        footerText: "Thank you for your business!",
      });
    }
    setLoadingTemplate(false);
  };

  // Fetch proposals for the logged-in admin only
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/proposals`,
        config
      );

      // Ensure we're getting the data in the correct format
      if (data.data) {
        setProposals(data.data); // If response has data property
      } else if (Array.isArray(data)) {
        setProposals(data); // If response is directly an array
      } else {
        console.error("Unexpected API response format:", data);
        setProposals([]);
      }
    } catch (err) {
      console.error("Error fetching proposals", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setProposals([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProposals();
    fetchTemplate();
  }, []);

  // Toggle proposal selection
  const toggleProposalSelection = (id) => {
    if (selectedProposals.includes(id)) {
      setSelectedProposals(
        selectedProposals.filter((proposalId) => proposalId !== id)
      );
    } else {
      setSelectedProposals([...selectedProposals, id]);
    }
  };

  // Generate and download proposal PDF
  const downloadProposalPDF = async (proposal) => {
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Add watermark FIRST (as background)
      if (template?.watermarkEnabled && template?.logoUrl) {
        try {
          // Get logo URL - handle both base64 and server URLs
          let logoData = template.logoUrl;

          // If it's a relative URL, construct full URL
          if (template.logoUrl.startsWith("/uploads/")) {
            logoData = `${API_BASE_URL}${template.logoUrl}`;
          }

          // Add watermark with reduced opacity
          doc.addImage(
            logoData,
            "PNG", // specify format
            pageWidth / 2 - 40,
            pageHeight / 2 - 40,
            80,
            80,
            "", // alias
            "FAST", // compression
            0 // rotation
          );

          // Set global transparency for watermark ONLY
          doc.setGState(
            doc.GState({ opacity: template.watermarkOpacity || 0.1 })
          );
        } catch (error) {
          console.log("Could not load watermark image:", error);
          // Reset opacity if watermark fails
          doc.setGState(doc.GState({ opacity: 1 }));
        }
      }

      // Reset opacity for main content
      doc.setGState(doc.GState({ opacity: 1 }));

      // Header Section
      // Left: Company Logo (not watermark)
      if (template?.logoUrl) {
        try {
          // Directly use Cloudinary URL
          doc.addImage(
            template.logoUrl,
            "PNG",
            margin,
            margin,
            40,
            20,
            "",
            "FAST"
          );
        } catch (error) {
          console.log("Could not load logo image:", error);
          // Fallback: Add text logo
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(
            template?.companyName?.substring(0, 15) || "Company",
            margin,
            margin + 10
          );
        }
      }

      // Add watermark (as background) if enabled
      if (template?.watermarkEnabled && template?.logoUrl) {
        try {
          // Directly use Cloudinary URL for watermark
          doc.addImage(
            template.logoUrl,
            "PNG", // specify format
            pageWidth / 2 - 40,
            pageHeight / 2 - 40,
            80,
            80,
            "", // alias
            "FAST", // compression
            0 // rotation
          );

          // Set global transparency for watermark ONLY
          doc.setGState(
            doc.GState({ opacity: template.watermarkOpacity || 0.1 })
          );
        } catch (error) {
          console.log("Could not load watermark image:", error);
          // Reset opacity if watermark fails
          doc.setGState(doc.GState({ opacity: 1 }));
        }
      }

      // Center: Document Type
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("PROPOSAL", pageWidth / 2, margin + 15, { align: "center" });

      // Right: Company Info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let rightX = pageWidth - margin;

      const companyInfo = [
        template?.companyName || "Your Company",
        template?.companyAddress || "Address not set",
        `Email: ${template?.companyEmail || "email@company.com"}`,
        `Phone: ${template?.companyPhone || "Not provided"}`,
      ];

      companyInfo.forEach((line, index) => {
        doc.text(line, rightX, margin + 10 + index * 5, { align: "right" });
      });

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 35, pageWidth - margin, margin + 35);

      let yPosition = margin + 50;

      // Proposal Details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Proposal: ${proposal.title || "Untitled Proposal"}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Proposal Number and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const formatProposalNumber = (num) => {
        if (!num) return "TEMP-" + proposal._id.slice(-6).toUpperCase();
        if (num.startsWith("PRO-")) return num;
        const matches = num.match(/\d+/);
        const numberPart = matches ? matches[0] : "000001";
        return `PRO-${String(numberPart).padStart(6, "0")}`;
      };

      doc.text(
        `Proposal #: ${formatProposalNumber(proposal.proposalNumber)}`,
        margin,
        yPosition
      );
      doc.text(
        `Date: ${new Date(proposal.date || Date.now()).toLocaleDateString()}`,
        pageWidth / 2,
        yPosition
      );
      yPosition += 8;

      doc.text(`Status: ${proposal.status || "Draft"}`, margin, yPosition);
      doc.text(
        `Valid Until: ${
          proposal.openTill
            ? new Date(proposal.openTill).toLocaleDateString()
            : "N/A"
        }`,
        pageWidth / 2,
        yPosition
      );
      yPosition += 15;

      // Client Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Client Information:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Client: ${proposal.clientName || "Not specified"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      if (proposal.clientEmail) {
        doc.text(`Email: ${proposal.clientEmail}`, margin, yPosition);
        yPosition += 5;
      }

      if (proposal.phone) {
        doc.text(`Phone: ${proposal.phone}`, margin, yPosition);
        yPosition += 5;
      }

      // Address if available
      if (
        proposal.address ||
        proposal.city ||
        proposal.state ||
        proposal.country
      ) {
        const addressParts = [];
        if (proposal.address) addressParts.push(proposal.address);
        if (proposal.city) addressParts.push(proposal.city);
        if (proposal.state) addressParts.push(proposal.state);
        if (proposal.country) addressParts.push(proposal.country);
        if (proposal.zip) addressParts.push(`ZIP: ${proposal.zip}`);

        if (addressParts.length > 0) {
          doc.text(`Address: ${addressParts.join(", ")}`, margin, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 10;

      // Items Table
      if (proposal.items && proposal.items.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Items / Services:", margin, yPosition);
        yPosition += 10;

        // Prepare table data
        const tableColumns = [
          { header: "#", dataKey: "index" },
          { header: "Description", dataKey: "description" },
          { header: "Qty", dataKey: "quantity" },
          { header: "Rate", dataKey: "rate" },
          { header: "Amount", dataKey: "amount" },
        ];

        const tableRows = proposal.items.map((item, index) => ({
          index: index + 1,
          description: item.description || "Item",
          quantity: item.quantity || 1,
          rate: `${proposal.currency || "USD"} ${(item.rate || 0).toFixed(2)}`,
          amount: `${proposal.currency || "USD"} ${(
            (item.quantity || 1) * (item.rate || 0)
          ).toFixed(2)}`,
        }));

        autoTable(doc, {
          startY: yPosition,
          head: [tableColumns.map((col) => col.header)],
          body: tableRows.map((row) =>
            tableColumns.map((col) => row[col.dataKey])
          ),
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: template?.primaryColor || [51, 51, 51] },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Calculations
      const subtotal =
        proposal.items?.reduce(
          (sum, item) => sum + (item.quantity || 1) * (item.rate || 0),
          0
        ) || 0;
      const discount = proposal.discount || 0;
      const total = proposal.total || subtotal - discount;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Right align calculations
      const calcX = pageWidth - margin - 60;

      doc.text("Subtotal:", calcX, yPosition);
      doc.text(
        `${proposal.currency || "USD"} ${subtotal.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (discount > 0) {
        doc.text("Discount:", calcX, yPosition);
        doc.text(
          `- ${proposal.currency || "USD"} ${discount.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total:", calcX, yPosition);
      doc.text(
        `${proposal.currency || "USD"} ${total.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 15;

      // Terms and Notes
      if (proposal.tags) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Tags: ${proposal.tags}`, margin, yPosition);
        yPosition += 8;
      }

      // Assigned staff
      if (proposal.assigned) {
        doc.text(`Assigned To: ${proposal.assigned}`, margin, yPosition);
        yPosition += 8;
      }

      // Footer
      const footerY = pageHeight - margin;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      // Footer text from template
      doc.text(
        template?.footerText || "Thank you for your business!",
        pageWidth / 2,
        footerY - 10,
        { align: "center" }
      );

      // Page number
      doc.text(`Page 1 of 1`, pageWidth / 2, footerY, { align: "center" });

      // Company contact in footer
      const footerContact = [
        template?.companyName || "Your Company",
        template?.companyEmail ? `Email: ${template.companyEmail}` : "",
        template?.companyPhone ? `Phone: ${template.companyPhone}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      doc.text(footerContact, pageWidth / 2, footerY - 20, { align: "center" });

      // Save the PDF
      const fileName = `Proposal_${formatProposalNumber(
        proposal.proposalNumber
      )}_${proposal.clientName?.replace(/[^a-z0-9]/gi, "_") || "Untitled"}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!proposals.length) return;

    const exportData = proposals.map((p) => ({
      ProposalNumber:
        p.proposalNumber || "TEMP-" + p._id.slice(-6).toUpperCase(),
      Client: p.clientName,
      Title: p.title,
      Amount: p.total,
      Status: p.status,
      Date: p.date ? new Date(p.date).toLocaleDateString() : "-",
      OpenTill: p.openTill ? new Date(p.openTill).toLocaleDateString() : "-",
      Tags: p.tags || "-",
    }));

    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) =>
            Object.values(row)
              .map((val) => `"${val}"`)
              .join(",")
          )
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "proposals.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Proposals");
        XLSXWriteFile(workbook, "proposals.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("proposals.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Proposals</title></head><body>"
        );
        printWindow.document.write(
          "<table border='1' style='border-collapse: collapse; width: 100%;'>"
        );
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

  // Delete proposal
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this proposal?"))
      return;
    try {
      const config = createAxiosConfig();
      await axios.delete(`${API_BASE_URL}/admin/proposals/${id}`, config);
      setProposals(proposals.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting proposal", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Update proposal
  const handleUpdate = async () => {
    try {
      const config = createAxiosConfig();
      await axios.put(
        `${API_BASE_URL}/admin/proposals/${editProposal._id}`,
        formData,
        config
      );
      setEditProposal(null);
      fetchProposals();
    } catch (err) {
      console.error("Error updating proposal", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Delete selected proposals
  const handleDeleteSelected = async () => {
    if (
      !window.confirm(`Delete ${selectedProposals.length} selected proposals?`)
    )
      return;

    try {
      const config = createAxiosConfig();
      await Promise.all(
        selectedProposals.map((id) =>
          axios.delete(`${API_BASE_URL}/admin/proposals/${id}`, config)
        )
      );
      setSelectedProposals([]);
      fetchProposals();
      alert("Selected proposals deleted!");
    } catch (err) {
      console.error("Error deleting selected proposals:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting selected proposals.");
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(
    (proposal) =>
      proposal.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastProposal = currentPage * entriesPerPage;
  const indexOfFirstProposal = indexOfLastProposal - entriesPerPage;
  const currentProposals = filteredProposals.slice(
    indexOfFirstProposal,
    indexOfLastProposal
  );
  const totalPages = Math.ceil(filteredProposals.length / entriesPerPage);

  if (loading)
    return (
      <div className="bg-gray-100 min-h-screen p-4">Loading proposals...</div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Proposals</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Proposals */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Proposals</p>
              <p className="text-2xl font-bold">{proposals.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft Proposals */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">
                {proposals.filter((p) => p.status === "Draft").length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaEdit className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Sent Proposals */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sent</p>
              <p className="text-2xl font-bold">
                {proposals.filter((p) => p.status === "Sent").length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Accepted Proposals */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Accepted</p>
              <p className="text-2xl font-bold">
                {proposals.filter((p) => p.status === "Accepted").length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaEye className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm rounded flex items-center gap-2"
            style={{ backgroundColor: "#333333", color: "white" }}
            onClick={() => navigate("../proposals/new")}
          >
            <FaPlus /> New Proposal
          </button>

          {/* Delete Selected button */}
          {selectedProposals.length > 0 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedProposals.length})
            </button>
          )}
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
      <div
        className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
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
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10"
                >
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
              onClick={fetchProposals}
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
                <th
                  className="p-3 rounded-l-lg"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedProposals.length === currentProposals.length &&
                      currentProposals.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProposals(
                          currentProposals.map((p) => p._id)
                        );
                      } else {
                        setSelectedProposals([]);
                      }
                    }}
                  />
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Proposal#
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Client
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Title
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Open Till
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Tags
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentProposals.length > 0 ? (
                currentProposals.map((proposal) => {
                  const formatProposalNumber = (num) => {
                    if (!num)
                      return "TEMP-" + proposal._id.slice(-6).toUpperCase();
                    if (num.startsWith("PRO-")) return num;
                    const matches = num.match(/\d+/);
                    const numberPart = matches ? matches[0] : "000001";
                    return `PRO-${String(numberPart).padStart(6, "0")}`;
                  };

                  const displayProposalNumber = formatProposalNumber(
                    proposal.proposalNumber
                  );

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: proposal.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(proposal.total || 0);

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime())
                      ? "-"
                      : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={proposal._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProposals.includes(proposal._id)}
                            onChange={() =>
                              toggleProposalSelection(proposal._id)
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0">{displayProposalNumber}</td>
                      <td className="p-3 border-0">
                        {proposal.clientName || "-"}
                      </td>
                      <td className="p-3 border-0">{proposal.title || "-"}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0 text-right">
                            {displayAmount}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                proposal.status
                              )}`}
                            >
                              {proposal.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewProposal(proposal)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => downloadProposalPDF(proposal)}
                                className="text-green-500 hover:text-green-700"
                                title="Download"
                              >
                                <FaDownload size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditProposal(proposal);
                                  setFormData({
                                    clientName: proposal.clientName || "",
                                    title: proposal.title || "",
                                    total: proposal.total || 0,
                                    status: proposal.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(proposal._id)}
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
                          <td className="p-3 border-0">{displayAmount}</td>
                          <td className="p-3 border-0">
                            {formatDate(proposal.date)}
                          </td>
                          <td className="p-3 border-0">
                            {formatDate(proposal.openTill)}
                          </td>
                          <td className="p-3 border-0">
                            {proposal.tags || "-"}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                proposal.status
                              )}`}
                            >
                              {proposal.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewProposal(proposal)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => downloadProposalPDF(proposal)}
                                className="text-green-500 hover:text-green-700"
                                title="Download"
                              >
                                <FaDownload size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditProposal(proposal);
                                  setFormData({
                                    clientName: proposal.clientName || "",
                                    title: proposal.title || "",
                                    total: proposal.total || 0,
                                    status: proposal.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(proposal._id)}
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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={compactView ? 7 : 10}
                    className="p-4 text-center text-gray-500"
                  >
                    {proposals.length === 0
                      ? "No proposals found. Create your first proposal!"
                      : "No proposals match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProposals.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstProposal + 1} to{" "}
              {Math.min(indexOfLastProposal, filteredProposals.length)} of{" "}
              {filteredProposals.length} entries
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
        )}
      </div>

      {/* View & Edit Modals */}
      {viewProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Proposal Details</h2>
              <button
                onClick={() => setViewProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <b>Proposal #:</b>{" "}
                {viewProposal.proposalNumber ||
                  "TEMP-" + viewProposal._id.slice(-6).toUpperCase()}
              </p>
              <p>
                <b>Client:</b> {viewProposal.clientName}
              </p>
              <p>
                <b>Title:</b> {viewProposal.title}
              </p>
              <p>
                <b>Amount:</b> ${viewProposal.total || 0}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    viewProposal.status
                  )}`}
                >
                  {viewProposal.status || "Draft"}
                </span>
              </p>
              {viewProposal.date && (
                <p>
                  <b>Date:</b>{" "}
                  {new Date(viewProposal.date).toLocaleDateString()}
                </p>
              )}
              {viewProposal.openTill && (
                <p>
                  <b>Open Till:</b>{" "}
                  {new Date(viewProposal.openTill).toLocaleDateString()}
                </p>
              )}
              {viewProposal.tags && (
                <p>
                  <b>Tags:</b> {viewProposal.tags}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => downloadProposalPDF(viewProposal)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaDownload className="inline mr-2" /> Download PDF
              </button>
              <button
                onClick={() => setViewProposal(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Proposal</h2>
              <button
                onClick={() => setEditProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) =>
                    setFormData({ ...formData, total: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditProposal(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-black text-white rounded text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
