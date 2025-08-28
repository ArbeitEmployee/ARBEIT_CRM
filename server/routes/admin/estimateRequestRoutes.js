// FileName: estimateRequestRoutes.js
import express from "express";
import {
  getEstimateRequests,
  createEstimateRequest,
  updateEstimateRequest,
  deleteEstimateRequest,
  bulkDeleteEstimateRequests,
  searchCustomers
} from "../../controllers/admin/estimateRequestController.js";

const router = express.Router();

// Estimate request routes
router.route("/")
  .get(getEstimateRequests)
  .post(createEstimateRequest);

router.route("/bulk-delete")
  .post(bulkDeleteEstimateRequests);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/:id")
  .put(updateEstimateRequest)
  .delete(deleteEstimateRequest);

export default router;
