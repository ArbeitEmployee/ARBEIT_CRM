import Goal from "../../models/Goal.js";

// @desc    Get all goals
// @route   GET /api/goals
// @access  Public
export const getGoals = async (req, res) => {
  try {
    const { search, status, goalType } = req.query;
    
    let filter = {};
    
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

// @desc    Create a goal
// @route   POST /api/goals
// @access  Public
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
      status: status || "Not Started"
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

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Public
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

    const goal = await Goal.findById(id);
    
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

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Public
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const goal = await Goal.findById(id);
    
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

// @desc    Bulk delete goals
// @route   POST /api/goals/bulk-delete
// @access  Public
export const bulkDeleteGoals = async (req, res) => {
  try {
    const { goalIds } = req.body;
    
    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      return res.status(400).json({ message: "No goal IDs provided" });
    }

    const result = await Goal.deleteMany({ _id: { $in: goalIds } });
    
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