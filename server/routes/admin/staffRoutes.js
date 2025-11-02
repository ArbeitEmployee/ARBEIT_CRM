// server/routes/admin/staffRoutes.js
import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  getStaffs,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  importStaffs,
  getStaffTasks,
  updateTaskStatus,
  getStaffProfile,
  updateStaffProfile,
} from "../../controllers/admin/staffController.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ All staff routes (protected with JWT middleware)
router.get("/", protect, getStaffs); // GET all staffs
router.get("/:id", protect, getStaffById); // GET staff by ID
router.post("/", protect, createStaff); // CREATE staff
router.put("/:id", protect, updateStaff); // UPDATE staff
router.patch("/:id/toggle-active", protect, toggleStaffActive); // TOGGLE active status
router.delete("/:id", protect, deleteStaff); // DELETE staff
router.post("/import", protect, upload.single("file"), importStaffs); // IMPORT staffs

// ✅ Staff-specific routes (for staff dashboard access)
router.get("/:id/tasks", protect, getStaffTasks); // GET staff's assigned tasks
router.put("/:id/tasks/:taskId", protect, updateTaskStatus); // UPDATE task status
router.get("/:id/profile", protect, getStaffProfile); // GET staff profile
router.put("/:id/profile", protect, updateStaffProfile); // UPDATE staff profile
export default router;
