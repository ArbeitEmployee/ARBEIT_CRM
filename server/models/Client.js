import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone cannot exceed 20 characters"]
  },
  website: {
    type: String,
    trim: true,
    maxlength: [100, "Website cannot exceed 100 characters"]
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, "Position cannot exceed 100 characters"]
  },
  companyName: {
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
  companyPhone: {
    type: String,
    trim: true,
    maxlength: [20, "Company phone cannot exceed 20 characters"]
  },
  country: {
    type: String,
    trim: true,
    maxlength: [50, "Country cannot exceed 50 characters"]
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, "City cannot exceed 50 characters"]
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, "Address cannot exceed 200 characters"]
  },
  zipCode: {
    type: String,
    trim: true,
    maxlength: [20, "Zip code cannot exceed 20 characters"]
  },
  customerCode: {
    type: String,
    required: [true, "Customer code is required"],
    uppercase: true,
    match: [/^CUST-[A-Z0-9]{6}$/, "Invalid customer code format"]
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: [true, "Admin reference is required"],
    //index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer reference is required"],
    //index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetCode: {
    type: String
  },
  resetCodeExpire: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
clientSchema.index({ email: 1 });
clientSchema.index({ customerCode: 1 });
clientSchema.index({ admin: 1 });
clientSchema.index({ customer: 1 });
clientSchema.index({ admin: 1, customer: 1 }); // Compound index for queries
clientSchema.index({ isActive: 1 });
clientSchema.index({ lastLogin: -1 });

// Virtual for full name (if needed)
clientSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to ensure uppercase customer code
clientSchema.pre('save', function(next) {
  if (this.customerCode) {
    this.customerCode = this.customerCode.toUpperCase();
  }
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Method to check if client has access to a specific project
clientSchema.methods.hasProjectAccess = function(projectId, customerId) {
  return this.customer.toString() === customerId.toString() && this.isActive;
};

// Static method to find client by customer code
clientSchema.statics.findByCustomerCode = function(customerCode) {
  return this.findOne({ customerCode: customerCode.toUpperCase() })
    .populate('customer', 'company contact email phone customerCode')
    .populate('admin', 'name email');
};

// Ensure virtual fields are included in JSON output
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

const Client = mongoose.model("Client", clientSchema);

export default Client;