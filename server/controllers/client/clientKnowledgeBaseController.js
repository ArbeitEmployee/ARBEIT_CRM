import KnowledgeBase from "../../models/KnowledgeBase.js";

// @desc    Get all knowledge base articles for client
// @route   GET /api/client/knowledge-base
// @access  Public
export const getClientArticles = async (req, res) => {
  try {
    const { group, search } = req.query;
    
    let filter = {};
    
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
    
    // Get unique groups for filter
    const groups = await KnowledgeBase.distinct("group");
    
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
// @route   POST /api/client/knowledge-base/:id/vote
// @access  Public
export const voteOnArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { voteType, userId } = req.body;
    
    if (!['helpful', 'notHelpful'].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }
    
    const article = await KnowledgeBase.findById(articleId);
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    // Check if user already voted
    const existingVote = article.userVotes.find(vote => vote.userId === userId);
    
    if (existingVote) {
      // If user already voted with same type, remove the vote
      if (existingVote.voteType === voteType) {
        article.votes[voteType] -= 1;
        article.userVotes = article.userVotes.filter(vote => vote.userId !== userId);
      } else {
        // If user voted differently, change the vote
        article.votes[existingVote.voteType] -= 1;
        article.votes[voteType] += 1;
        existingVote.voteType = voteType;
        existingVote.votedAt = new Date();
      }
    } else {
      // New vote
      article.votes[voteType] += 1;
      article.userVotes.push({
        userId,
        voteType,
        votedAt: new Date()
      });
    }
    
    await article.save();
    
    // Return updated votes without userVotes data
    const { votes } = await KnowledgeBase.findById(articleId).select('votes');
    
    res.json({
      message: "Vote recorded successfully",
      votes,
      userVote: existingVote ? voteType : null
    });
  } catch (error) {
    console.error("Error voting on article:", error);
    res.status(500).json({ message: "Server error while processing vote" });
  }
};

// @desc    Get user's vote status for articles
// @route   POST /api/client/knowledge-base/user-votes
// @access  Public
export const getUserVotes = async (req, res) => {
  try {
    const { userId, articleIds } = req.body;
    
    if (!userId || !Array.isArray(articleIds)) {
      return res.status(400).json({ message: "User ID and article IDs are required" });
    }
    
    const articles = await KnowledgeBase.find(
      { _id: { $in: articleIds } },
      { userVotes: 1 }
    );
    
    const userVotes = {};
    articles.forEach(article => {
      const userVote = article.userVotes.find(vote => vote.userId === userId);
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