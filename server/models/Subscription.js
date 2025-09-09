import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    //index: true
  },
  name: {
    type: String,
    required: [true, "Subscription name is required"],
    trim: true,
    maxlength: [100, "Subscription name cannot exceed 100 characters"]
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
  },
  project: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Active",
      "Future",
      "Past Due",
      "Unpaid",
      "Incomplete",
      "Canceled",
      "Incomplete Expired"
    ],
    default: "Active"
  },
  nextBilling: {
    type: Date,
    required: true
  },
  dateSubscribed: {
    type: Date,
    default: Date.now
  },
  lastSent: {
    type: Date
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount cannot be negative"]
  },
  billingCycle: {
    type: String,
    enum: ["Monthly", "Quarterly", "Annual", "Custom"],
    default: "Monthly"
  },
  notes: {
    type: String,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  }
}, {
  timestamps: true
});

// Add indexes for better performance
subscriptionSchema.index({ admin: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBilling: 1 });

subscriptionSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;