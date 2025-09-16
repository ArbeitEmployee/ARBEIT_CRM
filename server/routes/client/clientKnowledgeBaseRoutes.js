import express from "express";
import {
  getClientArticles,
  voteOnArticle,
  getUserVotes
} from "../../controllers/client/clientKnowledgeBaseController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client knowledge base routes - all protected with client auth
router.route("/")
  .get(clientProtect, getClientArticles);

router.route("/:articleId/vote")
  .post(clientProtect, voteOnArticle);

router.route("/user-votes")
  .post(clientProtect, getUserVotes);

export default router;