import Invoice from "../../models/Invoice.js";
import Estimate from "../../models/Estimate.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Bulk PDF Export Controller
export const bulkPdfExport = async (req, res) => {
  try {
    const { type, startDate, endDate, tag } = req.body;

    // Validate required fields
    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Type, start date, and end date are required"
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date"
      });
    }

    // Determine which model to use
    const Model = type === "invoice" ? Invoice : Estimate;
    const docType = type === "invoice" ? "Invoice" : "Estimate";

    // Build query
    const query = {
      createdAt: {
        $gte: start,
        $lte: new Date(end.getTime() + 24 * 60 * 60 * 1000) // Include the entire end date
      }
    };

    // Add tag filter if provided
    if (tag && tag.trim() !== "") {
      query.tags = { $regex: tag, $options: "i" };
    }

    // Fetch documents
    const documents = await Model.find(query)
      .sort({ createdAt: 1 })
      .lean();

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${type}s found for the selected criteria`
      });
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Bulk ${docType} Export`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 22);
    if (tag) {
      doc.text(`Tag Filter: ${tag}`, 14, 29);
    }

    // Prepare table data
    const tableData = documents.map((doc) => {
      if (type === "invoice") {
        return [
          doc.invoiceNumber || "N/A",
          doc.customer || "N/A",
          doc.reference || "N/A",
          `$${doc.total?.toFixed(2) || "0.00"}`,
          doc.status || "N/A",
          doc.invoiceDate ? new Date(doc.invoiceDate).toLocaleDateString() : "N/A",
          doc.tags || "N/A"
        ];
      } else {
        return [
          doc.estimateNumber || "N/A",
          doc.customer || "N/A",
          doc.reference || "N/A",
          `$${doc.total?.toFixed(2) || "0.00"}`,
          doc.status || "N/A",
          doc.estimateDate ? new Date(doc.estimateDate).toLocaleDateString() : "N/A",
          doc.tags || "N/A"
        ];
      }
    });

    // Define table columns
    const headers = type === "invoice" 
      ? [["Invoice #", "Customer", "Reference", "Amount", "Status", "Date", "Tags"]]
      : [["Estimate #", "Customer", "Reference", "Amount", "Status", "Date", "Tags"]];

    // Add table to PDF
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total ${type}s: ${documents.length}`, 14, finalY);
    
    const totalAmount = documents.reduce((sum, doc) => sum + (doc.total || 0), 0);
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, finalY + 7);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${type}_export.pdf`);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Bulk PDF export error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during PDF export"
    });
  }
};