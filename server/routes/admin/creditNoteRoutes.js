import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
  getCreditNoteStats
} from "../../controllers/admin/creditNoteController.js";

const router = express.Router();

// All credit note routes are protected and admin-specific
router.post("/credit-notes", protect, createCreditNote);          // Insert
router.get("/credit-notes", protect, getCreditNotes);             // View all
router.get("/credit-notes/stats", protect, getCreditNoteStats);   // Get stats
router.get("/credit-notes/:id", protect, getCreditNoteById);      // View single
router.put("/credit-notes/:id", protect, updateCreditNote);       // Update
router.delete("/credit-notes/:id", protect, deleteCreditNote);    // Delete

export default router;