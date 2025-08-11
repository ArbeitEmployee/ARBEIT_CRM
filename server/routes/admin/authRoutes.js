import express from "express";
import {
  registerAdmin,
  loginAdmin,
  forgotPassword,
   verifyResetCode,
  resetPassword
} from "../../controllers/admin/authController.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
