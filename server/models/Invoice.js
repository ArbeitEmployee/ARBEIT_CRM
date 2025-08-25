import mongoose from "mongoose";

// Counter schema for sequential numbering
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1 }
});
const Counter = mongoose.model("InvoiceCounter", counterSchema);

const invoiceSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    billTo: { type: String },
    shipTo: { type: String },

    invoiceNumber: {
      type: String,
      unique: true,
      index: true
    },

    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    tags: { type: String },

    paymentMode: {
      type: String,
      enum: ["Bank", "Stripe Checkout"],
      default: "Bank"
    },

    currency: { type: String, default: "USD" },
    salesAgent: { type: String },

    recurringInvoice: {
      type: String,
      enum: ["No", "Every one month", "Custom"],
      default: "No"
    },

    discountType: { type: String, default: "percent" },
    discountValue: { type: Number, default: 0 },
    adminNote: { type: String },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        rate: { type: Number, required: true },
        tax1: { type: Number, default: 0 },
        tax2: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    ],

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 }, // Add paidAmount field
    status: {
      type: String,
      enum: ["Draft", "Unpaid", "Paid", "Partiallypaid", "Overdue"], // Fixed spelling
      default: "Draft"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-generate sequential Invoice Number
invoiceSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "invoiceNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.invoiceNumber = `INV-${String(counter.seq).padStart(6, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Calculate subtotal, discount, and total before saving
invoiceSchema.pre("save", function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  // Calculate discount
  this.discount =
    this.discountType === "percent"
      ? this.subtotal * (this.discountValue / 100)
      : this.discountValue;

  // Calculate total
  this.total = this.subtotal - this.discount;

  // Also calculate amount for each item
  this.items.forEach((item) => {
    item.amount = item.quantity * item.rate;
  });

  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;