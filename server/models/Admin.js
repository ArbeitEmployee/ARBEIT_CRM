import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["superAdmin", "admin"], default: "admin" },
    resetCode: { type: String },
    resetCodeExpire: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
