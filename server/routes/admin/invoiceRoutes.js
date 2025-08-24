import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../../controllers/admin/invoiceController.js";

const router = express.Router();

// CRUD Routes
router.post("/invoices", createInvoice);        // Insert
router.get("/invoices", getInvoices);           // View all
router.get("/invoices/:id", getInvoiceById);    // View single
router.put("/invoices/:id", updateInvoice);     // Update
router.delete("/invoices/:id", deleteInvoice);  // Delete

export default router;
