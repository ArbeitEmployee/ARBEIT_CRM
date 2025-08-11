import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    website: { type: String },
    position: { type: String },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    vatNumber: { type: String },
    companyPhone: { type: String },
    country: { type: String },
    city: { type: String },
    address: { type: String },
    zipCode: { type: String },
    resetCode: { type: String },
    resetCodeExpire: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);