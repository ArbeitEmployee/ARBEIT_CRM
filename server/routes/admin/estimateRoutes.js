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
router.post("/estimates", createEstimate);         // Insert
router.get("/estimates", getEstimates);            // View all
router.get("/estimates/:id", getEstimateById);      // View single
router.put("/estimates/:id", updateEstimate);       // Update
router.delete("/estimates/:id", deleteEstimate);    // Delete

export default router;