import express from "express";
import {
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  searchCustomers,
  bulkDeleteSupportTickets
} from "../../controllers/admin/supportController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All support routes (protected with JWT middleware)
router.route("/")
  .get(protect, getSupportTickets)
  .post(protect, createSupportTicket);

router.route("/bulk-delete")
  .post(protect, bulkDeleteSupportTickets);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/:id")
  .put(protect, updateSupportTicket)
  .delete(protect, deleteSupportTicket);

export default router;