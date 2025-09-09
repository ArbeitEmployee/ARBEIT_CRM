import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
} from "../../controllers/admin/invoiceController.js";

const router = express.Router();

// All invoice routes are protected and admin-specific
router.get("/invoices", protect, getInvoices);            // View all invoices for admin
router.get("/invoices/stats", protect, getInvoiceStats);   // Get stats for admin
router.get("/invoices/:id", protect, getInvoiceById);      // View single invoice for admin
router.post("/invoices", protect, createInvoice);         // Create invoice for admin
router.put("/invoices/:id", protect, updateInvoice);       // Update invoice for admin
router.delete("/invoices/:id", protect, deleteInvoice);    // Delete invoice for admin

export default router;