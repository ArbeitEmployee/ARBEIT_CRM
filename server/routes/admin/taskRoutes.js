import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  importTasks,
  bulkDeleteTasks
} from "../../controllers/admin/taskController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All task routes (protected with JWT middleware)
router.route("/")
  .get(protect, getTasks)
  .post(protect, createTask);

router.route("/import")
  .post(protect, upload.single('file'), importTasks);

router.route("/bulk-delete")
  .post(protect, bulkDeleteTasks);

router.route("/:id")
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;