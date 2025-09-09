import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    index: true
  },
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
    enum: ["System Default", "USD", "EUR", "GBP", "IDR"]
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
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Add indexes for better performance
customerSchema.index({ admin: 1, company: 1 });
// CHANGED: Added compound unique index for admin and email
customerSchema.index({ admin: 1, email: 1 }, { unique: true }); 
customerSchema.index({ admin: 1, active: 1 });
customerSchema.index({ admin: 1, contactsActive: 1 });

// Text index for search functionality
customerSchema.index({
  company: 'text',
  contact: 'text',
  email: 'text',
  phone: 'text'
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
