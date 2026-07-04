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
  FaSearch,
  FaChevronRight,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBDT } from "../../../utils/currency";

const Estimates = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstimates, setSelectedEstimates] = useState([]);
  const [viewEstimate, setViewEstimate] = useState(null);
  const [editEstimate, setEditEstimate] = useState(null);
  const [formData, setFormData] = useState({
    customer: "",
    status: "Draft",
  });
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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

  // Fetch estimates for the logged-in admin only
  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/estimates`,
        config
      );

      // Ensure we're getting the data in the correct format
      if (data.data) {
        setEstimates(data.data); // If response has data property
      } else if (Array.isArray(data)) {
        setEstimates(data); // If response is directly an array
      } else {
        console.error("Unexpected API response format:", data);
        setEstimates([]);
      }
    } catch (err) {
      console.error("Error fetching estimates", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setEstimates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEstimates();
    fetchTemplate();
  }, []);

  // Toggle estimate selection
  const toggleEstimateSelection = (id) => {
    if (selectedEstimates.includes(id)) {
      setSelectedEstimates(
        selectedEstimates.filter((estimateId) => estimateId !== id)
      );
    } else {
      setSelectedEstimates([...selectedEstimates, id]);
    }
  };

  // Generate and download estimate PDF
  const downloadEstimatePDF = async (estimate) => {
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

      // ESTIMATE text - AFTER the line (like quotation)
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("ESTIMATE", pageWidth / 2, margin + 50, { align: "center" });

      yPosition = margin + 60; // Increased from margin + 50

      // Estimate Details - moved down
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Estimate: ${estimate.reference || "Untitled Estimate"}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Estimate Number
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Format estimate number function
      const formatEstimateNumber = (num) => {
        if (!num) return "TEMP-" + estimate._id.slice(-6).toUpperCase();
        if (num.startsWith("EST-")) return num;
        const matches = num.match(/\d+/);
        const numberPart = matches ? matches[0] : "000001";
        return `EST-${String(numberPart).padStart(6, "0")}`;
      };

      doc.text(
        `Estimate #: ${formatEstimateNumber(estimate.estimateNumber)}`,
        margin,
        yPosition
      );
      yPosition += 8;

      // Status
      doc.text(`Status: ${estimate.status || "Draft"}`, margin, yPosition);
      yPosition += 8;

      // Date - Left side
      doc.text(
        `Date: ${new Date(
          estimate.estimateDate || Date.now()
        ).toLocaleDateString()}`,
        margin,
        yPosition
      );
      yPosition += 8;

      // Expiry Date - Left side (under date)
      doc.text(
        `Expiry Date: ${
          estimate.expiryDate
            ? new Date(estimate.expiryDate).toLocaleDateString()
            : "N/A"
        }`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Customer Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Information:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Customer: ${estimate.customer || "Not specified"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      if (estimate.email) {
        doc.text(`Email: ${estimate.email}`, margin, yPosition);
        yPosition += 5;
      }

      if (estimate.phone) {
        doc.text(`Phone: ${estimate.phone}`, margin, yPosition);
        yPosition += 5;
      }

      // Address if available
      if (
        estimate.address ||
        estimate.city ||
        estimate.state ||
        estimate.country
      ) {
        const addressParts = [];
        if (estimate.address) addressParts.push(estimate.address);
        if (estimate.city) addressParts.push(estimate.city);
        if (estimate.state) addressParts.push(estimate.state);
        if (estimate.country) addressParts.push(estimate.country);
        if (estimate.zip) addressParts.push(`ZIP: ${estimate.zip}`);

        if (addressParts.length > 0) {
          doc.text(`Address: ${addressParts.join(", ")}`, margin, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 10;

      // Items Table
      if (estimate.items && estimate.items.length > 0) {
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
          { header: "Tax", dataKey: "tax" },
          { header: "Amount", dataKey: "amount" },
        ];

        const tableRows = estimate.items.map((item, index) => {
          const subtotal = (item.quantity || 1) * (item.rate || 0);
          const taxAmount =
            (((item.tax1 || 0) + (item.tax2 || 0)) * subtotal) / 100;
          const total = subtotal + taxAmount;

          return {
            index: index + 1,
            description: item.description || "Item",
            quantity: item.quantity || 1,
            rate: formatBDT(item.rate || 0),
            tax: `${(item.tax1 || 0) + (item.tax2 || 0)}%`,
            amount: formatBDT(total),
          };
        });

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
        estimate.items?.reduce(
          (sum, item) => sum + (item.quantity || 1) * (item.rate || 0),
          0
        ) || 0;

      const totalTax =
        estimate.items?.reduce((sum, item) => {
          const itemSubtotal = (item.quantity || 1) * (item.rate || 0);
          const taxRate = (item.tax1 || 0) + (item.tax2 || 0);
          return sum + (itemSubtotal * taxRate) / 100;
        }, 0) || 0;

      const discount = estimate.discount || 0;
      const total = estimate.total || subtotal + totalTax - discount;

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

      if (totalTax > 0) {
        doc.text("Tax:", calcX, yPosition);
        doc.text(
          formatBDT(totalTax),
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

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
      if (estimate.tags) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Tags: ${estimate.tags}`, margin, yPosition);
        yPosition += 8;
      }

      if (estimate.adminNote) {
        doc.text(`Admin Note: ${estimate.adminNote}`, margin, yPosition);
        yPosition += 8;
      }

      if (estimate.clientNote) {
        doc.text(`Client Note: ${estimate.clientNote}`, margin, yPosition);
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

      // Save the PDF
      const fileName = `Estimate_${formatEstimateNumber(
        estimate.estimateNumber
      )}_${estimate.customer?.replace(/[^a-z0-9]/gi, "_") || "Untitled"}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!estimates.length) return;

    const exportData = estimates.map((e) => ({
      EstimateNumber:
        e.estimateNumber || "EST-" + e._id.slice(-6).toUpperCase(),
      Customer: e.customer,
      Amount: e.total,
      TotalTax: e.items
        ? e.items.reduce(
            (sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0),
            0
          )
        : 0,
      Project: e.reference || "-",
      Tags: e.tags || "-",
      Date: e.estimateDate
        ? new Date(e.estimateDate).toLocaleDateString()
        : "-",
      ExpiryDate: e.expiryDate
        ? new Date(e.expiryDate).toLocaleDateString()
        : "-",
      Reference: e.reference || "-",
      Status: e.status,
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
        link.setAttribute("download", "estimates.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Estimates");
        XLSXWriteFile(workbook, "estimates.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("estimates.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Estimates</title></head><body>"
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

  // Delete estimate
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this estimate?"))
      return;
    try {
      const config = createAxiosConfig();
      await axios.delete(`${API_BASE_URL}/admin/estimates/${id}`, config);
      setEstimates(estimates.filter((e) => e._id !== id));
      // Remove from selected if it was selected
      setSelectedEstimates(
        selectedEstimates.filter((estimateId) => estimateId !== id)
      );
    } catch (err) {
      console.error("Error deleting estimate", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Bulk delete estimates
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedEstimates.length} estimates?`
      )
    )
      return;
    try {
      const config = createAxiosConfig();
      await Promise.all(
        selectedEstimates.map((id) =>
          axios.delete(`${API_BASE_URL}/admin/estimates/${id}`, config)
        )
      );
      setEstimates(estimates.filter((e) => !selectedEstimates.includes(e._id)));
      setSelectedEstimates([]);
      alert("Selected estimates deleted successfully!");
    } catch (err) {
      console.error("Error deleting estimates", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting selected estimates.");
    }
  };

  // Update estimate
  const handleUpdate = async () => {
    try {
      const config = createAxiosConfig();
      await axios.put(
        `${API_BASE_URL}/admin/estimates/${editEstimate._id}`,
        formData,
        config
      );
      setEditEstimate(null);
      fetchEstimates();
    } catch (err) {
      console.error("Error updating estimate", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Filter estimates
  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (estimate.estimateNumber || "EST-" + estimate._id.slice(-6).toUpperCase())
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      estimate.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastEstimate = currentPage * entriesPerPage;
  const indexOfFirstEstimate = indexOfLastEstimate - entriesPerPage;
  const currentEstimates = filteredEstimates.slice(
    indexOfFirstEstimate,
    indexOfLastEstimate
  );
  const totalPages = Math.ceil(filteredEstimates.length / entriesPerPage);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Expired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-slate-600">
        Loading estimates...
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
              <h1 className="text-2xl font-bold text-white">Estimates</h1>
              <div className="mt-1 flex items-center text-sm text-slate-300">
                <span>Dashboard</span>
                <FaChevronRight className="mx-1 text-xs" />
                <span>Estimates</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => navigate("new")}
              >
                <FaPlus /> New Estimate
              </button>
              {selectedEstimates.length > 0 && (
                <button
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedEstimates.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Estimates */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Estimates
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {estimates.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>

          {/* Draft Estimates */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Draft
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {estimates.filter((e) => e.status === "Draft").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500 text-white">
                <FaEdit />
              </div>
            </div>
          </div>

          {/* Pending Estimates */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Pending
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {estimates.filter((e) => e.status === "Pending").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>

          {/* Approved Estimates */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Approved
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {estimates.filter((e) => e.status === "Approved").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <FaEye />
              </div>
            </div>
          </div>

          {/* Rejected Estimates */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Rejected
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {estimates.filter((e) => e.status === "Rejected").length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white">
                <FaTimes />
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
              onClick={fetchEstimates}
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
                      selectedEstimates.length === currentEstimates.length &&
                      currentEstimates.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEstimates(
                          currentEstimates.map((e) => e._id)
                        );
                      } else {
                        setSelectedEstimates([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 sm:px-6 py-3">Estimate#</th>
                <th className="px-4 sm:px-6 py-3">Customer</th>
                {compactView ? (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3">Date</th>
                    <th className="px-4 sm:px-6 py-3">Status</th>
                    <th className="px-4 sm:px-6 py-3">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-right">Total Tax</th>
                    <th className="px-4 sm:px-6 py-3">Project</th>
                    <th className="px-4 sm:px-6 py-3">Tags</th>
                    <th className="px-4 sm:px-6 py-3">Date</th>
                    <th className="px-4 sm:px-6 py-3">Expiry Date</th>
                    <th className="px-4 sm:px-6 py-3">Status</th>
                    <th className="px-4 sm:px-6 py-3">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {currentEstimates.length > 0 ? (
                currentEstimates.map((estimate) => {
                  const displayEstimateNumber =
                    estimate.estimateNumber ||
                    "EST-" + estimate._id.slice(-6).toUpperCase();

                  const displayAmount = formatBDT(estimate.total || 0);

                  const totalTax = estimate.items
                    ? estimate.items.reduce(
                        (sum, item) =>
                          sum + (item.tax1 || 0) + (item.tax2 || 0),
                        0
                      )
                    : 0;

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime())
                      ? "-"
                      : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={estimate._id}
                      className="hover:bg-white/70 text-slate-700"
                    >
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedEstimates.includes(estimate._id)}
                            onChange={() =>
                              toggleEstimateSelection(estimate._id)
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                        {displayEstimateNumber}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {estimate.customer || "-"}
                      </td>
                      {compactView ? (
                        <>
                          <td className="px-4 sm:px-6 py-3 text-right tabular-nums font-medium">
                            {displayAmount}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {formatDate(estimate.estimateDate)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                estimate.status
                              )}`}
                            >
                              {estimate.status || "Draft"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewEstimate(estimate)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                title="View"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                onClick={() => downloadEstimatePDF(estimate)}
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                                title="Download"
                              >
                                <FaDownload size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditEstimate(estimate);
                                  setFormData({
                                    customer: estimate.customer || "",
                                    status: estimate.status || "Draft",
                                  });
                                }}
                                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(estimate._id)}
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
                          <td className="px-4 sm:px-6 py-3 text-right tabular-nums font-medium">
                            {formatBDT(totalTax)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {estimate.reference || "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {estimate.tags || "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {formatDate(estimate.estimateDate)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {formatDate(estimate.expiryDate)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                estimate.status
                              )}`}
                            >
                              {estimate.status || "Draft"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewEstimate(estimate)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                                title="View"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                onClick={() => downloadEstimatePDF(estimate)}
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                                title="Download"
                              >
                                <FaDownload size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditEstimate(estimate);
                                  setFormData({
                                    customer: estimate.customer || "",
                                    status: estimate.status || "Draft",
                                  });
                                }}
                                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(estimate._id)}
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
                    colSpan={compactView ? 7 : 11}
                    className="p-8 text-center text-slate-500"
                  >
                    {estimates.length === 0
                      ? "No estimates found. Create your first estimate!"
                      : "No estimates match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredEstimates.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
            <span>
              Showing {indexOfFirstEstimate + 1} to{" "}
              {Math.min(indexOfLastEstimate, filteredEstimates.length)} of{" "}
              {filteredEstimates.length} entries
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
      {viewEstimate && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-white/60 bg-white p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Estimate Details
              </h2>
              <button
                onClick={() => setViewEstimate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3 text-slate-700">
              <p>
                <b>Estimate #:</b>{" "}
                {viewEstimate.estimateNumber ||
                  "EST-" + viewEstimate._id.slice(-6).toUpperCase()}
              </p>
              <p>
                <b>Customer:</b> {viewEstimate.customer || "-"}
              </p>
              <p>
                <b>Reference:</b> {viewEstimate.reference || "-"}
              </p>
              <p>
                <b>Amount:</b>{" "}
                {formatBDT(viewEstimate.total || 0)}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                    viewEstimate.status
                  )}`}
                >
                  {viewEstimate.status || "Draft"}
                </span>
              </p>
              {viewEstimate.estimateDate && (
                <p>
                  <b>Date:</b>{" "}
                  {new Date(viewEstimate.estimateDate).toLocaleDateString()}
                </p>
              )}
              {viewEstimate.expiryDate && (
                <p>
                  <b>Expiry Date:</b>{" "}
                  {new Date(viewEstimate.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => downloadEstimatePDF(viewEstimate)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <FaDownload className="inline mr-2" /> Download PDF
              </button>
              <button
                onClick={() => setViewEstimate(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editEstimate && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50">
          <div className="rounded-2xl border border-white/60 bg-white p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Update Estimate
              </h2>
              <button
                onClick={() => setEditEstimate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Customer Name"
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
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditEstimate(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Update Estimate
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Estimates;
