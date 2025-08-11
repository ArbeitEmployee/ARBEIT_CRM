import express from "express";
import {
  registerClient,
  loginClient,
  forgotPassword,
  verifyResetCode,
  resetPassword
} from "../../controllers/client/authController.js";

const router = express.Router();

router.post("/register", registerClient);
router.post("/login", loginClient);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;