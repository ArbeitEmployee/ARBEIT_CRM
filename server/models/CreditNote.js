import mongoose from "mongoose";

// Counter schema for sequential numbering (GLOBAL counter like estimates.js)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1 }
});
const Counter = mongoose.model('CreditNoteCounter', counterSchema);

const creditNoteSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },
    customer: { 
      type: String, 
      required: true 
    },
    billTo: { 
      type: String 
    },
    shipTo: { 
      type: String 
    },
    creditNoteNumber: {
      type: String,
      index: true
    },
    creditNoteDate: { 
      type: Date, 
      default: Date.now 
    },
    currency: { 
      type: String, 
      default: "USD" 
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Issued", "Cancelled"],
      default: "Draft"
    },
    discountType: { 
      type: String, 
      default: "percent" 
    },
    discountValue: { 
      type: Number, 
      default: 0 
    },
    adminNote: { 
      type: String 
    },
    reference: { 
      type: String 
    },
    project: { 
      type: String 
    },

    items: [
      {
        description: { 
          type: String, 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true, 
          default: 1 
        },
        rate: { 
          type: Number, 
          required: true 
        },
        tax1: { 
          type: Number, 
          default: 0 
        },
        tax2: { 
          type: Number, 
          default: 0 
        },
        amount: { 
          type: Number,
          default: 0
        }
      }
    ],

    subtotal: { 
      type: Number, 
      default: 0 
    },
    discount: { 
      type: Number, 
      default: 0 
    },
    total: { 
      type: Number, 
      default: 0 
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for admin-specific credit note numbers (EXACTLY like estimates.js)
creditNoteSchema.index({ admin: 1, creditNoteNumber: 1 }, { unique: true });

// Pre-save hook (EXACTLY like estimates.js)
creditNoteSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'creditNoteNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.creditNoteNumber = `CN-${String(counter.seq).padStart(6, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Calculate subtotal, discount, and total before saving (EXACTLY like estimates.js)
creditNoteSchema.pre("save", function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce(
    (sum, item) => sum + (item.quantity * item.rate),
    0
  );

  // Calculate discount
  this.discount = this.discountType === "percent"
    ? this.subtotal * (this.discountValue / 100)
    : this.discountValue;

  // Calculate total
  this.total = this.subtotal - this.discount;

  // Also calculate amount for each item
  this.items.forEach(item => {
    item.amount = item.quantity * item.rate;
  });

  next();
});

const CreditNote = mongoose.model("CreditNote", creditNoteSchema);
export default CreditNote;