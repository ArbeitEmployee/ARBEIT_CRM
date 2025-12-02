import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import adminAuthRoutes from "./routes/admin/authRoutes.js";
import clientAuthRoutes from "./routes/client/authRoutes.js";
import customerRoutes from "./routes/admin/customerRoutes.js";
import staffRoutes from "./routes/admin/staffRoutes.js"; // ADMIN staff management
import itemRoutes from "./routes/admin/itemRoutes.js";
import proposalRoutes from "./routes/admin/proposalRoutes.js";
import estimateRoutes from "./routes/admin/estimateRoutes.js";
import invoiceRoutes from "./routes/admin/invoiceRoutes.js";
import paymentRoutes from "./routes/admin/paymentRoutes.js";
import documentTemplateRoutes from "./routes/admin/documentTemplateRoutes.js";
import creditNoteRoutes from "./routes/admin/creditNoteRoutes.js";
import subscriptionRoutes from "./routes/admin/subscriptionRoutes.js";
import expenseRoutes from "./routes/admin/expenseRoutes.js";
import contactRoutes from "./routes/admin/contactRoutes.js";
import projectRoutes from "./routes/admin/projectRoutes.js";
import taskRoutes from "./routes/admin/taskRoutes.js";
import knowledgeBaseRoutes from "./routes/admin/knowledgeBaseRoutes.js";
import leadRoutes from "./routes/admin/leadRoutes.js";
import supportRoutes from "./routes/admin/supportRoutes.js";
import estimateRequestRoutes from "./routes/admin/estimateRequestRoutes.js";
import reportLeadRoutes from "./routes/admin/reportLeadRoutes.js";
import clientKnowledgeBaseRoutes from "./routes/client/clientKnowledgeBaseRoutes.js";
import exportBulkPdfRoutes from "./routes/admin/exportBulkPdfRoutes.js";
import csvExportRoutes from "./routes/admin/csvExportRoutes.js";
import eventRoutes from "./routes/admin/eventRoutes.js";
import announcementRoutes from "./routes/admin/announcementRoutes.js";
import goalsRoutes from "./routes/admin/goalRoutes.js";
import clientProjectRoutes from "./routes/client/clientProjectRoutes.js";
import clientContactRoutes from "./routes/client/clientContactRoutes.js";
import clientEstimateRequestRoutes from "./routes/client/clientEstimateRequestRoutes.js";
import clientSupportRoutes from "./routes/client/clientSupportRoutes.js";
import clientProposalRoutes from "./routes/client/clientProposalRoutes.js";
import clientEstimateRoutes from "./routes/client/clientEstimateRoutes.js";
import clientInvoiceRoutes from "./routes/client/clientInvoiceRoutes.js";
import clientPaymentRoutes from "./routes/client/clientPaymentRoutes.js";
import staffAuthRoutes from "./routes/staff/staffAuthRoutes.js";

// Connect to database first
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/client", clientAuthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/staff", staffAuthRoutes);
app.use("/api/staffs", staffRoutes); // Admin staff management
app.use("/api/admin", itemRoutes);
app.use("/api/admin", proposalRoutes);
app.use("/api/admin/document-templates", documentTemplateRoutes);
app.use("/api/admin", estimateRoutes);
app.use("/api/admin", invoiceRoutes);
app.use("/api/admin", paymentRoutes);
app.use("/api/admin", creditNoteRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/estimate-requests", estimateRequestRoutes);
app.use("/api/reports", reportLeadRoutes);
app.use("/api/admin", exportBulkPdfRoutes);
app.use("/api/csvexport", csvExportRoutes);
app.use("/api/admin/events", eventRoutes);
app.use("/api/admin/announcements", announcementRoutes);
app.use("/api/admin/goals", goalsRoutes);

// Client routes
app.use("/api/client/knowledge-base", clientKnowledgeBaseRoutes);
app.use("/api/client/projects", clientProjectRoutes);
app.use("/api/client/contacts", clientContactRoutes);
app.use("/api/client/estimate-requests", clientEstimateRequestRoutes);
app.use("/api/client/support", clientSupportRoutes);
app.use("/api/client", clientProposalRoutes);
app.use("/api/client", clientEstimateRoutes);
app.use("/api/client", clientInvoiceRoutes);
app.use("/api/client", clientPaymentRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running with Cloudinary integration",
    timestamp: new Date().toISOString(),
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME
      ? "Configured"
      : "Not configured",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `☁️  Cloudinary integration: ${
      process.env.CLOUDINARY_CLOUD_NAME ? "Enabled" : "Disabled"
    }`
  );
  console.log(`📄 API Documentation: http://localhost:${PORT}/api/health`);
});
