import express from "express";
import { 
  getClientProposals, 
  acceptProposal, 
  rejectProposal 
} from "../../controllers/client/clientProposalController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client proposal routes (all protected with client JWT middleware)
router.route("/proposals")
  .get(clientProtect, getClientProposals);

router.route("/proposals/:id/accept")
  .put(clientProtect, acceptProposal);

router.route("/proposals/:id/reject")
  .put(clientProtect, rejectProposal);

export default router;