import Goal from "../../models/Goal.js";

// @desc    Get all goals for logged-in admin
// @route   GET /api/admin/goals
// @access  Private (Admin)
export const getGoals = async (req, res) => {
  try {
    const { search, status, goalType } = req.query;
    
    let filter = { admin: req.admin._id };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (goalType && goalType !== "All") {
      filter.goalType = goalType;
    }
    
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    
    res.json({
      goals
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ message: "Server error while fetching goals" });
  }
};

// @desc    Create a goal for logged-in admin
// @route   POST /api/admin/goals
// @access  Private (Admin)
export const createGoal = async (req, res) => {
  try {
    const { title, description, goalType, targetValue, currentValue, startDate, endDate, status } = req.body;
    
    if (!title || !goalType || !targetValue || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Title, goal type, target value, start date, and end date are required fields" 
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        message: "End date must be after start date" 
      });
    }

    const goal = new Goal({
      title,
      description: description || "",
      goalType,
      targetValue,
      currentValue: currentValue || 0,
      startDate,
      endDate,
      status: status || "Not Started",
      admin: req.admin._id
    });

    const createdGoal = await goal.save();
    res.status(201).json(createdGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Update a goal (only if owned by admin)
// @route   PUT /api/admin/goals/:id
// @access  Private (Admin)
export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goalType, targetValue, currentValue, startDate, endDate, status } = req.body;
    
    if (!title || !goalType || !targetValue || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Title, goal type, target value, start date, and end date are required fields" 
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        message: "End date must be after start date" 
      });
    }

    const goal = await Goal.findOne({ _id: id, admin: req.admin._id });
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    goal.title = title;
    goal.description = description || "";
    goal.goalType = goalType;
    goal.targetValue = targetValue;
    goal.currentValue = currentValue || 0;
    goal.startDate = startDate;
    goal.endDate = endDate;
    goal.status = status || "Not Started";

    const updatedGoal = await goal.save();
    res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a goal (only if owned by admin)
// @route   DELETE /api/admin/goals/:id
// @access  Private (Admin)
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const goal = await Goal.findOne({ _id: id, admin: req.admin._id });
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await Goal.findByIdAndDelete(id);
    res.json({ message: "Goal removed" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ message: "Server error while deleting goal" });
  }
};

// @desc    Bulk delete goals (only those owned by admin)
// @route   POST /api/admin/goals/bulk-delete
// @access  Private (Admin)
export const bulkDeleteGoals = async (req, res) => {
  try {
    const { goalIds } = req.body;
    
    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      return res.status(400).json({ message: "No goal IDs provided" });
    }

    const result = await Goal.deleteMany({ 
      _id: { $in: goalIds },
      admin: req.admin._id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No goals found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} goal(s) deleted successfully` 
    });
  } catch (error) {
    console.error("Error bulk deleting goals:", error);
    res.status(500).json({ message: "Server error while bulk deleting goals" });
  }
};