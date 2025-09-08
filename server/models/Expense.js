import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
    enum: [
      "Travel Expense",
      "Meals & Entertainment",
      "Office Supplies",
      "Software & Tools",
      "Transportation",
      "Accommodation",
      "Communication",
      "Training & Education",
      "Other"
    ]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"]
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  hasReceipt: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: [true, "Date is required"],
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
    trim: true,
    maxlength: [100, "Project name cannot exceed 100 characters"]
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"]
  },
  isInvoiced: {
    type: Boolean,
    default: false
  },
  referenceId: {
    type: String,
    trim: true,
    maxlength: [50, "Reference ID cannot exceed 50 characters"]
  },
  paymentMode: {
    type: String,
    enum: [
      "CASH",
      "BANK",
      "CREDIT CARD",
      "DEBIT CARD",
      "DIGITAL WALLET",
      "OTHER",
      ""
    ],
    default: ""
  }
}, {
  timestamps: true
});

// Add indexes for better performance
expenseSchema.index({ admin: 1 });
expenseSchema.index({ customerId: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ isInvoiced: 1 });

expenseSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;