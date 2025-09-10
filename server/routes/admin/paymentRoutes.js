import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStats,
  getPaymentsByInvoice
} from "../../controllers/admin/paymentController.js";

const router = express.Router();

// All payment routes are protected and admin-specific
router.get("/payments", protect, getPayments);            // View all payments for admin
router.get("/payments/stats", protect, getPaymentStats);   // Get stats for admin
router.get("/payments/invoice/:invoiceId", protect, getPaymentsByInvoice); // Get payments for a specific invoice
router.get("/payments/:id", protect, getPaymentById);      // View single payment for admin
router.post("/payments", protect, createPayment);         // Create payment for admin
router.put("/payments/:id", protect, updatePayment);       // Update payment for admin
router.delete("/payments/:id", protect, deletePayment);    // Delete payment for admin

export default router;