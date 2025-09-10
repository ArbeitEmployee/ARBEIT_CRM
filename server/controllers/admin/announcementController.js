import Announcement from "../../models/Announcement.js";

// @desc    Get all announcements for logged-in admin
// @route   GET /api/admin/announcements
// @access  Private (Admin)
export const getAnnouncements = async (req, res) => {
  try {
    const { search } = req.query;
    
    let filter = { admin: req.admin._id };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    
    res.json({
      announcements
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Server error while fetching announcements" });
  }
};

// @desc    Create an announcement for logged-in admin
// @route   POST /api/admin/announcements
// @access  Private (Admin)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, date } = req.body;
    
    if (!title || !content || !date) {
      return res.status(400).json({ 
        message: "Title, content, and date are required fields" 
      });
    }

    const announcement = new Announcement({
      title,
      content,
      date,
      admin: req.admin._id
    });

    const createdAnnouncement = await announcement.save();
    res.status(201).json(createdAnnouncement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Update an announcement (only if owned by admin)
// @route   PUT /api/admin/announcements/:id
// @access  Private (Admin)
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date } = req.body;
    
    if (!title || !content || !date) {
      return res.status(400).json({ 
        message: "Title, content, and date are required fields" 
      });
    }

    const announcement = await Announcement.findOne({ _id: id, admin: req.admin._id });
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    announcement.title = title;
    announcement.content = content;
    announcement.date = date;

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete an announcement (only if owned by admin)
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Admin)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findOne({ _id: id, admin: req.admin._id });
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await Announcement.findByIdAndDelete(id);
    res.json({ message: "Announcement removed" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Server error while deleting announcement" });
  }
};

// @desc    Bulk delete announcements (only if owned by admin)
// @route   POST /api/admin/announcements/bulk-delete
// @access  Private (Admin)
export const bulkDeleteAnnouncements = async (req, res) => {
  try {
    const { announcementIds } = req.body;
    
    if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      return res.status(400).json({ message: "No announcement IDs provided" });
    }

    const result = await Announcement.deleteMany({ 
      _id: { $in: announcementIds },
      admin: req.admin._id 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No announcements found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} announcement(s) deleted successfully` 
    });
  } catch (error) {
    console.error("Error bulk deleting announcements:", error);
    res.status(500).json({ message: "Server error while bulk deleting announcements" });
  }
};