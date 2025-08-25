import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
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
    type: Date
  },
  deadline: {
    type: Date
  },
  members: {
    type: String,
    trim: true,
    maxlength: [200, "Members field cannot exceed 200 characters"]
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Progress",
      "Last Started",
      "On Hold",
      "Cancelled",
      "Finished"
    ],
    default: "Progress"
  },
  notes: {
    type: String,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  }
}, {
  timestamps: true
});

// Add indexes for better performance
projectSchema.index({ customerId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ deadline: 1 });

projectSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model("Project", projectSchema);

export default Project;