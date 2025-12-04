/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaChevronRight,
  FaTimes,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaEye,
  FaDownload,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CreditNotes = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);
  const [viewCreditNote, setViewCreditNote] = useState(null);
  const [editCreditNote, setEditCreditNote] = useState(null);
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

  // Fetch credit notes for the logged-in admin only
  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/credit-notes`,
        config
      );

      // Ensure we're getting the data in the correct format
      if (data.data) {
        setCreditNotes(data.data); // If response has data property
      } else if (Array.isArray(data)) {
        setCreditNotes(data); // If response is directly an array
      } else {
        console.error("Unexpected API response format:", data);
        setCreditNotes([]);
      }
    } catch (err) {
      console.error("Error fetching credit notes", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setCreditNotes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreditNotes();
    fetchTemplate();
  }, []);

  // Generate and download credit note PDF
  const downloadCreditNotePDF = async (creditNote) => {
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
      doc.text("CREDIT NOTE", pageWidth / 2, margin + 15, { align: "center" });

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

      // Credit Note Details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Credit Note: ${creditNote.reference || "Untitled Credit Note"}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Credit Note Number and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const formatCreditNoteNumber = (num) => {
        if (!num) return "CN-" + creditNote._id.slice(-6).toUpperCase();
        if (num.startsWith("CN-")) return num;
        const matches = num.match(/\d+/);
        const numberPart = matches ? matches[0] : "000001";
        return `CN-${String(numberPart).padStart(6, "0")}`;
      };

      const creditNoteNumber = formatCreditNoteNumber(
        creditNote.creditNoteNumber
      );

      doc.text(`Credit Note #: ${creditNoteNumber}`, margin, yPosition);
      doc.text(
        `Date: ${new Date(
          creditNote.creditNoteDate || Date.now()
        ).toLocaleDateString()}`,
        pageWidth / 2,
        yPosition
      );
      yPosition += 8;

      doc.text(`Status: ${creditNote.status || "Draft"}`, margin, yPosition);
      yPosition += 15;

      // Customer Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Information:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Customer: ${creditNote.customer || "Not specified"}`,
        margin,
        yPosition
      );
      yPosition += 5;

      if (creditNote.email) {
        doc.text(`Email: ${creditNote.email}`, margin, yPosition);
        yPosition += 5;
      }

      if (creditNote.phone) {
        doc.text(`Phone: ${creditNote.phone}`, margin, yPosition);
        yPosition += 5;
      }

      // Address if available
      if (
        creditNote.address ||
        creditNote.city ||
        creditNote.state ||
        creditNote.country
      ) {
        const addressParts = [];
        if (creditNote.address) addressParts.push(creditNote.address);
        if (creditNote.city) addressParts.push(creditNote.city);
        if (creditNote.state) addressParts.push(creditNote.state);
        if (creditNote.country) addressParts.push(creditNote.country);
        if (creditNote.zip) addressParts.push(`ZIP: ${creditNote.zip}`);

        if (addressParts.length > 0) {
          doc.text(`Address: ${addressParts.join(", ")}`, margin, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 10;

      // Items Table
      if (creditNote.items && creditNote.items.length > 0) {
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

        const tableRows = creditNote.items.map((item, index) => {
          const subtotal = (item.quantity || 1) * (item.rate || 0);
          const taxAmount =
            (((item.tax1 || 0) + (item.tax2 || 0)) * subtotal) / 100;
          const total = subtotal + taxAmount;

          return {
            index: index + 1,
            description: item.description || "Item",
            quantity: item.quantity || 1,
            rate: `${creditNote.currency || "USD"} ${(item.rate || 0).toFixed(
              2
            )}`,
            tax: `${(item.tax1 || 0) + (item.tax2 || 0)}%`,
            amount: `${creditNote.currency || "USD"} ${total.toFixed(2)}`,
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
        creditNote.items?.reduce(
          (sum, item) => sum + (item.quantity || 1) * (item.rate || 0),
          0
        ) || 0;

      const totalTax =
        creditNote.items?.reduce((sum, item) => {
          const itemSubtotal = (item.quantity || 1) * (item.rate || 0);
          const taxRate = (item.tax1 || 0) + (item.tax2 || 0);
          return sum + (itemSubtotal * taxRate) / 100;
        }, 0) || 0;

      const discount = creditNote.discount || 0;
      const total = creditNote.total || subtotal + totalTax - discount;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Right align calculations
      const calcX = pageWidth - margin - 60;

      doc.text("Subtotal:", calcX, yPosition);
      doc.text(
        `${creditNote.currency || "USD"} ${subtotal.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (totalTax > 0) {
        doc.text("Tax:", calcX, yPosition);
        doc.text(
          `${creditNote.currency || "USD"} ${totalTax.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      if (discount > 0) {
        doc.text("Discount:", calcX, yPosition);
        doc.text(
          `- ${creditNote.currency || "USD"} ${discount.toFixed(2)}`,
          pageWidth - margin,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Credit Amount:", calcX, yPosition);
      doc.text(
        `${creditNote.currency || "USD"} ${total.toFixed(2)}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 15;

      // Credit Note Status
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Credit Note Status:", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const statusColor = getStatusColor(creditNote.status);
      doc.text(`• ${creditNote.status || "Draft"}`, margin, yPosition);
      yPosition += 8;

      // Reason for Credit Note
      if (creditNote.reason) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Reason for Credit Note:", margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const reason = doc.splitTextToSize(
          creditNote.reason || "Not specified",
          contentWidth - 10
        );
        reason.forEach((line) => {
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
        "This credit note can be used against future invoices or refunded as per company policy.",
        margin,
        yPosition
      );
      yPosition += 5;

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

      // Signature line
      const signatureY = footerY - 40;
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

      // Save the PDF
      const fileName = `Credit_Note_${creditNoteNumber}_${
        creditNote.customer?.replace(/[^a-z0-9]/gi, "_") || "Customer"
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Toggle credit note selection
  const toggleCreditNoteSelection = (id) => {
    if (selectedCreditNotes.includes(id)) {
      setSelectedCreditNotes(
        selectedCreditNotes.filter((creditNoteId) => creditNoteId !== id)
      );
    } else {
      setSelectedCreditNotes([...selectedCreditNotes, id]);
    }
  };

  // Export handler
  const handleExport = (type) => {
    if (!creditNotes.length) return;

    const exportData = creditNotes.map((cn) => ({
      CreditNoteNumber:
        cn.creditNoteNumber || "CN-" + cn._id.slice(-6).toUpperCase(),
      Customer: cn.customer,
      Amount: cn.total,
      CreditNoteDate: cn.creditNoteDate
        ? new Date(cn.creditNoteDate).toLocaleDateString()
        : "-",
      Status: cn.status,
      Reference: cn.reference || "-",
      Project: cn.project || "-",
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
        link.setAttribute("download", "credit_notes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, "Credit Notes");
        XLSXWriteFile(workbook, "credit_notes.xlsx");
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save("credit_notes.pdf");
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          "<html><head><title>Credit Notes</title></head><body>"
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

  // Delete credit note
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this credit note?"))
      return;
    try {
      const config = createAxiosConfig();
      await axios.delete(`${API_BASE_URL}/admin/credit-notes/${id}`, config);
      setCreditNotes(creditNotes.filter((cn) => cn._id !== id));
      // Remove from selected if it was selected
      setSelectedCreditNotes(
        selectedCreditNotes.filter((creditNoteId) => creditNoteId !== id)
      );
    } catch (err) {
      console.error("Error deleting credit note", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Bulk delete credit notes
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCreditNotes.length} credit notes?`
      )
    )
      return;
    try {
      const config = createAxiosConfig();
      await Promise.all(
        selectedCreditNotes.map((id) =>
          axios.delete(`${API_BASE_URL}/admin/credit-notes/${id}`, config)
        )
      );
      setCreditNotes(
        creditNotes.filter((cn) => !selectedCreditNotes.includes(cn._id))
      );
      setSelectedCreditNotes([]);
      alert("Selected credit notes deleted successfully!");
    } catch (err) {
      console.error("Error deleting credit notes", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      alert("Error deleting selected credit notes.");
    }
  };

  // Update credit note
  const handleUpdate = async () => {
    try {
      const config = createAxiosConfig();
      await axios.put(
        `${API_BASE_URL}/admin/credit-notes/${editCreditNote._id}`,
        formData,
        config
      );
      setEditCreditNote(null);
      fetchCreditNotes();
    } catch (err) {
      console.error("Error updating credit note", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
  };

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter(
    (creditNote) =>
      creditNote.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (
        creditNote.creditNoteNumber ||
        "CN-" + creditNote._id.slice(-6).toUpperCase()
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      creditNote.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastCreditNote = currentPage * entriesPerPage;
  const indexOfFirstCreditNote = indexOfLastCreditNote - entriesPerPage;
  const currentCreditNotes = filteredCreditNotes.slice(
    indexOfFirstCreditNote,
    indexOfLastCreditNote
  );
  const totalPages = Math.ceil(filteredCreditNotes.length / entriesPerPage);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Issued":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="bg-gray-100 min-h-screen p-4">
        Loading credit notes...
      </div>
    );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Credit Notes</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Credit Notes</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Credit Notes */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Credit Notes</p>
              <p className="text-2xl font-bold">{creditNotes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Draft Credit Notes */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Draft</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Draft").length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaEdit className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Pending Credit Notes */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Pending").length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEye className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Issued Credit Notes */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Issued</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Issued").length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaEye className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Cancelled Credit Notes */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Cancelled</p>
              <p className="text-2xl font-bold">
                {creditNotes.filter((cn) => cn.status === "Cancelled").length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-600" />
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
            onClick={() => navigate("/admin/sales/credit-notes/new")}
          >
            <FaPlus /> New Credit Note
          </button>

          {/* Bulk delete button */}
          {selectedCreditNotes.length > 0 && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedCreditNotes.length})
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
              onClick={fetchCreditNotes}
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
                      selectedCreditNotes.length ===
                        currentCreditNotes.length &&
                      currentCreditNotes.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCreditNotes(
                          currentCreditNotes.map((c) => c._id)
                        );
                      } else {
                        setSelectedCreditNotes([]);
                      }
                    }}
                  />
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Credit Note#
                </th>
                <th
                  className="p-3"
                  style={{ backgroundColor: "#333333", color: "white" }}
                >
                  Customer
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
                      Project
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
              {currentCreditNotes.length > 0 ? (
                currentCreditNotes.map((creditNote) => {
                  const displayCreditNoteNumber =
                    creditNote.creditNoteNumber ||
                    "CN-" + creditNote._id.slice(-6).toUpperCase();

                  const displayAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: creditNote.currency || "USD",
                    minimumFractionDigits: 2,
                  }).format(creditNote.total || 0);

                  const formatDate = (dateString) => {
                    if (!dateString) return "-";
                    const date = new Date(dateString);
                    return isNaN(date.getTime())
                      ? "-"
                      : date.toLocaleDateString();
                  };

                  return (
                    <tr
                      key={creditNote._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: "black" }}
                    >
                      <td className="p-3 rounded-l-lg border-0">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCreditNotes.includes(
                              creditNote._id
                            )}
                            onChange={() =>
                              toggleCreditNoteSelection(creditNote._id)
                            }
                            className="h-4 w-4"
                          />
                        </div>
                      </td>
                      <td className="p-3 border-0 ">
                        {displayCreditNoteNumber}
                      </td>
                      <td className="p-3 border-0">
                        {creditNote.customer || "-"}
                      </td>
                      {compactView ? (
                        <>
                          <td className="p-3 border-0">{displayAmount}</td>
                          <td className="p-3 border-0">
                            {formatDate(creditNote.creditNoteDate)}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                creditNote.status
                              )}`}
                            >
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewCreditNote(creditNote)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  downloadCreditNotePDF(creditNote)
                                }
                                className="text-green-500 hover:text-green-700"
                                title="Download"
                              >
                                <FaDownload size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditCreditNote(creditNote);
                                  setFormData({
                                    customer: creditNote.customer || "",
                                    status: creditNote.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(creditNote._id)}
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
                          <td className="p-3 border-0">
                            {creditNote.project || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {creditNote.reference || "-"}
                          </td>
                          <td className="p-3 border-0">{displayAmount}</td>
                          <td className="p-3 border-0">
                            {formatDate(creditNote.creditNoteDate)}
                          </td>
                          <td className="p-3 border-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                creditNote.status
                              )}`}
                            >
                              {creditNote.status || "Draft"}
                            </span>
                          </td>
                          <td className="p-3 rounded-r-lg border-0">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewCreditNote(creditNote)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  downloadCreditNotePDF(creditNote)
                                }
                                className="text-green-500 hover:text-green-700"
                                title="Download"
                              >
                                <FaDownload size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditCreditNote(creditNote);
                                  setFormData({
                                    customer: creditNote.customer || "",
                                    status: creditNote.status || "Draft",
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(creditNote._id)}
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
                    colSpan={compactView ? 7 : 9}
                    className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                  >
                    {creditNotes.length === 0
                      ? "No credit notes found. Create your first credit note!"
                      : "No credit notes match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCreditNotes.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {indexOfFirstCreditNote + 1} to{" "}
              {Math.min(indexOfLastCreditNote, filteredCreditNotes.length)} of{" "}
              {filteredCreditNotes.length} entries
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
      {viewCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Credit Note Details</h2>
              <button
                onClick={() => setViewCreditNote(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <b>Credit Note #:</b>{" "}
                {viewCreditNote.creditNoteNumber ||
                  "CN-" + viewCreditNote._id.slice(-6).toUpperCase()}
              </p>
              <p>
                <b>Customer:</b> {viewCreditNote.customer || "-"}
              </p>
              <p>
                <b>Reference:</b> {viewCreditNote.reference || "-"}
              </p>
              <p>
                <b>Amount:</b>{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: viewCreditNote.currency || "USD",
                  minimumFractionDigits: 2,
                }).format(viewCreditNote.total || 0)}
              </p>
              <p>
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                    viewCreditNote.status
                  )}`}
                >
                  {viewCreditNote.status || "Draft"}
                </span>
              </p>
              {viewCreditNote.creditNoteDate && (
                <p>
                  <b>Date:</b>{" "}
                  {new Date(viewCreditNote.creditNoteDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => downloadCreditNotePDF(viewCreditNote)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaDownload className="inline mr-2" /> Download PDF
              </button>
              <button
                onClick={() => setViewCreditNote(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editCreditNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Credit Note</h2>
              <button
                onClick={() => setEditCreditNote(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="Customer Name"
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
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Issued">Issued</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditCreditNote(null)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-black text-white rounded text-sm"
              >
                Update Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNotes;
