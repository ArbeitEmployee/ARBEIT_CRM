/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
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
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaMoneyBillWave,
  FaDownload,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Invoices = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState({
    customer: "",
    status: "Draft",
  });
  const [showBatchPayment, setShowBatchPayment] = useState(false);
  const [batchPaymentData, setBatchPaymentData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "",
    transactionId: "",
    sendEmail: false,
  });
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [batchPaymentError, setBatchPaymentError] = useState("");
  const [batchPaymentLoading, setBatchPaymentLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
    pendingInvoices: 0,
    partiallypaidInvoices: 0,
    unpaidInvoices: 0,
  });

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

  // Fetch invoices for the logged-in admin only
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );

      // Ensure we're getting the data in the correct format
      if (data.data) {
        setInvoices(data.data); // If response has data property
      } else if (Array.isArray(data)) {
        setInvoices(data); // If response is directly an array
      } else {
        console.error("Unexpected API response format:", data);
        setInvoices([]);
      }

      // Calculate stats
      const total = data.data?.length || data.length || 0;
      const paid = (data.data || data).filter(
        (i) => i.status === "Paid"
      ).length;
      const unpaid = (data.data || data).filter(
        (i) => i.status === "Unpaid"
      ).length;
      const overdue = (data.data || data).filter(
        (i) => i.status === "Overdue"
      ).length;
      const draft = (data.data || data).filter(
        (i) => i.status === "Draft"
      ).length;
      const partiallypaid = (data.data || data).filter(
        (i) => i.status === "Partiallypaid"
      ).length;

      setStats({
        totalInvoices: total,
        paidInvoices: paid,
        unpaidInvoices: unpaid,
        overdueInvoices: overdue,
        draftInvoices: draft,
        partiallypaidInvoices: partiallypaid,
      });
    } catch (err) {
      console.error("Error fetching invoices", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setInvoices([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    fetchTemplate();
  }, []);

  // Generate and download invoice PDF
  const downloadInvoicePDF = async (invoice) => {
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
            80, // Height
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

      // Center: Document Type
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", pageWidth / 2, margin + 15, { align: "center" });

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

      yPosition = margin + 50;

      // Invoice Details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Invoice: ${invoice.reference || "Untitled Invoice"}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Invoice Number and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const formatInvoiceNumber = (num) => {
        if (!num) return "TEMP-" + invoice._id.slice(-6).toUpperCase();
        if (num.startsWith("INV-")) return num;
        const matches = num.match(/\d+/);
        const numberPart = matches ? matches[0] : "000001";
        return `INV-${String(numberPart).padStart(6, "0")}`;
      };

      doc.text(
        `Invoice #: ${formatInvoiceNumber(invoice.invoiceNumber)}`,
        margin,
        yPosition
      );
      doc.text(
        `Date: ${new Date(
          invoice.invoiceDate || Date.now()
        ).toLocaleDateString()}`,
        pageWidth / 2,
        yPosition
      );
      yPosition += 8;

      doc.text(`Status: ${invoice.status || "Draft"}`, margin, yPosition);
      doc.text(
        `Due Date: ${
          invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString()
            : "N/A"
        }`,
        pageWidth / 2,
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
        `Customer: ${invoice.customer || "Not specified"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      if (invoice.email) {
        doc.text(`Email: ${invoice.email}`, margin, yPosition);
        yPosition += 5;
      }

      if (invoice.phone) {
        doc.text(`Phone: ${invoice.phone}`, margin, yPosition);
        yPosition += 5;
      }

      // Address if available
      if (invoice.address || invoice.city || invoice.state || invoice.country) {
        const addressParts = [];
        if (invoice.address) addressParts.push(invoice.address);
        if (invoice.city) addressParts.push(invoice.city);
        if (invoice.state) addressParts.push(invoice.state);
        if (invoice.country) addressParts.push(invoice.country);
        if (invoice.zip) addressParts.push(`ZIP: ${invoice.zip}`);

        if (addressParts.length > 0) {
          doc.text(`Address: ${addressParts.join(", ")}`, margin, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 10;

      // Items Table
      if (invoice.items && invoice.items.length > 0) {
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

        const tableRows = invoice.items.map((item, index) => {
          const subtotal = (item.quantity || 1) * (item.rate || 0);
          const taxAmount =
            (((item.tax1 || 0) + (item.tax2 || 0)) * subtotal) / 100;
          const total = subtotal + taxAmount;

          return {
            index: index + 1,
            description: item.description || "Item",
            quantity: item.quantity || 1,
            rate: `${invoice.currency || "USD"} ${(item.rate || 0).toFixed(2)}`,
            tax: `${(item.tax1 || 0) + (item.tax2 || 0)}%`,
            amount: `${invoice.currency || "USD"} ${total.toFixed(2)}`,
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
        invoice.items?.reduce(
          (sum, item) => sum + (item.quantity || 1) * (item.rate || 0),
          0
        ) || 0;

      const totalTax =
        invoice.items?.reduce((sum, item) => {
          const itemSubtotal = (item.quantity || 1) * (item.rate || 0);
          const taxRate = (item.tax1 || 0) + (item.tax2 || 0);
          return sum + (itemSubtotal * taxRate) / 100;
        }, 0) || 0;

      const discount = invoice.discount || 0;
      const total = invoice.total || subtotal + totalTax - discount;
      const paidAmount = invoice.paidAmount || 0;
      const balanceDue = total - paidAmount;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Right align calculations
      const calcX = pageWidth - margin - 60;

      doc.text("Subtotal:", calcX, yPosition);
      doc.text(
        `${invoice.currency || "USD"} ${subtotal.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (totalTax > 0) {
        doc.text("Tax:", calcX, yPosition);
        doc.text(
          `${invoice.currency || "USD"} ${totalTax.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      if (discount > 0) {
        doc.text("Discount:", calcX, yPosition);
        doc.text(
          `- ${invoice.currency || "USD"} ${discount.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      doc.text("Total:", calcX, yPosition);
      doc.text(
        `${invoice.currency || "USD"} ${total.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (paidAmount > 0) {
        doc.text("Paid Amount:", calcX, yPosition);
        doc.text(
          `${invoice.currency || "USD"} ${paidAmount.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Balance Due:", calcX, yPosition);
      doc.text(
        `${invoice.currency || "USD"} ${balanceDue.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 15;

      // Payment Status
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Status:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (invoice.status === "Paid") {
        doc.text("✓ Payment Completed", margin, yPosition);
        yPosition += 8;
      } else if (invoice.status === "Partiallypaid") {
        doc.text(
          `● Partially Paid (${paidAmount.toFixed(
            2
          )} paid, ${balanceDue.toFixed(2)} remaining)`,
          margin,
          yPosition
        );
        yPosition += 8;
      } else {
        doc.text("● Payment Pending", margin, yPosition);
        yPosition += 8;
      }

      // Terms and Notes
      if (invoice.tags) {
        doc.text(`Tags: ${invoice.tags}`, margin, yPosition);
        yPosition += 8;
      }

      if (invoice.adminNote) {
        doc.text(`Admin Note: ${invoice.adminNote}`, margin, yPosition);
        yPosition += 8;
      }

      if (invoice.clientNote) {
        doc.text(`Client Note: ${invoice.clientNote}`, margin, yPosition);
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
      const fileName = `Invoice_${formatInvoiceNumber(invoice.invoiceNumber)}_${
        invoice.customer?.replace(/[^a-z0-9]/gi, "_") || "Untitled"
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Toggle invoice selection
  const toggleInvoiceSelection = (id) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(
        selectedInvoices.filter((invoiceId) => invoiceId !== id)
      );
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Unpaid":
        return "bg-blue-100 text-blue-800";
      case "Partiallypaid":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get unpaid and Partiallypaid invoices for batch payment
  const getPayableInvoices = () => {
    return invoices.filter(
      (invoice) =>
        invoice.status === "Unpaid" ||
        invoice.status === "Partiallypaid" ||
        invoice.status === "Overdue"
    );
  };

  // Handle batch payment amount change
  const handlePaymentAmountChange = (invoiceId, amount) => {
    const numAmount = parseFloat(amount) || 0;

    // Get the invoice to validate amount
    const invoice = invoices.find((inv) => inv._id === invoiceId);
    if (invoice) {
      const balanceDue = invoice.total - (invoice.paidAmount || 0);

      // Ensure payment doesn't exceed balance due
      if (numAmount > balanceDue) {
        setPaymentAmounts((prev) => ({
          ...prev,
          [invoiceId]: balanceDue,
        }));
        return;
      }
    }

    setPaymentAmounts((prev) => ({
      ...prev,
      [invoiceId]: numAmount,
    }));
  };

  // Process batch payments - UPDATED FOR NEW PAYMENT API
  const processBatchPayments = async () => {
    setBatchPaymentLoading(true);
    setBatchPaymentError("");

    try {
      const config = createAxiosConfig();
      const payableInvoices = getPayableInvoices();
      let hasValidPayment = false;

      // Check if at least one payment is being made
      for (const invoice of payableInvoices) {
        if (paymentAmounts[invoice._id] > 0) {
          hasValidPayment = true;
          break;
        }
      }

      if (!hasValidPayment) {
        setBatchPaymentError("Please enter at least one payment amount.");
        setBatchPaymentLoading(false);
        return;
      }

      // Validate payment mode
      if (!batchPaymentData.paymentMode.trim()) {
        setBatchPaymentError("Payment mode is required.");
        setBatchPaymentLoading(false);
        return;
      }

      // Process each payment through the new payment API
      for (const invoice of payableInvoices) {
        const paymentAmount = paymentAmounts[invoice._id] || 0;

        if (paymentAmount > 0) {
          // Create payment data for the new payment API
          const paymentData = {
            invoice: invoice._id,
            paymentDate: batchPaymentData.paymentDate,
            paymentMode: batchPaymentData.paymentMode,
            transactionId: batchPaymentData.transactionId,
            amount: paymentAmount,
            notes: `Batch payment processed on ${new Date().toLocaleDateString()}`,
          };

          // Create payment using the new payment API
          await axios.post(
            `${API_BASE_URL}/admin/payments`,
            paymentData,
            config
          );
        }
      }

      // Refresh data
      fetchInvoices();
      setShowBatchPayment(false);
      setPaymentAmounts({});
      alert("Payments processed successfully!");
    } catch (err) {
      console.error("Error processing batch payments", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setBatchPaymentError(
        err.response?.data?.message ||
          "Error processing payments. Please try again."
      );
    }
    setBatchPaymentLoading(false);
  };

  // Export handler
  const handleExport = (type) => {
    if (!invoices.length) return;

    const exportData = invoices.map((i) => ({
      InvoiceNumber: i.invoiceNumber || "INV-" + i._id.slice(-6).toUpperCase(),
      Customer: i.customer,
      Amount: i.total,
      TotalTax: i.items
        ? i.items.reduce(
            (sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0),
            0
          )
        : 0,
      Project: i.reference || "-",
      Tags: i.tags || "-",
      Date: i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString() : "-",
      DueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "-",
      Reference: i.reference || "-",
      Status: i.status,
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
        link.setAttribute("download", "invoices.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Invoices");
        XLSXWriteFile(workbook, "invoices.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("invoices.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Invoices</title></head><body>"
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

  // Delete invoice
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    try {
      const config = createAxiosConfig();
      await axios.delete(`${API_BASE_URL}/admin/invoices/${id}`, config);
      setInvoices(invoices.filter((i) => i._id !== id));
      // Remove from selected if it was selected
      setSelectedInvoices(
        selectedInvoices.filter((invoiceId) => invoiceId !== id)
      );
      fetchInvoices(); // Refresh stats
    } catch (err) {
      console.error("Error deleting invoice", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Bulk delete invoices
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedInvoices.length} invoices?`
      )
    )
      return;
    try {
      const config = createAxiosConfig();
      await Promise.all(
        selectedInvoices.map((id) =>
          axios.delete(`${API_BASE_URL}/admin/invoices/${id}`, config)
        )
      );
      setInvoices(invoices.filter((i) => !selectedInvoices.includes(i._id)));
      setSelectedInvoices([]);
      alert("Selected invoices deleted successfully!");
    } catch (err) {
      console.error("Error deleting invoices", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting selected invoices.");
    }
  };

  // Update invoice
  const handleUpdate = async () => {
    try {
      const config = createAxiosConfig();
      await axios.put(
        `${API_BASE_URL}/admin/invoices/${editInvoice._id}`,
        formData,
        config
      );
      setEditInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error("Error updating invoice", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoiceNumber || "INV-" + invoice._id.slice(-6).toUpperCase())
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastInvoice = currentPage * entriesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - entriesPerPage;
  const currentInvoices = filteredInvoices.slice(
    indexOfFirstInvoice,
    indexOfLastInvoice
  );
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);

  if (loading)
    return (
      <div className="bg-gray-100 min-h-screen p-4">Loading invoices...</div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Invoices</span>
        </div>
      </div>

      {/* Stats Cards - All in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Invoices</p>
              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileInvoiceDollar className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold">{stats.paidInvoices}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaMoneyCheckAlt className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unpaid</p>
              <p className="text-2xl font-bold">{stats.unpaidInvoices}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaClock className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Partiallypaid Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Partiallypaid</p>
              <p className="text-2xl font-bold">
                {stats.partiallypaidInvoices}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-2xl font-bold">{stats.overdueInvoices}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaExclamationTriangle className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Draft Invoices */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">{stats.draftInvoices}</p>
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
            onClick={() => navigate("new")}
            className="px-3 py-1 text-sm rounded flex items-center gap-2"
            style={{ backgroundColor: "#333333", color: "white" }}
          >
            <FaPlus /> New Invoice
          </button>

          {/* Batch Payment Button */}
          <button
            onClick={() => {
              setShowBatchPayment(true);
              setBatchPaymentError("");
              setPaymentAmounts({});
            }}
            className="px-3 py-1 text-sm rounded flex items-center gap-2 bg-blue-600 text-white"
          >
            <FaMoneyCheckAlt /> Batch Payment
          </button>

          {/* Bulk delete button */}
          {selectedInvoices.length > 0 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedInvoices.length})
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

      {/* White box */}
      <div
        className={`bg-white shadow-md rounded p-4 transition-all duration-300 ${
          compactView ? "w-1/2" : "w-full"
        }`}
      >
        {/* Table controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="border px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                <HiOutlineDownload /> Export
              </button>
              {showExportMenu && (
                <div
                  ref={exportMenuRef}
                  className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10"
                >
                  {["Excel", "CSV", "PDF", "Print"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => handleExport(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={fetchInvoices}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search invoices..."
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
                      selectedInvoices.length === currentInvoices.length &&
                      currentInvoices.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(currentInvoices.map((i) => i._id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                  />
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Invoice#
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Amount
                </th>
                {compactView ? (
                  <>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
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
                      Total Tax
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Project
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
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Due Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Reference
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
              {currentInvoices.length > 0 ? (
                currentInvoices.map((invoice) => {
                  const displayInvoiceNumber =
                    invoice.invoiceNumber ||
                    "INV-" + invoice._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: invoice.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(invoice.total || 0);

                  const totalTax = invoice.items
                    ? invoice.items.reduce(
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
                      key={invoice._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice._id)}
                            onChange={() => toggleInvoiceSelection(invoice._id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0 ">{displayInvoiceNumber}</td>
                      <td className="p-3 border-0 ">{displayAmount}</td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">
                            {invoice.customer || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                invoice.status
                              )}`}
                            >
                              {invoice.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewInvoice(invoice)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => downloadInvoicePDF(invoice)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={() => {
                                  setEditInvoice(invoice);
                                  setFormData({
                                    customer: invoice.customer || "",
                                    status: invoice.status || "Draft",
                                  });
                                }}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-0 ">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: invoice.currency || "USD",
                              minimumFractionDigits: 2,
                            }).format(totalTax)}
                          </td>
                          <td className="p-3 border-0">
                            {invoice.customer || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {invoice.reference || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {invoice.tags || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="p-3 border-0">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="p-3 border-0">
                            {invoice.reference || "-"}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                invoice.status
                              )}`}
                            >
                              {invoice.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewInvoice(invoice)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => downloadInvoicePDF(invoice)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={() => {
                                  setEditInvoice(invoice);
                                  setFormData({
                                    customer: invoice.customer || "",
                                    status: invoice.status || "Draft",
                                  });
                                }}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <FaTrash />
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
                    colSpan={compactView ? 7 : 12}
                    className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                  >
                    {invoices.length === 0
                      ? "No invoices found. Create your first invoice!"
                      : "No invoices match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstInvoice + 1} to{" "}
              {Math.min(indexOfLastInvoice, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} entries
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
      {viewInvoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-11/12 max-w-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invoice Details</h2>
              <button
                onClick={() => setViewInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Invoice #:</p>
                <p>
                  {viewInvoice.invoiceNumber ||
                    "INV-" + viewInvoice._id.slice(-6).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="font-semibold">Customer:</p>
                <p>{viewInvoice.customer}</p>
              </div>
              <div>
                <p className="font-semibold">Reference:</p>
                <p>{viewInvoice.reference || "-"}</p>
              </div>
              <div>
                <p className="font-semibold">Amount:</p>
                <p>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: viewInvoice.currency || "USD",
                  }).format(viewInvoice.total)}
                </p>
              </div>
              <div>
                <p className="font-semibold">Status:</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(
                      viewInvoice.status
                    )}`}
                  >
                    {viewInvoice.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="font-semibold">Paid Amount:</p>
                <p>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: viewInvoice.currency || "USD",
                  }).format(viewInvoice.paidAmount || 0)}
                </p>
              </div>
              {viewInvoice.items && viewInvoice.items.length > 0 && (
                <div className="col-span-2">
                  <p className="font-semibold mb-2">Items:</p>
                  <div className="border rounded p-2">
                    {viewInvoice.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-1 border-b last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {item.rate}
                          </p>
                        </div>
                        <div>
                          <p>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: viewInvoice.currency || "USD",
                            }).format(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => downloadInvoicePDF(viewInvoice)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaDownload className="inline mr-2" /> Download PDF
              </button>
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editInvoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-11/12 max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Invoice</h2>
              <button
                onClick={() => setEditInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Customer</label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) =>
                  setFormData({ ...formData, customer: e.target.value })
                }
                className="border w-full p-2 rounded"
                placeholder="Customer Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="border w-full p-2 rounded"
              >
                <option value="Draft">Draft</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partiallypaid">Partiallypaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditInvoice(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Payment Modal */}
      {showBatchPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-11/12 max-w-5xl max-h-screen overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Batch Payment</h2>
              <button
                onClick={() => setShowBatchPayment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {batchPaymentError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
                {batchPaymentError}
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={batchPaymentData.paymentDate}
                  onChange={(e) =>
                    setBatchPaymentData({
                      ...batchPaymentData,
                      paymentDate: e.target.value,
                    })
                  }
                  className="border rounded w-full p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Mode *
                </label>
                <select
                  value={batchPaymentData.paymentMode}
                  onChange={(e) =>
                    setBatchPaymentData({
                      ...batchPaymentData,
                      paymentMode: e.target.value,
                    })
                  }
                  className="border rounded w-full p-2"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Stripe Checkout">Stripe Checkout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={batchPaymentData.transactionId}
                  onChange={(e) =>
                    setBatchPaymentData({
                      ...batchPaymentData,
                      transactionId: e.target.value,
                    })
                  }
                  className="border rounded w-full p-2"
                  placeholder="Transaction reference"
                />
              </div>
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={batchPaymentData.sendEmail}
                onChange={(e) =>
                  setBatchPaymentData({
                    ...batchPaymentData,
                    sendEmail: e.target.checked,
                  })
                }
                className="mr-2"
                id="sendEmail"
              />
              <label htmlFor="sendEmail" className="text-sm">
                Send invoice payment recorded email to customer contacts
              </label>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Invoices for Payment
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Invoice #</th>
                      <th className="p-2 border">Customer</th>
                      <th className="p-2 border">Total Amount</th>
                      <th className="p-2 border">Paid Amount</th>
                      <th className="p-2 border">Balance Due</th>
                      <th className="p-2 border">Payment Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPayableInvoices().map((invoice) => {
                      const paidAmount = invoice.paidAmount || 0;
                      const balanceDue = invoice.total - paidAmount;

                      return (
                        <tr key={invoice._id}>
                          <td className="p-2 border">
                            {invoice.invoiceNumber ||
                              "INV-" + invoice._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="p-2 border">{invoice.customer}</td>
                          <td className="p-2 border text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: invoice.currency || "USD",
                            }).format(invoice.total)}
                          </td>
                          <td className="p-2 border text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: invoice.currency || "USD",
                            }).format(paidAmount)}
                          </td>
                          <td className="p-2 border text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: invoice.currency || "USD",
                            }).format(balanceDue)}
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              min="0"
                              max={balanceDue}
                              step="0.01"
                              value={paymentAmounts[invoice._id] || ""}
                              onChange={(e) =>
                                handlePaymentAmountChange(
                                  invoice._id,
                                  e.target.value
                                )
                              }
                              className="border rounded p-1 w-full"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBatchPayment(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={processBatchPayments}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Process Payments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
