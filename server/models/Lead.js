import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    //index: true
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  company: {
    type: String,
    required: [true, "Company is required"],
    trim: true,
    maxlength: [100, "Company name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"]
  },
  value: {
    type: Number,
    min: [0, "Value cannot be negative"],
    default: 0
  },
  tags: {
    type: String,
    trim: true,
    maxlength: [200, "Tags cannot exceed 200 characters"]
  },
  assigned: {
    type: String,
    trim: true,
    maxlength: [100, "Assigned to cannot exceed 100 characters"]
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Proposal", "Customer", "Lost"],
    default: "New"
  },
  source: {
    type: String,
    enum: ["Website", "Referral", "Social Media", "Cold Call", "Event", "Other", ""],
    default: ""
  },
  lastContact: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Accepts DD-MM-YYYY or YYYY-MM-DD
        return /^\d{2}-\d{2}-\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Date format should be DD-MM-YYYY or YYYY-MM-DD"
    }
  },
  created: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Accepts DD-MM-YYYY or YYYY-MM-DD
        return /^\d{2}-\d{2}-\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Date format should be DD-MM-YYYY or YYYY-MM-DD"
    }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  }
}, {
  timestamps: true
});

// Add indexes for better performance
leadSchema.index({ admin: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ createdAt: -1 });

leadSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;