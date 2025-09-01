import express from "express";
import { exportToCSV } from "../../controllers/admin/csvExportController.js";

const router = express.Router();

// CSV Export route
router.route("/:type")
  .get(exportToCSV);

export default router;