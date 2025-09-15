import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  importProjects,
  searchCustomers,
  getCustomerByCode
} from "../../controllers/admin/projectController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All project routes (protected with JWT middleware)
router.route("/")
  .get(protect, getProjects)
  .post(protect, createProject);

router.route("/import")
  .post(protect, upload.single('file'), importProjects);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/customers/by-code/:code")
  .get(protect, getCustomerByCode);

router.route("/:id")
  .put(protect, updateProject)
  .delete(protect, deleteProject);

export default router;