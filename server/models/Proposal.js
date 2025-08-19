import mongoose from "mongoose";

// Counter schema for sequential numbering
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1 }
});
const Counter = mongoose.model('Counter', counterSchema);

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String },
    proposalNumber: { 
      type: String,
      unique: true,
      index: true
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String },
    clientPhone: { type: String },
    proposalDate: { 
      type: Date,
      default: Date.now
    },
    status: { 
      type: String, 
      enum: ["Draft", "Sent", "Accepted", "Rejected"], 
      default: "Draft" 
    },
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
    total: { type: Number },
    date: { type: Date, default: Date.now },
    openTill: { type: Date },
    currency: { type: String, default: "USD" },
    discountType: { type: String, default: "percent" },
    discountValue: { type: Number, default: 0 },
    tags: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zip: { type: String },
    phone: { type: String },
    assigned: { type: String }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save hook for sequential numbering
proposalSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'proposalNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.proposalNumber = `PRO-${String(counter.seq).padStart(6, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Calculate financials when items change
proposalSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('discountType') || this.isModified('discountValue')) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    this.discount = this.discountType === 'percent' 
      ? this.subtotal * (this.discountValue / 100)
      : this.discountValue;
      
    this.total = this.subtotal - this.discount;
  }
  next();
});

const Proposal = mongoose.model("Proposal", proposalSchema);
export default Proposal;