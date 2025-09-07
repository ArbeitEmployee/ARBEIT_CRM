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
  importStaffs
} from "../../controllers/admin/staffController.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ All staff routes (protected with JWT middleware)
router.get("/", protect, getStaffs);           // GET all staffs
router.get("/:id", protect, getStaffById);     // GET staff by ID
router.post("/", protect, createStaff);        // CREATE staff
router.put("/:id", protect, updateStaff);      // UPDATE staff
router.patch("/:id/toggle-active", protect, toggleStaffActive); // TOGGLE active status
router.delete("/:id", protect, deleteStaff);   // DELETE staff
router.post("/import", protect, upload.single('file'), importStaffs); // IMPORT staffs

export default router;