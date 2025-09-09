import express from "express";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  bulkDeleteArticles
} from "../../controllers/admin/knowledgeBaseController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All knowledge base routes (protected with JWT middleware)
router.route("/")
  .get(protect, getArticles)
  .post(protect, createArticle);

router.route("/bulk-delete")
  .post(protect, bulkDeleteArticles);

router.route("/:id")
  .put(protect, updateArticle)
  .delete(protect, deleteArticle);

export default router;