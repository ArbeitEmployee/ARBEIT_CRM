import express from "express";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  importExpenses,
  searchCustomers,
  bulkDeleteExpenses
} from "../../controllers/admin/expenseController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All expense routes are protected with JWT middleware
router.route("/")
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route("/import")
  .post(protect, upload.single('file'), importExpenses);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/bulk-delete")
  .post(protect, bulkDeleteExpenses);

router.route("/:id")
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

export default router;