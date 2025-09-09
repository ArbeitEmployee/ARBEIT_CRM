import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    //index: true
  },
  projectName: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [100, "Subject cannot exceed 100 characters"]
  },
  priority: {
    type: String,
    required: true,
    enum: [
      "Urgent",
      "High",
      "Medium",
      "Low"
    ],
    default: "Medium"
  },
  tags: {
    type: String,
    trim: true,
    maxlength: [50, "Tags cannot exceed 50 characters"]
  },
  startDate: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4})$/.test(v);
      },
      message: "Start date must be in DD-MM-YYYY or MM-DD-YYYY format"
    }
  },
  deadline: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4})$/.test(v);
      },
      message: "Deadline must be in DD-MM-YYYY or MM-DD-YYYY format"
    }
  },
  members: {
    type: String,
    trim: true,
    maxlength: [100, "Members field cannot exceed 100 characters"]
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Not Started",
      "In Progress",
      "Testing",
      "Feedback",
      "Complete"
    ],
    default: "Not Started"
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  }
}, {
  timestamps: true
});

// Add indexes for better performance
taskSchema.index({ admin: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;