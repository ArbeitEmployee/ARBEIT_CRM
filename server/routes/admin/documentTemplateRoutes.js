import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  getActiveTemplate,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from "../../controllers/admin/documentTemplateController.js";

const router = express.Router();

// All template routes (protected with JWT middleware)
router.get("/active", protect, getActiveTemplate);
router.get("/", protect, getTemplates);
router.get("/:id", protect, getTemplateById);
router.post("/", protect, createTemplate);
router.put("/:id", protect, updateTemplate);
router.delete("/:id", protect, deleteTemplate);
router.put("/:id/set-default", protect, setDefaultTemplate);

export default router;
