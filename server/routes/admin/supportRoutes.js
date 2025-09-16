import express from "express";
import {
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  searchCustomers,
  bulkDeleteSupportTickets,
  getCustomerByCode,
  importSupportTickets
} from "../../controllers/admin/supportController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All support routes (protected with JWT middleware)
router.route("/")
  .get(protect, getSupportTickets)
  .post(protect, createSupportTicket);

router.route("/import")
  .post(protect, upload.single('file'), importSupportTickets);

router.route("/bulk-delete")
  .post(protect, bulkDeleteSupportTickets);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/customers/by-code/:code")
  .get(protect, getCustomerByCode);

router.route("/:id")
  .put(protect, updateSupportTicket)
  .delete(protect, deleteSupportTicket);

export default router;