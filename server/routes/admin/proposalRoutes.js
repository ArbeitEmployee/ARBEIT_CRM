import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,
  getProposalStats
} from "../../controllers/admin/proposalController.js";

const router = express.Router();

// ✅ All proposal routes (protected with JWT middleware)
router.get("/proposals", protect, getProposals);        // GET all proposals
router.get("/proposals/stats", protect, getProposalStats); // GET stats
router.get("/proposals/:id", protect, getProposalById);  // GET single proposal
router.post("/proposals", protect, createProposal);     // CREATE proposal
router.put("/proposals/:id", protect, updateProposal);   // UPDATE proposal
router.delete("/proposals/:id", protect, deleteProposal); // DELETE proposal

export default router;
