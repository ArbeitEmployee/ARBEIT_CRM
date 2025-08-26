import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
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
        return /^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4})$/.test(v);
      },
      message: "Start date must be in DD-MM-YYYY or MM-DD-YYYY format"
    }
  },
  deadline: {
    type: String,
    validate: {
      validator: function(v) {
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
  }
}, {
  timestamps: true
});

// Add indexes for better performance
taskSchema.index({ customerId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });

taskSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model("Task", taskSchema);

export default Task;