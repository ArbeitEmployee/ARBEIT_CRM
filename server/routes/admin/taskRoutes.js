import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  importTasks,
  bulkDeleteTasks
} from "../../controllers/admin/taskController.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Task routes
router.route("/")
  .get(getTasks)
  .post(createTask);

router.route("/import")
  .post(upload.single('file'), importTasks);

router.route("/bulk-delete")
  .post(bulkDeleteTasks);

router.route("/:id")
  .put(updateTask)
  .delete(deleteTask);

export default router;

