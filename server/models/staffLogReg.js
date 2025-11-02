import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const staffLogRegSchema = new mongoose.Schema(
  {
    // Basic Information (used in registration)
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      //unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // Staff Code Validation (used in registration)
    staffCode: {
      type: String,
      required: [true, "Staff registration code is required"],
      uppercase: true,
      trim: true,
    },

    // Status & Login (used in login)
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },

    // Password Reset (used in forgot password)
    resetCode: {
      type: String,
    },
    resetCodeExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
staffLogRegSchema.index({ email: 1 });
staffLogRegSchema.index({ staffCode: 1 });
staffLogRegSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
staffLogRegSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for uppercase fields
staffLogRegSchema.pre("save", function (next) {
  if (this.staffCode) {
    this.staffCode = this.staffCode.toUpperCase();
  }
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Method to compare password (used in login)
staffLogRegSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate reset code (used in forgot password)
staffLogRegSchema.methods.generateResetCode = function () {
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  this.resetCode = code;
  this.resetCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

// Method to verify reset code (used in forgot password step 2)
staffLogRegSchema.methods.verifyResetCode = function (code) {
  return this.resetCode === code && this.resetCodeExpire > Date.now();
};

// Static method to find staff by email (used in login & forgot password)
staffLogRegSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method for staff registration (used in registration)
staffLogRegSchema.statics.register = async function (staffData) {
  const { name, email, password, staffCode } = staffData;

  // Check if email already exists
  const existingStaff = await this.findOne({ email: email.toLowerCase() });
  if (existingStaff) {
    throw new Error("Email already exists");
  }

  const staff = new this({
    name,
    email,
    password,
    staffCode,
  });

  return await staff.save();
};

// Remove sensitive information when converting to JSON
staffLogRegSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetCode;
    delete ret.resetCodeExpire;
    return ret;
  },
});

// Change model name to "StaffAuth" to avoid conflict with Staff model
const StaffLogReg = mongoose.model("StaffLogReg", staffLogRegSchema);

export default StaffLogReg;
