import express from "express";
import { bulkPdfExport } from "../../controllers/admin/exportBulkPdfController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Bulk PDF Export route (protected with JWT middleware)
router.post("/export/bulk-pdf", protect, bulkPdfExport);

export default router;