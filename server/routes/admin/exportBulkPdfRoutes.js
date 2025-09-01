import express from "express";
import { bulkPdfExport } from "../../controllers/admin/exportBulkPdfController.js";

const router = express.Router();

// Bulk PDF Export route
router.post("/export/bulk-pdf", bulkPdfExport);

export default router;