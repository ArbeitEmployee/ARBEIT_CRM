import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getEstimateStats
} from "../../controllers/admin/estimateController.js";

const router = express.Router();

// All estimate routes are protected and admin-specific
router.get("/estimates", protect, getEstimates);            // View all estimates for admin
router.get("/estimates/stats", protect, getEstimateStats);   // Get stats for admin
router.get("/estimates/:id", protect, getEstimateById);      // View single estimate for admin
router.post("/estimates", protect, createEstimate);         // Create estimate for admin
router.put("/estimates/:id", protect, updateEstimate);       // Update estimate for admin
router.delete("/estimates/:id", protect, deleteEstimate);    // Delete estimate for admin

export default router;