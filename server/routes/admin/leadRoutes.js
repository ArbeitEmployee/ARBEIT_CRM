import express from "express";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  importLeads,
  bulkDeleteLeads
} from "../../controllers/admin/leadController.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Lead routes
router.route("/")
  .get(getLeads)
  .post(createLead);

router.route("/import")
  .post(upload.single('file'), importLeads);

router.route("/bulk-delete")
  .post(bulkDeleteLeads);

router.route("/:id")
  .put(updateLead)
  .delete(deleteLead);

export default router;