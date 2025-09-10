import mongoose from "mongoose";

// Counter schema for sequential numbering (per admin)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1 }
});
const PaymentCounter = mongoose.model("PaymentCounter", counterSchema);

const paymentSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true
    },
    invoiceNumber: {
      type: String,
      required: true
    },
    customer: {
      type: String,
      required: true
    },
    paymentNumber: {
      type: String,
      index: true
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMode: {
      type: String,
      enum: ["Bank", "Stripe Checkout", "Cash", "Credit Card", "Other"],
      required: true
    },
    transactionId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Failed", "Refunded"],
      default: "Completed"
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for admin-specific payment numbers
paymentSchema.index({ admin: 1, paymentNumber: 1 }, { unique: true });

// Auto-generate sequential Payment Number
paymentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await PaymentCounter.findByIdAndUpdate(
      { _id: "paymentNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.paymentNumber = `PAY-${String(counter.seq).padStart(6, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Update invoice status after payment
paymentSchema.post("save", async function () {
  try {
    const Invoice = mongoose.model("Invoice");
    const invoice = await Invoice.findById(this.invoice);
    
    if (invoice) {
      const newPaidAmount = (invoice.paidAmount || 0) + this.amount;
      
      // Update invoice paid amount and status
      invoice.paidAmount = newPaidAmount;
      
      if (newPaidAmount >= invoice.total) {
        invoice.status = "Paid";
      } else if (newPaidAmount > 0) {
        invoice.status = "Partiallypaid";
      }
      
      await invoice.save();
    }
  } catch (error) {
    console.error("Error updating invoice after payment:", error);
  }
});

// Handle refunds - update invoice status if payment is refunded
paymentSchema.post("findOneAndUpdate", async function () {
  try {
    if (this.getUpdate().$set && this.getUpdate().$set.status === "Refunded") {
      const Invoice = mongoose.model("Invoice");
      const payment = await this.model.findOne(this.getQuery());
      const invoice = await Invoice.findById(payment.invoice);
      
      if (invoice) {
        const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
        invoice.paidAmount = newPaidAmount;
        
        if (newPaidAmount >= invoice.total) {
          invoice.status = "Paid";
        } else if (newPaidAmount > 0) {
          invoice.status = "Partiallypaid";
        } else {
          invoice.status = "Unpaid";
        }
        
        await invoice.save();
      }
    }
  } catch (error) {
    console.error("Error updating invoice after refund:", error);
  }
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;