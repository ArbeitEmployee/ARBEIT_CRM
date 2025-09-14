import express from "express";
import {
  registerClient,
  loginClient,
  forgotPassword,
  verifyResetCode,
  resetPassword,
   changePassword 
} from "../../controllers/client/authController.js";
import { clientProtect } from "../../middlewares/clientAuth.js"

const router = express.Router();

router.post("/register", registerClient);
router.post("/login", loginClient);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.put("/change-password", clientProtect, changePassword);

export default router;