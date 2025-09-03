import express from "express";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  bulkDeleteGoals
} from "../../controllers/admin/goalController.js";

const router = express.Router();

router.route("/")
  .get(getGoals)
  .post(createGoal);

router.route("/bulk-delete")
  .post(bulkDeleteGoals);

router.route("/:id")
  .put(updateGoal)
  .delete(deleteGoal);

export default router;