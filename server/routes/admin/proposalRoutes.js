import express from "express";
import {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,
} from "../../controllers/admin/proposalController.js";

const router = express.Router();

// Routes for proposals
router.get("/proposals", getProposals);
router.post("/proposals", createProposal);
router.get("/proposals/:id", getProposalById);
router.put("/proposals/:id", updateProposal);
router.delete("/proposals/:id", deleteProposal);

export default router;
