import express from "express";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  importLeads,
  bulkDeleteLeads
} from "../../controllers/admin/leadController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All lead routes (protected with JWT middleware)
router.route("/")
  .get(protect, getLeads)
  .post(protect, createLead);

router.route("/import")
  .post(protect, upload.single('file'), importLeads);

router.route("/bulk-delete")
  .post(protect, bulkDeleteLeads);

router.route("/:id")
  .put(protect, updateLead)
  .delete(protect, deleteLead);

export default router;