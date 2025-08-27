import express from "express";
import {
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  searchCustomers,
  bulkDeleteSupportTickets
} from "../../controllers/admin/supportController.js";

const router = express.Router();

// Support routes
router.route("/")
  .get(getSupportTickets)
  .post(createSupportTicket);

router.route("/bulk-delete")
  .post(bulkDeleteSupportTickets);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/:id")
  .put(updateSupportTicket)
  .delete(deleteSupportTicket);

export default router;
