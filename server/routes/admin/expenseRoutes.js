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
import multer from "multer";

const upload = multer();

const router = express.Router();

// Expense routes
router.route("/")
  .get(getExpenses)
  .post(createExpense);

router.route("/import")
  .post(upload.single('file'), importExpenses);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/bulk-delete")
  .post(bulkDeleteExpenses);

router.route("/:id")
  .put(updateExpense)
  .delete(deleteExpense);

export default router;