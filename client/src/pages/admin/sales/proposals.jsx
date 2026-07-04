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
import { formatBDT } from "../../../utils/currency";

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

  // Helper function to format proposal number
  const formatProposalNumber = (num, proposalId = "") => {
    if (!num) {
      return `AR-PRO-TEMP-${proposalId.slice(-6).toUpperCase()}`;
    }

    if (num.startsWith("AR-PRO-")) return num;
    if (num.startsWith("PRO-")) return "AR-" + num;

    // Extract digits from the number
    const matches = num.match(/\d+/);
    const numberPart = matches ? matches[0] : "000001";
    return `AR-PRO-${String(numberPart).padStart(6, "0")}`;
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700";
      case "Sent":
        return "bg-yellow-100 text-yellow-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-700";
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

      // Reset all graphic states first
      doc.setGState(doc.GState({ opacity: 1 }));

      // Add watermark FIRST with proper opacity
      if (template?.watermarkEnabled && template?.logoUrl) {
        try {
          // Get logo URL
          let logoData = template.logoUrl;

          // If it's a relative URL, construct full URL
          if (template.logoUrl.startsWith("/uploads/")) {
            logoData = `${API_BASE_URL}${template.logoUrl}`;
          }

          // Save current graphic state
          doc.saveGraphicsState();

          // Set opacity for watermark only
          doc.setGState(
            doc.GState({ opacity: template.watermarkOpacity || 0.1 })
          );

          // Add watermark image
          doc.addImage(
            logoData,
            "PNG",
            pageWidth / 2 - 40, // Center horizontally
            pageHeight / 2 - 40, // Center vertically
            80, // Width
            50, // Height
            "", // alias
            "FAST"
          );

          // Restore graphic state to normal opacity
          doc.restoreGraphicsState();
        } catch (error) {
          console.log("Could not load watermark image:", error);
        }
      }

      // Reset to normal opacity for main content
      doc.setGState(doc.GState({ opacity: 1 }));

      // Now add the main content (text)
      let yPosition = margin;

      // Header Section - Company Logo (not watermark)
      if (template?.logoUrl) {
        try {
          // Get logo URL
          let logoData = template.logoUrl;

          // If it's a relative URL, construct full URL
          if (template.logoUrl.startsWith("/uploads/")) {
            logoData = `${API_BASE_URL}${template.logoUrl}`;
          }

          // Add logo with normal opacity
          doc.addImage(logoData, "PNG", margin, yPosition, 40, 20, "", "FAST");
        } catch (error) {
          console.log("Could not load logo image:", error);
          // Fallback: Add text logo
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text(
            template?.companyName?.substring(0, 15) || "Company",
            margin,
            yPosition + 10
          );
        }
      }

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

      // QUOTATION text - AFTER the line
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("QUOTATION", pageWidth / 2, margin + 50, { align: "center" });

      yPosition = margin + 60; // Increased from margin + 50

      // Proposal Details - moved down
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Quotation: ${proposal.title || "Untitled Quotation"}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Proposal Number
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Quotation #: ${formatProposalNumber(
          proposal.proposalNumber,
          proposal._id
        )}`,
        margin,
        yPosition
      );
      yPosition += 8;

      // Status
      doc.text(`Status: ${proposal.status || "Draft"}`, margin, yPosition);
      yPosition += 8;

      // Date
      doc.text(
        `Date: ${
          proposal.date
            ? new Date(proposal.date).toLocaleDateString()
            : new Date().toLocaleDateString()
        }`,
        margin,
        yPosition
      );
      yPosition += 8;

      // Valid Until
      doc.text(
        `Valid Until: ${
          proposal.openTill
            ? new Date(proposal.openTill).toLocaleDateString()
            : "N/A"
        }`,
        margin,
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
          rate: formatBDT(item.rate || 0),
          amount: formatBDT((item.quantity || 1) * (item.rate || 0)),
        }));

        // Add table
        autoTable(doc, {
          startY: yPosition,
          head: [tableColumns.map((col) => col.header)],
          body: tableRows.map((row) =>
            tableColumns.map((col) => row[col.dataKey])
          ),
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: template?.primaryColor || [51, 51, 51],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          tableLineColor: [200, 200, 200],
          tableLineWidth: 0.1,
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
        formatBDT(subtotal),
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (discount > 0) {
        doc.text("Discount:", calcX, yPosition);
        doc.text(
          `- ${formatBDT(discount)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total:", calcX, yPosition);
      doc.text(
        formatBDT(total),
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

      // Company contact in footer - ONLY show if enabled in template
      if (template?.showCompanyInfoInFooter) {
        const footerContact = [
          template?.companyName || "Your Company",
          template?.companyEmail ? `Email: ${template.companyEmail}` : "",
          template?.companyPhone ? `Phone: ${template.companyPhone}` : "",
        ]
          .filter(Boolean)
          .join(" | ");

        doc.text(footerContact, pageWidth / 2, footerY - 20, {
          align: "center",
        });
      }

      // Save the PDF
      const fileName = `Quotation_${formatProposalNumber(
        proposal.proposalNumber,
        proposal._id
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
      ProposalNumber: formatProposalNumber(p.proposalNumber, p._id),
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
        link.setAttribute("download", "quotations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Quotations");
        XLSXWriteFile(workbook, "quotations.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("quotations.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Quotations</title></head><body>"
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
    if (!window.confirm("Are you sure you want to delete this quotation?"))
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
      !window.confirm(`Delete ${selectedProposals.length} selected quotations?`)
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
      alert("Selected quotations deleted!");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-slate-600">
        Loading quotations...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Sales
              </p>
              <h1 className="text-2xl font-bold text-white">Quotations</h1>
              <div className="mt-1 flex items-center text-sm text-slate-300">
                <span>Dashboard</span>
                <FaChevronRight className="mx-1 text-xs" />
                <span>Quotations</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => navigate("new")}
              >
                <FaPlus /> New Quotation
              </button>
              {selectedProposals.length > 0 && (
                <button
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  onClick={handleDeleteSelected}
                >
                  Delete Selected ({selectedProposals.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Proposals */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Quotations
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {proposals.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>

          {/* Draft Proposals */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Draft
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {proposals.filter((p) => p.status === "Draft").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500 text-white">
                <FaEdit />
              </div>
            </div>
          </div>

          {/* Sent Proposals */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Sent
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {proposals.filter((p) => p.status === "Sent").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>

          {/* Accepted Proposals */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Accepted
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {proposals.filter((p) => p.status === "Accepted").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>
        </div>

        {/* Top action buttons */}
        <div className="flex items-center justify-end flex-wrap gap-2">
          <button
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            onClick={() => setCompactView(!compactView)}
          >
            {compactView ? "<<" : ">>"}
          </button>
        </div>

        {/* White box for table */}
        <div
          className={`rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 ${
            compactView ? "w-1/2" : "w-full"
          }`}
        >
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Entries per page */}
            <select
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                <HiOutlineDownload /> Export
              </button>

              {/* Dropdown menu */}
              {showExportMenu && (
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg z-10 overflow-hidden"
                >
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => handleExport("Excel")}
                  >
                    Excel
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => handleExport("CSV")}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => handleExport("PDF")}
                  >
                    PDF
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    onClick={() => handleExport("Print")}
                  >
                    Print
                  </button>
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              className="flex items-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
              onClick={fetchProposals}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500">
              <tr className="text-left">
                <th className="px-4 sm:px-6 py-3">
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
                <th className="px-4 sm:px-6 py-3">Quotation#</th>
                <th className="px-4 sm:px-6 py-3">Client</th>
                <th className="px-4 sm:px-6 py-3">Title</th>
                {compactView ? (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3">Status</th>
                    <th className="px-4 sm:px-6 py-3">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3">Date</th>
                    <th className="px-4 sm:px-6 py-3">Open Till</th>
                    <th className="px-4 sm:px-6 py-3">Tags</th>
                    <th className="px-4 sm:px-6 py-3">Status</th>
                    <th className="px-4 sm:px-6 py-3">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {currentProposals.length > 0 ? (
                currentProposals.map((proposal) => {
                  const displayProposalNumber = formatProposalNumber(
                    proposal.proposalNumber,
                    proposal._id
                  );

                  const displayAmount = formatBDT(proposal.total || 0);

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
                      className="hover:bg-white/70 text-slate-700"
                    >
                      <td className="px-4 sm:px-6 py-3">
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
                      <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                        {displayProposalNumber}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {proposal.clientName || "-"}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {proposal.title || "-"}
                      </td>
                      {compactView ? (
                        <>
                          <td className="px-4 sm:px-6 py-3 text-right tabular-nums font-medium">
                            {displayAmount}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                proposal.status
                              )}`}
                            >
                              {proposal.status || "Draft"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewProposal(proposal)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                title="View"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                onClick={() => downloadProposalPDF(proposal)}
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                                title="Download"
                              >
                                <FaDownload size={14} />
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
                                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(proposal._id)}
                                className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 sm:px-6 py-3 text-right tabular-nums font-medium">
                            {displayAmount}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {formatDate(proposal.date)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {formatDate(proposal.openTill)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {proposal.tags || "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                proposal.status
                              )}`}
                            >
                              {proposal.status || "Draft"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewProposal(proposal)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                title="View"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                onClick={() => downloadProposalPDF(proposal)}
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                                title="Download"
                              >
                                <FaDownload size={14} />
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
                                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(proposal._id)}
                                className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrash size={14} />
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
                    className="p-8 text-center text-slate-500"
                  >
                    {proposals.length === 0
                      ? "No quotations found. Create your first quotation!"
                      : "No quotations match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProposals.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
            <span>
              Showing {indexOfFirstProposal + 1} to{" "}
              {Math.min(indexOfLastProposal, filteredProposals.length)} of{" "}
              {filteredProposals.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`rounded-xl border border-slate-200 px-3 py-2 text-sm ${
                    currentPage === i + 1
                      ? "bg-slate-900 text-white"
                      : "bg-white/80"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm disabled:opacity-50"
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
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-white/60 bg-white p-6 w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Quotation Details
              </h2>
              <button
                onClick={() => setViewProposal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3 text-slate-700">
              <p>
                <b>Quotation #:</b>{" "}
                {formatProposalNumber(
                  viewProposal.proposalNumber,
                  viewProposal._id
                )}
              </p>
              <p>
                <b>Client:</b> {viewProposal.clientName}
              </p>
              <p>
                <b>Title:</b> {viewProposal.title}
              </p>
              <p>
                <b>Amount:</b> {formatBDT(viewProposal.total || 0)}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <FaDownload className="inline mr-2" /> Download PDF
              </button>
              <button
                onClick={() => setViewProposal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editProposal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-white/60 bg-white p-6 w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Update Quotation
              </h2>
              <button
                onClick={() => setEditProposal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) =>
                    setFormData({ ...formData, total: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Proposals;
