import express from "express";
import { 
  getClientEstimates, 
  approveEstimate, 
  rejectEstimate 
} from "../../controllers/client/clientEstimateController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client estimate routes (all protected with client JWT middleware)
router.route("/estimates")
  .get(clientProtect, getClientEstimates);

router.route("/estimates/:id/approve")
  .put(clientProtect, approveEstimate);

router.route("/estimates/:id/reject")
  .put(clientProtect, rejectEstimate);

export default router;