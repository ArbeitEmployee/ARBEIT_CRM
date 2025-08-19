import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
    maxlength: [100, "Company name cannot exceed 100 characters"]
  },
  vatNumber: {
    type: String,
    trim: true,
    maxlength: [50, "VAT number cannot exceed 50 characters"]
  },
  contact: {
    type: String,
    required: [true, "Primary contact name is required"],
    trim: true,
    maxlength: [100, "Contact name cannot exceed 100 characters"]
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
  },
  website: {
    type: String,
    trim: true,
    maxlength: [100, "Website URL cannot exceed 100 characters"]
  },
  groups: {
    type: [String],
    default: []
  },
  currency: {
    type: String,
    default: "System Default",
    enum: ["System Default", "USD", "EUR", "GBP"]
  },
  language: {
    type: String,
    default: "System Default",
    enum: ["System Default", "English", "Spanish", "French"]
  },
  active: {
    type: Boolean,
    default: true
  },
  contactsActive: {
    type: Boolean,
    default: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better performance
customerSchema.index({ company: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ active: 1 });
customerSchema.index({ contactsActive: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;