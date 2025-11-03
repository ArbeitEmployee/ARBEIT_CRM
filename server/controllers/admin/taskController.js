import Task from "../../models/Task.js";
import XLSX from "xlsx";

// @desc    Get all tasks for logged-in admin
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ admin: req.admin._id }).sort({
      createdAt: -1,
    });

    // Calculate stats
    const totalTasks = await Task.countDocuments({ admin: req.admin._id });
    const notStarted = await Task.countDocuments({
      admin: req.admin._id,
      status: "Not Started",
    });
    const inProgress = await Task.countDocuments({
      admin: req.admin._id,
      status: "In Progress",
    });
    const testing = await Task.countDocuments({
      admin: req.admin._id,
      status: "Testing",
    });
    const feedback = await Task.countDocuments({
      admin: req.admin._id,
      status: "Feedback",
    });
    const complete = await Task.countDocuments({
      admin: req.admin._id,
      status: "Complete",
    });

    res.json({
      tasks,
      stats: {
        totalTasks,
        notStarted,
        inProgress,
        testing,
        feedback,
        complete,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
};

// @desc    Create a task for logged-in admin
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({
        message: "Subject is a required field",
      });
    }

    const task = new Task({
      admin: req.admin._id,
      projectName,
      priority: req.body.priority || "Medium",
      tags: req.body.tags || "",
      startDate: req.body.startDate || "",
      deadline: req.body.deadline || "",
      members: req.body.members || "",
      status: req.body.status || "Not Started",
      description: req.body.description || "",
    });

    const createdTask = await task.save();

    res.status(201).json(createdTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message,
    });
  }
};

// @desc    Import tasks from CSV for logged-in admin
// @route   POST /api/tasks/import
// @access  Private
export const importTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    // Validate required fields
    const requiredFields = ["Subject"];
    const missingFields = requiredFields.filter(
      (field) => !jsonData[0].hasOwnProperty(field)
    );

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Process each row
    const importedTasks = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1

      // Skip if required fields are missing
      if (!row["Subject"]) {
        errorMessages.push(
          `Row ${rowNumber}: Missing required field 'Subject'`
        );
        continue;
      }

      // Validate status
      const validStatuses = [
        "Not Started",
        "In Progress",
        "Testing",
        "Feedback",
        "Complete",
      ];

      if (row.Status && !validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      // Validate priority
      const validPriorities = ["Urgent", "High", "Medium", "Low"];

      if (row.Priority && !validPriorities.includes(row.Priority)) {
        errorMessages.push(
          `Row ${rowNumber}: Invalid priority "${row.Priority}"`
        );
        continue;
      }

      const taskData = {
        admin: req.admin._id,
        projectName: row["Subject"],
        priority: row.Priority || "Medium",
        tags: row.Tags || "",
        startDate: row["Start Date"] || "",
        deadline: row.Deadline || "",
        members: row.Members || "",
        status: row.Status || "Not Started",
        description: row.Description || "",
      };

      try {
        const task = new Task(taskData);
        const savedTask = await task.save();

        importedTasks.push(savedTask);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed")
          ? `Row ${rowNumber}: Validation error - ${
              error.message.split(": ")[2]
            }`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedTasks.length} successful and ${errorMessages.length} failed`,
      importedCount: importedTasks.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedTasks,
    });
  } catch (error) {
    console.error("Error importing tasks:", error);
    res.status(500).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : "Server error while importing tasks",
    });
  }
};

// @desc    Update a task for logged-in admin
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({
        message: "Subject is a required field",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.projectName = projectName;
    task.priority = req.body.priority || task.priority;
    task.tags = req.body.tags || "";
    task.startDate = req.body.startDate || "";
    task.deadline = req.body.deadline || "";
    task.members = req.body.members || "";
    task.status = req.body.status || "Not Started";
    task.description = req.body.description || "";

    const updatedTask = await task.save();

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message,
    });
  }
};

// @desc    Delete a task for logged-in admin
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Task removed successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error while deleting task" });
  }
};

// @desc    Bulk delete tasks for logged-in admin
// @route   POST /api/tasks/bulk-delete
// @access  Private
export const bulkDeleteTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Task IDs are required" });
    }

    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      admin: req.admin._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No tasks found to delete" });
    }

    res.json({
      message: `${result.deletedCount} task(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error bulk deleting tasks:", error);
    res.status(500).json({ message: "Server error while bulk deleting tasks" });
  }
};

// ========== NEW FUNCTIONS FOR STAFF TASKS ========== //

// @desc    Get tasks for specific staff member
// @route   GET /api/tasks/staff/:staffName/tasks
// @access  Private (Staff)
export const getStaffTasks = async (req, res) => {
  try {
    const { staffName } = req.params;

    console.log("Fetching tasks for staff:", staffName);

    // Find all tasks where the staff member's name appears in the members field
    const tasks = await Task.find({
      members: { $regex: staffName, $options: "i" },
    }).sort({ createdAt: -1 });

    console.log("Found tasks:", tasks.length);

    // Format tasks for staff view
    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.projectName,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline,
      status: task.status.toLowerCase().replace(" ", "-"),
      description: task.description,
      startDate: task.startDate,
      members: task.members,
    }));

    res.json({
      success: true,
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("Error fetching staff tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching staff tasks",
    });
  }
};

// @desc    Update task status (for staff)
// @route   PUT /api/tasks/staff/tasks/:taskId
// @access  Private (Staff)
export const updateStaffTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    console.log("Updating task:", taskId, "to status:", status);

    const validStatuses = [
      "Not Started",
      "In Progress",
      "Testing",
      "Feedback",
      "Complete",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.status = status;
    const updatedTask = await task.save();

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating staff task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating task",
    });
  }
};
