import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, "Position cannot exceed 100 characters"]
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, "Department cannot exceed 100 characters"]
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
  },
  active: {
    type: Boolean,
    default: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better performance
staffSchema.index({ name: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ active: 1 });
staffSchema.index({ department: 1 });
staffSchema.index({ position: 1 });

// Text index for search functionality
staffSchema.index({
  name: 'text',
  email: 'text', 
  position: 'text',
  department: 'text'
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;