import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot exceed 200 characters"]
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
  },
  contractType: {
    type: String,
    required: true,
    enum: ["Express Contract", "Standard Contract", "Custom Contract"],
    default: "Express Contract"
  },
  contractValue: {
    type: Number,
    required: true,
    min: [0, "Contract value cannot be negative"]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  project: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  signature: {
    type: String,
    enum: ["Signed", "Not Signed"],
    default: "Not Signed"
  }
}, {
  timestamps: true
});

// Add indexes for better performance
contactSchema.index({ admin: 1 });
contactSchema.index({ customerId: 1 });
contactSchema.index({ contractType: 1 });
contactSchema.index({ endDate: 1 });

contactSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;