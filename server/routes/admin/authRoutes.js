import express from "express";
import {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getAllAdmins,
  updateAdminStatus,
  updateAdmin,
  deleteAdmin
} from "../../controllers/admin/authController.js";

import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// SuperAdmin protected routes
router.get("/", protect, (req, res, next) => {
  if (req.admin.role !== "superAdmin") return res.status(403).json({ message: "Forbidden" });
  next();
}, getAllAdmins);

router.put("/update-status", protect, (req, res, next) => {
  if (req.admin.role !== "superAdmin") return res.status(403).json({ message: "Only superAdmin can update status" });
  next();
}, updateAdminStatus);

router.put("/:adminId", protect, (req, res, next) => {
  if (req.admin.role !== "superAdmin") return res.status(403).json({ message: "Only superAdmin can update admin" });
  next();
}, updateAdmin);

router.delete("/:adminId", protect, (req, res, next) => {
  if (req.admin.role !== "superAdmin") return res.status(403).json({ message: "Only superAdmin can delete admin" });
  next();
}, deleteAdmin);

export default router;
