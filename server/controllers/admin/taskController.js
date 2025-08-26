import Task from "../../models/Task.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all tasks with customer details
// @route   GET /api/tasks
// @access  Public
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('customer', 'company contact email phone')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const totalTasks = await Task.countDocuments();
    const notStarted = await Task.countDocuments({ status: "Not Started" });
    const inProgress = await Task.countDocuments({ status: "In Progress" });
    const testing = await Task.countDocuments({ status: "Testing" });
    const feedback = await Task.countDocuments({ status: "Feedback" });
    const complete = await Task.countDocuments({ status: "Complete" });
    
    res.json({
      tasks,
      stats: {
        totalTasks,
        notStarted,
        inProgress,
        testing,
        feedback,
        complete
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Public
export const createTask = async (req, res) => {
  try {
    const { projectName, customerId } = req.body;
    
    if (!projectName || !customerId) {
      return res.status(400).json({ 
        message: "Project name and customer are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const task = new Task({
      projectName,
      customerId,
      tags: req.body.tags || "",
      startDate: req.body.startDate || "",
      deadline: req.body.deadline || "",
      members: req.body.members || "",
      status: req.body.status || "Not Started"
    });

    const createdTask = await task.save();
    const populatedTask = await Task.findById(createdTask._id)
      .populate('customer', 'company contact email phone');
      
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Import tasks from CSV
// @route   POST /api/tasks/import
// @access  Public
export const importTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    // Validate required fields
    const requiredFields = ['Project Name', 'Customer'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedTasks = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row['Project Name'] || !row.Customer) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name
      let customer;
      try {
        customer = await Customer.findOne({ 
          company: { $regex: new RegExp(row.Customer, 'i') } 
        });
        
        if (!customer) {
          errorMessages.push(`Row ${rowNumber}: Customer "${row.Customer}" not found`);
          continue;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error finding customer - ${error.message}`);
        continue;
      }

      // Validate status
      const validStatuses = [
        "Not Started", "In Progress", "Testing", "Feedback", "Complete"
      ];
      
      if (row.Status && !validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      const taskData = {
        projectName: row['Project Name'],
        customerId: customer._id,
        tags: row.Tags || "",
        startDate: row['Start Date'] || "",
        deadline: row.Deadline || "",
        members: row.Members || "",
        status: row.Status || "Not Started"
      };

      try {
        const task = new Task(taskData);
        const savedTask = await task.save();
        const populatedTask = await Task.findById(savedTask._id)
          .populate('customer', 'company contact email phone');
          
        importedTasks.push(populatedTask);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedTasks.length} successful and ${errorMessages.length} failed`,
      importedCount: importedTasks.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedTasks
    });

  } catch (error) {
    console.error("Error importing tasks:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing tasks" 
    });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Public
export const updateTask = async (req, res) => {
  try {
    const { projectName, customerId } = req.body;
    
    if (!projectName || !customerId) {
      return res.status(400).json({ 
        message: "Project name and customer are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.projectName = projectName;
    task.customerId = customerId;
    task.tags = req.body.tags || "";
    task.startDate = req.body.startDate || "";
    task.deadline = req.body.deadline || "";
    task.members = req.body.members || "";
    task.status = req.body.status || "Not Started";

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('customer', 'company contact email phone');
      
    res.json(populatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: "Task removed successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error while deleting task" });
  }
};

// @desc    Search customers by company name
// @route   GET /api/tasks/customers/search
// @access  Public
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      company: { $regex: q, $options: 'i' }
    }).select('company contact email phone').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};

// @desc    Bulk delete tasks
// @route   POST /api/tasks/bulk-delete
// @access  Public
export const bulkDeleteTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Task IDs are required" });
    }

    const result = await Task.deleteMany({ _id: { $in: taskIds } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No tasks found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} task(s) deleted successfully` 
    });
  } catch (error) {
    console.error("Error bulk deleting tasks:", error);
    res.status(500).json({ message: "Server error while bulk deleting tasks" });
  }
};