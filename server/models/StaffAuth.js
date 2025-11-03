// models/StaffAuth.js - NEW FILE
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const staffAuthSchema = new mongoose.Schema(
  {
    staffCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: [/^STAFF-[A-Z0-9]{6}$/, "Invalid staff code format"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    position: String,
    department: String,
    phone: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
staffAuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
staffAuthSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("StaffAuth", staffAuthSchema);
