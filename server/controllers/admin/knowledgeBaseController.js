import KnowledgeBase from "../../models/KnowledgeBase.js";

// @desc    Get all knowledge base articles for logged-in admin
// @route   GET /api/knowledge-base
// @access  Private
export const getArticles = async (req, res) => {
  try {
    const { group, search } = req.query;
    
    let filter = { admin: req.admin._id };
    
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
    
    const articles = await KnowledgeBase.find(filter).sort({ createdAt: -1 });
    
    // Get unique groups for filter
    const groups = await KnowledgeBase.distinct("group", { admin: req.admin._id });
    
    res.json({
      articles,
      groups: ["All", ...groups.sort()]
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error while fetching articles" });
  }
};

// @desc    Create an article for logged-in admin
// @route   POST /api/knowledge-base
// @access  Private
export const createArticle = async (req, res) => {
  try {
    const { title, content, group, dateCreated } = req.body;
    
    if (!title || !content || !group) {
      return res.status(400).json({ 
        message: "Title, content and group are required fields" 
      });
    }

    const article = new KnowledgeBase({
      admin: req.admin._id,
      title,
      content,
      group,
      dateCreated: dateCreated || ""
    });

    const createdArticle = await article.save();
    res.status(201).json(createdArticle);
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Update an article for logged-in admin
// @route   PUT /api/knowledge-base/:id
// @access  Private
export const updateArticle = async (req, res) => {
  try {
    const { title, content, group, dateCreated } = req.body;
    
    if (!title || !content || !group) {
      return res.status(400).json({ 
        message: "Title, content and group are required fields" 
      });
    }

    const article = await KnowledgeBase.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    article.title = title;
    article.content = content;
    article.group = group;
    article.dateCreated = dateCreated || "";

    const updatedArticle = await article.save();
    res.json(updatedArticle);
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete an article for logged-in admin
// @route   DELETE /api/knowledge-base/:id
// @access  Private
export const deleteArticle = async (req, res) => {
  try {
    const article = await KnowledgeBase.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    await KnowledgeBase.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Article removed successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Server error while deleting article" });
  }
};

// @desc    Bulk delete articles for logged-in admin
// @route   POST /api/knowledge-base/bulk-delete
// @access  Private
export const bulkDeleteArticles = async (req, res) => {
  try {
    const { articleIds } = req.body;
    
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ message: "Article IDs are required" });
    }

    const result = await KnowledgeBase.deleteMany({ 
      _id: { $in: articleIds },
      admin: req.admin._id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No articles found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} article(s) deleted successfully` 
    });
  } catch (error) {
    console.error("Error bulk deleting articles:", error);
    res.status(500).json({ message: "Server error while bulk deleting articles" });
  }
};