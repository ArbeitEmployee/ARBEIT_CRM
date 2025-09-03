import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  goalType: {
    type: String,
    required: [true, "Goal type is required"],
    enum: [
      "Invoiced Amount",
      "Make Contracts By Type",
      "Achieve Total Income",
      "Increase Customer Number"
    ]
  },
  targetValue: {
    type: Number,
    required: [true, "Target value is required"],
    min: [0, "Target value cannot be negative"]
  },
  currentValue: {
    type: Number,
    default: 0,
    min: [0, "Current value cannot be negative"]
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed", "Cancelled"],
    default: "Not Started"
  }
}, {
  timestamps: true
});

// Index for better query performance
goalSchema.index({ createdAt: -1 });
goalSchema.index({ startDate: 1, endDate: 1 });

// Virtual for progress percentage
goalSchema.virtual('progress').get(function() {
  if (this.targetValue === 0) return 0;
  return Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
});

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;