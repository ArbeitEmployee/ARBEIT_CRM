import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    //unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true
  },
  companyPhone: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  customerCode: {
    type: String,
    required: true,
    ref: 'Customer'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
clientSchema.index({ email: 1 });
clientSchema.index({ customerCode: 1 });
clientSchema.index({ admin: 1 });
clientSchema.index({ customer: 1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;