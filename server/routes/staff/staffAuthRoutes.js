// routes/staffAuthRoutes.js - NEW FILE
import express from "express";
import {
  staffRegister,
  staffLogin,
  validateStaffCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../controllers/staff/staffAuthController.js";

const router = express.Router();

// Public routes
router.post("/register", staffRegister);
router.post("/login", staffLogin);
router.post("/validate-code", validateStaffCode);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
