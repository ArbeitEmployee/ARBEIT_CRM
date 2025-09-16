import KnowledgeBase from "../../models/KnowledgeBase.js";

// @desc    Get all knowledge base articles
// @route   GET /api/knowledge-base
// @access  Private (Admin)
export const getArticles = async (req, res) => {
  try {
    const { group, search } = req.query;
    
    // Filter by logged-in admin only
    let filter = { admin: req.admin.id };
    
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
    
    res.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error while fetching articles" });
  }
};

// @desc    Create new article
// @route   POST /api/knowledge-base
// @access  Private (Admin)
export const createArticle = async (req, res) => {
  try {
    const { title, content, group, dateCreated } = req.body;
    
    // Validate required fields
    if (!title || !content || !group) {
      return res.status(400).json({ message: "Title, content, and group are required" });
    }
    
    const article = await KnowledgeBase.create({
      admin: req.admin.id, // Use logged-in admin's ID
      title,
      content,
      group,
      dateCreated
    });
    
    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    console.error("Error creating article:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while creating article" });
  }
};

// @desc    Update article
// @route   PUT /api/knowledge-base/:id
// @access  Private (Admin)
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, group, dateCreated } = req.body;
    
    // Validate required fields
    if (!title || !content || !group) {
      return res.status(400).json({ message: "Title, content, and group are required" });
    }
    
    const article = await KnowledgeBase.findOneAndUpdate(
      { _id: id, admin: req.admin.id }, // Ensure admin owns the article
      { title, content, group, dateCreated },
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({ message: "Article not found or access denied" });
    }
    
    res.json({ message: "Article updated successfully", article });
  } catch (error) {
    console.error("Error updating article:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while updating article" });
  }
};

// @desc    Delete article
// @route   DELETE /api/knowledge-base/:id
// @access  Private (Admin)
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await KnowledgeBase.findOneAndDelete({ 
      _id: id, 
      admin: req.admin.id  // Ensure admin owns the article
    });
    
    if (!article) {
      return res.status(404).json({ message: "Article not found or access denied" });
    }
    
    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Server error while deleting article" });
  }
};

// @desc    Bulk delete articles
// @route   POST /api/knowledge-base/bulk-delete
// @access  Private (Admin)
export const bulkDeleteArticles = async (req, res) => {
  try {
    const { articleIds } = req.body;
    
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({ message: "Article IDs are required" });
    }
    
    const result = await KnowledgeBase.deleteMany({
      _id: { $in: articleIds },
      admin: req.admin.id  // Ensure admin owns the articles
    });
    
    res.json({ message: `${result.deletedCount} articles deleted successfully` });
  } catch (error) {
    console.error("Error bulk deleting articles:", error);
    res.status(500).json({ message: "Server error while bulk deleting articles" });
  }
};