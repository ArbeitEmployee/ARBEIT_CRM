import express from "express";
import {
  registerStaff,
  loginStaff,
  staffForgotPassword,
  staffVerifyResetCode,
  staffResetPassword,
  staffChangePassword,
  getStaffProfile,
  updateStaffProfile,
} from "../../controllers/staff/staffAuthController.js";
import { staffProtect } from "../../middlewares/staffAuth.js";

const router = express.Router();

// Public routes
router.post("/register", registerStaff);
router.post("/login", loginStaff);
router.post("/forgot-password", staffForgotPassword);
router.post("/verify-reset-code", staffVerifyResetCode);
router.post("/reset-password", staffResetPassword);

// Protected routes (require staff authentication)
router.put("/change-password", staffProtect, staffChangePassword);
router.get("/profile", staffProtect, getStaffProfile);
router.put("/profile", staffProtect, updateStaffProfile);

export default router;
