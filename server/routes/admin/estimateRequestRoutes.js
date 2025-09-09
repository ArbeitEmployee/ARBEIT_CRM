import express from "express";
import {
  getEstimateRequests,
  createEstimateRequest,
  updateEstimateRequest,
  deleteEstimateRequest,
  bulkDeleteEstimateRequests,
  searchCustomers
} from "../../controllers/admin/estimateRequestController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All estimate request routes (protected with JWT middleware)
router.route("/")
  .get(protect, getEstimateRequests)
  .post(protect, createEstimateRequest);

router.route("/bulk-delete")
  .post(protect, bulkDeleteEstimateRequests);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/:id")
  .put(protect, updateEstimateRequest)
  .delete(protect, deleteEstimateRequest);

export default router;