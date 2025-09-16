// File: models/EstimateRequest.js
import mongoose from "mongoose";

const estimateRequestSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
  },
  projectName: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    maxlength: [200, "Project name cannot exceed 200 characters"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"]
  },
  createdDate: {
    type: Date,
    required: [true, "Created date is required"]
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Draft",
      "Sent",
      "Accepted",
      "Rejected",
      "Expired"
    ],
    default: "Draft"
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Notes cannot exceed 1000 characters"]
  }
}, {
  timestamps: true
});

// Add indexes for better performance
estimateRequestSchema.index({ admin: 1 });
estimateRequestSchema.index({ customerId: 1 });
estimateRequestSchema.index({ status: 1 });
estimateRequestSchema.index({ createdDate: 1 });

estimateRequestSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

estimateRequestSchema.set('toJSON', { virtuals: true });
estimateRequestSchema.set('toObject', { virtuals: true });

const EstimateRequest = mongoose.model("EstimateRequest", estimateRequestSchema);

export default EstimateRequest;