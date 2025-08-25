import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  importProjects,
  searchCustomers
} from "../../controllers/admin/projectController.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Project routes
router.route("/")
  .get(getProjects)
  .post(createProject);

router.route("/import")
  .post(upload.single('file'), importProjects);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/:id")
  .put(updateProject)
  .delete(deleteProject);

export default router;