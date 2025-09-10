// MultipleFiles/routes/admin/reportLeadRoutes.js
import express from "express";
import { getLeadsReport } from "../../controllers/admin/reportLeadController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/leads").get(protect, getLeadsReport);

export default router;