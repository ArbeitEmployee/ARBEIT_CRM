import mongoose from "mongoose";

// Counter schema for sequential numbering
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1 }
});
const Counter = mongoose.model("EstimateCounter", counterSchema);

const estimateSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    billTo: { type: String },
    shipTo: { type: String },
    estimateNumber: {
      type: String,
      unique: true,
      index: true
    },
    estimateDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    tags: { type: String },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Approved", "Rejected"],
      default: "Draft"
    },
    reference: { type: String },
    salesAgent: { type: String },
    discountType: { type: String, default: "percent" },
    discountValue: { type: Number, default: 0 },
    adminNote: { type: String },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        rate: { type: Number, required: true },
        tax1: { type: Number, default: 0 },
        tax2: { type: Number, default: 0 }
      }
    ],

    subtotal: { type: Number },
    discount: { type: Number, default: 0 },
    total: { type: Number }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-generate sequential Estimate Number
estimateSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "estimateNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.estimateNumber = `EST-${String(counter.seq).padStart(6, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Calculate subtotal, discount, and total before saving
estimateSchema.pre("save", function (next) {
  if (
    this.isModified("items") ||
    this.isModified("discountType") ||
    this.isModified("discountValue")
  ) {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );

    this.discount =
      this.discountType === "percent"
        ? this.subtotal * (this.discountValue / 100)
        : this.discountValue;

    this.total = this.subtotal - this.discount;
  }
  next();
});

const Estimate = mongoose.model("Estimate", estimateSchema);
export default Estimate;
