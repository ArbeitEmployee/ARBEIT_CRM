import express from "express";
import {
  registerClient,
  loginClient,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword,
  getClientProfile,
  updateClientProfile
} from "../../controllers/client/authController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Public routes
router.post("/register", registerClient);
router.post("/login", loginClient);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// Protected routes (require client authentication)
router.put("/change-password", clientProtect, changePassword);
router.get("/profile", clientProtect, getClientProfile);
router.put("/profile", clientProtect, updateClientProfile);

export default router;