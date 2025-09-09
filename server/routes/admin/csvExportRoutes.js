import express from "express";
import { exportToCSV } from "../../controllers/admin/csvExportController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// CSV Export route (protected with JWT middleware)
router.route("/:type")
  .get(protect, exportToCSV);

export default router;