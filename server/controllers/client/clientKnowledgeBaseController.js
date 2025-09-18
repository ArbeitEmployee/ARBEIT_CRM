import KnowledgeBase from "../../models/KnowledgeBase.js";

// @desc    Get all knowledge base articles for client
// @route   GET /api/client/knowledge-base
// @access  Protected (Client Auth)
export const getClientArticles = async (req, res) => {
  try {
    const { group, search } = req.query;

    // Get admin ID from authenticated client
    const adminId = req.client.admin;

    let filter = { admin: adminId };

    if (group && group !== "All") {
      filter.group = group;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { group: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await KnowledgeBase.find(filter)
      .select("-userVotes")
      .sort({ createdAt: -1 });

    // Get unique groups for filter
    const groups = await KnowledgeBase.distinct("group", { admin: adminId });

    res.json({
      articles,
      groups: ["All", ...groups.sort()],
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error while fetching articles" });
  }
};

// @desc    Vote on an article
// @route   POST /api/client/knowledge-base/:articleId/vote
// @access  Protected (Client Auth)
export const voteOnArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { voteType } = req.body;

    // Use client ID from authenticated client
    const userId = req.client._id.toString();

    if (!["helpful", "notHelpful"].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    const article = await KnowledgeBase.findById(articleId);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Verify the article belongs to the client's admin
    if (article.admin.toString() !== req.client.admin._id.toString()) {
      return res.status(403).json({ message: "Access denied to this article" });
    }

    // Check if user already voted today
    const today = new Date().toISOString().split("T")[0];

    const existingVote = article.userVotes.find(
      (vote) => vote.userId === userId && vote.voteDate === today
    );

    if (existingVote) {
      return res
        .status(403)
        .json({ message: "You can only vote once per day on each article" });
    }

    // Add new vote
    article.votes[voteType] += 1;
    article.userVotes.push({
      userId: userId,
      voteType: voteType,
      votedAt: new Date(),
      voteDate: today,
    });

    await article.save();

    // Return updated votes without userVotes data
    const updatedArticle = await KnowledgeBase.findById(articleId).select(
      "votes"
    );

    res.json({
      message: "Vote recorded successfully",
      votes: updatedArticle.votes,
    });
  } catch (error) {
    console.error("Error voting on article:", error);
    res.status(500).json({ message: "Server error while processing vote" });
  }
};

// @desc    Get user's vote status for articles
// @route   POST /api/client/knowledge-base/user-votes
// @access  Protected (Client Auth)
export const getUserVotes = async (req, res) => {
  try {
    const { articleIds } = req.body;

    // Use client ID from authenticated client
    const userId = req.client._id.toString();

    if (!Array.isArray(articleIds)) {
      return res.status(400).json({ message: "Article IDs are required" });
    }

    // Get today's date for filtering
    const today = new Date().toISOString().split("T")[0];

    const articles = await KnowledgeBase.find(
      {
        _id: { $in: articleIds },
        admin: req.client.admin,
      },
      { userVotes: 1 }
    );

    const userVotes = {};
    articles.forEach((article) => {
      const userVote = article.userVotes.find(
        (vote) => vote.userId === userId && vote.voteDate === today
      );

      if (userVote) {
        userVotes[article._id.toString()] = userVote.voteType;
      }
    });

    res.json({ userVotes });
  } catch (error) {
    console.error("Error fetching user votes:", error);
    res.status(500).json({ message: "Server error while fetching user votes" });
  }
};
