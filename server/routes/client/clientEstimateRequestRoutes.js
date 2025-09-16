// File: routes/client/clientEstimateRequestRoutes.js
import express from "express";
import { 
  getClientEstimateRequests, 
  getClientEstimateRequest 
} from "../../controllers/client/clientEstimateRequestController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client estimate request routes (all protected with client JWT middleware)
router.route("/")
  .get(clientProtect, getClientEstimateRequests);

router.route("/:id")
  .get(clientProtect, getClientEstimateRequest);

export default router;