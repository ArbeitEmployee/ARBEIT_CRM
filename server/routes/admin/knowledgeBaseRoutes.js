import express from "express";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  bulkDeleteArticles
} from "../../controllers/admin/knowledgeBaseController.js";

const router = express.Router();

// Knowledge base routes
router.route("/")
  .get(getArticles)
  .post(createArticle);

router.route("/bulk-delete")
  .post(bulkDeleteArticles);

router.route("/:id")
  .put(updateArticle)
  .delete(deleteArticle);

export default router;