import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
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
    required: [true, "Contract type is required"],
    enum: [
      "Express Contract",
      "Standard Contract",
      "Custom Contract"
    ],
    default: "Express Contract"
  },
  contractValue: {
    type: Number,
    required: [true, "Contract value is required"],
    min: [0, "Contract value cannot be negative"],
    default: 0
  },
  startDate: {
    type: String,
    required: [true, "Start date is required"],
    validate: {
      validator: function(v) {
        // Accept both DD-MM-YYYY and YYYY-MM-DD formats
        return /^\d{2}-\d{2}-\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Date format should be DD-MM-YYYY or YYYY-MM-DD"
    }
  },
  endDate: {
    type: String,
    required: [true, "End date is required"],
    validate: {
      validator: function(v) {
        // Accept both DD-MM-YYYY and YYYY-MM-DD formats
        return /^\d{2}-\d{2}-\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Date format should be DD-MM-YYYY or YYYY-MM-DD"
    }
  },
  project: {
    type: String,
    required: [true, "Project is required"],
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  signature: {
    type: String,
    required: [true, "Signature status is required"],
    enum: ["Signed", "Not Signed"],
    default: "Not Signed"
  }
}, {
  timestamps: true
});

// Add indexes for better performance
contactSchema.index({ customerId: 1 });
contactSchema.index({ contractType: 1 });
contactSchema.index({ startDate: 1 });
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