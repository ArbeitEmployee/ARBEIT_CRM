import express from "express";
import {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
} from "../../controllers/admin/creditNoteController.js";

const router = express.Router();

// CRUD Routes
router.post("/credit-notes", createCreditNote);          // Insert
router.get("/credit-notes", getCreditNotes);             // View all
router.get("/credit-notes/:id", getCreditNoteById);      // View single
router.put("/credit-notes/:id", updateCreditNote);       // Update
router.delete("/credit-notes/:id", deleteCreditNote);    // Delete

export default router;
