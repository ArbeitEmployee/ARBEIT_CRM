import express from "express";
import {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
} from "../../controllers/admin/estimateController.js";

const router = express.Router();

// CRUD Routes
router.post("/", createEstimate);         // Insert
router.get("/", getEstimates);            // View all
router.get("/:id", getEstimateById);      // View single
router.put("/:id", updateEstimate);       // Update
router.delete("/:id", deleteEstimate);    // Delete

export default router;
