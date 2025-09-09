import mongoose from "mongoose";

const supportSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot exceed 200 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
  },
  tags: {
    type: String,
    trim: true,
    maxlength: [100, "Tags cannot exceed 100 characters"]
  },
  service: {
    type: String,
    required: true,
    enum: ["FIELD", "STRATEGY", "TECHNICAL", "BILLING", "GENERAL"],
    default: "GENERAL"
  },
  department: {
    type: String,
    required: true,
    enum: ["Marketing", "Sales", "Support", "Development", "Operations"],
    default: "Support"
  },
  priority: {
    type: String,
    required: true,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  },
  status: {
    type: String,
    required: true,
    enum: ["Open", "Answered", "On Hold", "Closed", "In Progress"],
    default: "Open"
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastReply: {
    type: String,
    default: "No Reply Yet"
  }
}, {
  timestamps: true
});

// Add indexes for better performance
supportSchema.index({ admin: 1 });
supportSchema.index({ customerId: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ priority: 1 });

supportSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

supportSchema.set('toJSON', { virtuals: true });
supportSchema.set('toObject', { virtuals: true });

const Support = mongoose.model("Support", supportSchema);

export default Support;