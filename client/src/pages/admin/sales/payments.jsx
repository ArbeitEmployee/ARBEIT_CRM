/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaEye,
  FaChevronRight,
  FaTimes,
  FaPlus,
  FaDownload,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBDT } from "../../../utils/currency";

const Payments = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [stats, setStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalAmount: 0,
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

  // Fetch payments data from API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const config = createAxiosConfig();
      const response = await axios.get(
        `${API_BASE_URL}/admin/payments`,
        config
      );

      if (response.data.success) {
        setPayments(response.data.data);

        // Calculate stats
        const total = response.data.data.length;
        const completed = response.data.data.filter(
          (p) => p.status === "Completed"
        ).length;
        const pending = response.data.data.filter(
          (p) => p.status === "Pending"
        ).length;
        const failed = response.data.data.filter(
          (p) => p.status === "Failed"
        ).length;
        const refunded = response.data.data.filter(
          (p) => p.status === "Refunded"
        ).length;
        const totalAmount = response.data.data.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        setStats({
          totalPayments: total,
          completedPayments: completed,
          pendingPayments: pending,
          failedPayments: failed,
          refundedPayments: refunded,
          totalAmount: totalAmount,
        });
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.response?.data?.message || "Failed to load payment data");
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchTemplate();
  }, []);

  // Generate and download payment receipt PDF
  const downloadPaymentPDF = async (payment) => {
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

      // PAYMENT RECEIPT text - AFTER the line
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT RECEIPT", pageWidth / 2, margin + 50, {
        align: "center",
      });

      yPosition = margin + 60; // Increased from margin + 50

      // Payment Details - moved down
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Receipt", margin, yPosition);
      yPosition += 10;

      // Payment Number
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const formatPaymentNumber = (num) => {
        if (!num) return "PAY-" + payment._id.slice(-6).toUpperCase();
        if (num.startsWith("PAY-")) return num;
        const matches = num.match(/\d+/);
        const numberPart = matches ? matches[0] : "000001";
        return `PAY-${String(numberPart).padStart(6, "0")}`;
      };

      const paymentNumber = formatPaymentNumber(payment.paymentNumber);

      doc.text(`Receipt #: ${paymentNumber}`, margin, yPosition);
      yPosition += 8;

      // Status
      doc.text(`Status: ${payment.status || "Completed"}`, margin, yPosition);
      yPosition += 8;

      // Date - Left side
      doc.text(
        `Date: ${new Date(
          payment.paymentDate || Date.now()
        ).toLocaleDateString()}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Payment Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Information:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Customer: ${payment.customer || "Not specified"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      doc.text(
        `Invoice #: ${payment.invoiceNumber || "N/A"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      doc.text(
        `Payment Mode: ${payment.paymentMode || "N/A"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      if (payment.transactionId) {
        doc.text(`Transaction ID: ${payment.transactionId}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 10;

      // Payment Amount Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details:", margin, yPosition);
      yPosition += 10;

      // Create a box for payment amount
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition - 5, contentWidth, 25);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Amount Paid:", margin + 10, yPosition + 5);
      doc.text(
        formatBDT(payment.amount || 0),
        pageWidth - margin - 10,
        yPosition + 5,
        { align: "right" }
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `(${formatBDT(payment.amount || 0)})`,
        pageWidth - margin - 10,
        yPosition + 12,
        { align: "right" }
      );

      yPosition += 35;

      // Payment Status
      const getStatusColorCode = (status) => {
        switch (status) {
          case "Completed":
            return [34, 197, 94]; // Green
          case "Pending":
            return [253, 224, 71]; // Yellow
          case "Failed":
            return [239, 68, 68]; // Red
          case "Refunded":
            return [249, 115, 22]; // Orange
          default:
            return [156, 163, 175]; // Gray
        }
      };

      const statusColor = getStatusColorCode(payment.status);

      doc.setFillColor(...statusColor);
      doc.rect(margin, yPosition, 10, 10, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Status: ${payment.status || "Completed"}`,
        margin + 15,
        yPosition + 7
      );

      yPosition += 15;

      // Notes
      if (payment.notes) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Notes:", margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const notes = doc.splitTextToSize(payment.notes, contentWidth - 10);
        notes.forEach((line) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Terms and Conditions
      yPosition += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        "This is an official payment receipt. Please keep this document for your records.",
        margin,
        yPosition
      );
      yPosition += 5;

      // Signature line
      const signatureY = pageHeight - margin - 50;
      doc.setDrawColor(200, 200, 200);
      doc.line(
        pageWidth - margin - 60,
        signatureY,
        pageWidth - margin,
        signatureY
      );
      doc.setFontSize(9);
      doc.text("Authorized Signature", pageWidth - margin - 60, signatureY + 5);
      doc.text(
        template?.companyName?.substring(0, 15) || "Company",
        pageWidth - margin - 60,
        signatureY + 10
      );

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
      const fileName = `Payment_Receipt_${paymentNumber}_${
        payment.customer?.replace(/[^a-z0-9]/gi, "_") || "Customer"
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!payments.length) return;

    const exportData = payments.map((p) => ({
      PaymentNumber: p.paymentNumber,
      InvoiceNumber: p.invoiceNumber,
      PaymentMode: p.paymentMode,
      TransactionID: p.transactionId,
      Customer: p.customer,
      Amount: formatCurrency(p.amount, p.currency),
      PaymentDate: new Date(p.paymentDate).toLocaleDateString(),
      Status: p.status,
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
        link.setAttribute("download", "payments.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Payments");
        XLSXWriteFile(workbook, "payments.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("payments.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Payments</title></head><body>"
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

  // Search filter
  const filteredPayments = payments.filter((pay) =>
    Object.values(pay).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const indexOfLastPayment = currentPage * entriesPerPage;
  const indexOfFirstPayment = indexOfLastPayment - entriesPerPage;
  const currentPayments = filteredPayments.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );
  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage);

  // Format currency
  const formatCurrency = (amount) => {
    return formatBDT(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 flex items-center justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p className="text-slate-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 flex items-center justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-red-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Sales
          </p>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <div className="mt-1 flex items-center text-slate-300 text-sm">
            <span>Dashboard</span>
            <FaChevronRight className="mx-1 text-xs" />
            <span>Payments</span>
          </div>
        </div>

        {/* Stats Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Payments
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.totalPayments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#0ea5e9]">
                <FaSearch className="text-white" />
              </div>
            </div>
          </div>

          {/* Completed Payments */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Completed
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.completedPayments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#22c55e]">
                <FaEye className="text-white" />
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Total Amount
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#8b5cf6]">
                <FaPlus className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* White box for table & controls */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur transition-all duration-300 w-full">
        {/* Table controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
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
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center gap-1"
              >
                <HiOutlineDownload /> Export
              </button>

              {/* Dropdown menu */}
              {showExportMenu && (
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg z-10"
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
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white flex items-center"
              onClick={fetchPayments}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search payments..."
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 rounded-l-lg">
                  Payment #
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Invoice #
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Payment Mode
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Transaction ID
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Customer
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 text-right">
                  Amount
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Payment Date
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3">
                  Status
                </th>
                <th className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 px-4 sm:px-6 py-3 rounded-r-lg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.length > 0 ? (
                currentPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="bg-white shadow rounded-lg hover:bg-white/70 relative text-slate-700"
                  >
                    <td className="px-4 sm:px-6 py-3 text-sm rounded-l-lg border-0">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">{payment.invoiceNumber}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">{payment.paymentMode}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">{payment.transactionId}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">{payment.customer}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0 text-right tabular-nums font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm border-0">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm rounded-r-lg border-0">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewPayment(payment)}
                          className="rounded-lg p-2 bg-slate-100 text-slate-700"
                          title="View"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => downloadPaymentPDF(payment)}
                          className="rounded-lg p-2 bg-emerald-100 text-emerald-700"
                          title="Download"
                        >
                          <FaDownload size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 sm:px-6 py-4 text-center text-slate-500 bg-white shadow rounded-lg"
                  >
                    {payments.length === 0
                      ? "No payment records found"
                      : "No payments match your search criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
            <span>
              Showing {indexOfFirstPayment + 1} to{" "}
              {Math.min(indexOfLastPayment, filteredPayments.length)} of{" "}
              {filteredPayments.length} entries
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

        {/* View Payment Modal */}
        {viewPayment && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="rounded-2xl border border-white/60 bg-white p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Payment Details
                </h2>
                <button
                  onClick={() => setViewPayment(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3 text-slate-700">
                <p>
                  <b>Payment #:</b> {viewPayment.paymentNumber}
                </p>
                <p>
                  <b>Invoice #:</b> {viewPayment.invoiceNumber}
                </p>
                <p>
                  <b>Customer:</b> {viewPayment.customer}
                </p>
                <p>
                  <b>Payment Mode:</b> {viewPayment.paymentMode}
                </p>
                <p>
                  <b>Transaction ID:</b> {viewPayment.transactionId}
                </p>
                <p>
                  <b>Amount:</b>{" "}
                  {formatCurrency(viewPayment.amount, viewPayment.currency)}
                </p>
                <p>
                  <b>Payment Date:</b>{" "}
                  {new Date(viewPayment.paymentDate).toLocaleDateString()}
                </p>
                <p>
                  <b>Status:</b>{" "}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      viewPayment.status
                    )}`}
                  >
                    {viewPayment.status}
                  </span>
                </p>
                {viewPayment.notes && (
                  <p>
                    <b>Notes:</b> {viewPayment.notes}
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => downloadPaymentPDF(viewPayment)}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
                >
                  <FaDownload className="inline mr-2" /> Download Receipt
                </button>
                <button
                  onClick={() => setViewPayment(null)}
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
