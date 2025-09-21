// clientPaymentRoutes.js
import express from "express";
import { 
  getClientPayments, 
  getClientPayment, 
  recordPayment,
  getClientPaymentStats
} from "../../controllers/client/clientPaymentController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client payment routes (all protected with client JWT middleware)
router.route("/payments")
  .get(clientProtect, getClientPayments) // Get all payments for client
  .post(clientProtect, recordPayment); // Record a payment

router.route("/payments/stats")
  .get(clientProtect, getClientPaymentStats); // Get payment stats for client

router.route("/payments/:id")
  .get(clientProtect, getClientPayment); // Get single payment

export default router;