import KnowledgeBase from "../../models/KnowledgeBase.js";

// @desc    Get all knowledge base articles for client
// @route   GET /api/client/knowledge-base
// @access  Protected (Client Auth)
export const getClientArticles = async (req, res) => {
  try {
    const { group, search } = req.query;
    
    // Get admin ID from authenticated client
    const adminId = req.client.admin;
    
    let filter = { admin: adminId }; // Filter by client's admin ID
    
    if (group && group !== "All") {
      filter.group = group;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { group: { $regex: search, $options: 'i' } }
      ];
    }
    
    const articles = await KnowledgeBase.find(filter)
      .select('-userVotes') // Don't send user votes to client
      .sort({ createdAt: -1 });
    
    // Get unique groups for filter (only from this admin's articles)
    const groups = await KnowledgeBase.distinct("group", { admin: adminId });
    
    res.json({
      articles,
      groups: ["All", ...groups.sort()]
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
    
    if (!['helpful', 'notHelpful'].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }
    
    const article = await KnowledgeBase.findById(articleId);
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    // Verify the article belongs to the client's admin
    if (article.admin.toString() !== req.client.admin.toString()) {
      return res.status(403).json({ message: "Access denied to this article" });
    }
    
    // Check if user already voted today - FIXED TIMEZONE ISSUE
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const existingVote = article.userVotes.find(vote => 
      vote.userId === userId && 
      vote.votedAt >= startOfDay &&
      vote.votedAt < endOfDay
    );
    
    if (existingVote) {
      return res.status(403).json({ message: "You can only vote once per day on each article" });
    }
    
    // Add new vote
    article.votes[voteType] += 1;
    article.userVotes.push({
      userId,
      voteType,
      votedAt: new Date()
    });
    
    await article.save();
    
    // Return updated votes without userVotes data
    const updatedArticle = await KnowledgeBase.findById(articleId).select('votes');
    
    res.json({
      message: "Vote recorded successfully",
      votes: updatedArticle.votes,
      userVote: voteType
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
    
    const articles = await KnowledgeBase.find(
      { 
        _id: { $in: articleIds },
        admin: req.client.admin // Only get articles from client's admin
      },
      { userVotes: 1 }
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userVotes = {};
    articles.forEach(article => {
      const userVote = article.userVotes.find(vote => 
        vote.userId === userId && 
        new Date(vote.votedAt) >= today
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