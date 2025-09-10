import express from "express";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  bulkDeleteGoals
} from "../../controllers/admin/goalController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All routes are protected and only accessible to admins
router.route("/")
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route("/bulk-delete")
  .post(protect, bulkDeleteGoals);

router.route("/:id")
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);

export default router;