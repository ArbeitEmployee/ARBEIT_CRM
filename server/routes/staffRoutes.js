import express from "express";
//import { staffProtect } from "../middlewares/staffAuth.js";
import {
  getStaffTasks,
  updateTaskStatus,
  getStaffProfile,
  updateStaffProfile,
} from "../controllers/admin/staffController.js";
import { staffProtect } from "../middlewares/staffAuth.js";

const router = express.Router();

// All routes protected with staff authentication
router.get("/:id/tasks", staffProtect, getStaffTasks);
router.put("/:id/tasks/:taskId", staffProtect, updateTaskStatus);
router.get("/:id/profile", staffProtect, getStaffProfile);
router.put("/:id/profile", staffProtect, updateStaffProfile);

export default router;
