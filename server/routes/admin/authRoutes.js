import express from "express";
import {
  registerAdmin,
  loginAdmin,
  forgotPassword,
   verifyResetCode,
  resetPassword
} from "../../controllers/admin/authController.js";

import { protect } from "../../middlewares/authMiddleware.js";
import { updateAdminStatus } from "../../controllers/admin/authController.js";


const router = express.Router();
router.put("/update-status", protect, async (req, res, next) => {
  if (req.admin.role !== "superAdmin") {
    return res.status(403).json({ message: "Only superAdmin can update status" });
  }
  next();
}, updateAdminStatus);



router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
