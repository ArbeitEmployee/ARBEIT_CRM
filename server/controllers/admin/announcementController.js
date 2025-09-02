import Announcement from "../../models/Announcement.js";

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
export const getAnnouncements = async (req, res) => {
  try {
    const { search } = req.query;
    
    let filter = {};
    
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

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Public
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
      date
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

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Public
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date } = req.body;
    
    if (!title || !content || !date) {
      return res.status(400).json({ 
        message: "Title, content, and date are required fields" 
      });
    }

    const announcement = await Announcement.findById(id);
    
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

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Public
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id);
    
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

// @desc    Bulk delete announcements
// @route   POST /api/announcements/bulk-delete
// @access  Public
export const bulkDeleteAnnouncements = async (req, res) => {
  try {
    const { announcementIds } = req.body;
    
    if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      return res.status(400).json({ message: "No announcement IDs provided" });
    }

    const result = await Announcement.deleteMany({ _id: { $in: announcementIds } });
    
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