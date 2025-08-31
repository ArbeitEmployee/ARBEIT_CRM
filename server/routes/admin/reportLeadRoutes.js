// MultipleFiles/routes/admin/reportLeadRoutes.js
import express from "express";
import { getLeadsReport } from "../../controllers/admin/reportLeadController.js";

const router = express.Router();

router.route("/leads").get(getLeadsReport);

export default router;
