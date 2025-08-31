import express from "express";
import {
  getClientArticles,
  voteOnArticle,
  getUserVotes
} from "../../controllers/client/clientKnowledgeBaseController.js";

const router = express.Router();

// Client knowledge base routes
router.route("/")
  .get(getClientArticles);

router.route("/:articleId/vote")
  .post(voteOnArticle);

router.route("/user-votes")
  .post(getUserVotes);

export default router;