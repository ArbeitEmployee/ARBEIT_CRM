import mongoose from "mongoose";
import { generateStaffCode } from "../utils/codeGenerator.js";

const staffSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    staffCode: {
      // ADD THIS NEW FIELD
      type: String,
      unique: true,
      required: true,
      index: true,
      uppercase: true,
      match: [/^STAFF-[A-Z0-9]{6}$/, "Invalid staff code format"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    active: {
      type: Boolean,
      default: true,
    },
    dateCreated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
staffSchema.index({ admin: 1, email: 1 }, { unique: true }); // each admin must have unique staff email
staffSchema.index({ admin: 1, name: 1 });
staffSchema.index({ admin: 1, department: 1 });
staffSchema.index({ admin: 1, position: 1 });
staffSchema.index({ admin: 1, active: 1 });
//staffSchema.index({ staffCode: "text" }); // Add to text index for search

// Text index for search functionality
staffSchema.index({
  name: "text",
  email: "text",
  position: "text",
  department: "text",
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
