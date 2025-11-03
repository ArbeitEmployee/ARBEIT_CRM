// controllers/staffAuthController.js - NEW FILE
import StaffAuth from "../../models/StaffAuth.js";
import Staff from "../../models/Staff.js"; // Your existing Staff model
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../../utils/sendEmail.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Validate staff code against existing Staff records
export const validateStaffCode = async (req, res) => {
  try {
    const { staffCode } = req.body;

    if (!staffCode) {
      return res.status(400).json({
        success: false,
        message: "Staff code is required",
      });
    }

    // Check if staff code exists in Staff collection (admin-created staff)
    const staff = await Staff.findOne({
      staffCode: staffCode.toUpperCase(),
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Invalid staff code. Please contact your administrator.",
      });
    }

    // Check if staff is active
    if (!staff.active) {
      return res.status(400).json({
        success: false,
        message:
          "This staff account is inactive. Please contact administrator.",
      });
    }

    // Check if already registered
    const existingAuth = await StaffAuth.findOne({
      staffCode: staffCode.toUpperCase(),
    });
    if (existingAuth) {
      return res.status(400).json({
        success: false,
        message: "This staff code is already registered. Please login instead.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      staff: {
        staffCode: staff.staffCode,
        name: staff.name,
        email: staff.email,
        position: staff.position,
        department: staff.department,
        phone: staff.phone,
      },
      message: "Staff code validated successfully",
    });
  } catch (error) {
    console.error("Validate staff code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during code validation",
    });
  }
};

// Staff Registration
export const staffRegister = async (req, res) => {
  try {
    const { staffCode, name, email, password, confirmPassword } = req.body;

    // Validation
    if (!staffCode || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Verify staff code exists in Staff collection
    const staffRecord = await Staff.findOne({
      staffCode: staffCode.toUpperCase(),
      active: true,
    });

    if (!staffRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive staff code",
      });
    }

    // Check if already registered
    const existingStaff = await StaffAuth.findOne({
      $or: [
        { staffCode: staffCode.toUpperCase() },
        { email: email.toLowerCase() },
      ],
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff already registered. Please login instead.",
      });
    }

    // Create staff auth record
    const staffAuth = await StaffAuth.create({
      staffCode: staffCode.toUpperCase(),
      name,
      email: email.toLowerCase(),
      password,
      position: staffRecord.position,
      department: staffRecord.department,
      phone: staffRecord.phone,
    });

    // Generate token
    const token = generateToken(staffAuth._id);

    res.status(201).json({
      success: true,
      message: "Staff registration successful",
      token,
      staff: {
        id: staffAuth._id,
        staffCode: staffAuth.staffCode,
        name: staffAuth.name,
        email: staffAuth.email,
        position: staffAuth.position,
        department: staffAuth.department,
      },
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Staff Login
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find staff by email
    const staff = await StaffAuth.findOne({ email: email.toLowerCase() });

    if (!staff || !(await staff.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!staff.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Update last login
    staff.lastLogin = new Date();
    await staff.save();

    // Generate token
    const token = generateToken(staff._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      staff: {
        id: staff._id,
        staffCode: staff.staffCode,
        name: staff.name,
        email: staff.email,
        position: staff.position,
        department: staff.department,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Password Reset Functions (simplified version)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const staff = await StaffAuth.findOne({ email: email.toLowerCase() });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "No staff found with this email",
      });
    }

    // Generate simple 4-digit code (in production, use proper reset tokens)
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store reset code temporarily (in production, use database field with expiry)
    staff.resetCode = resetCode;
    staff.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await staff.save();

    // Send email (you'll need to implement sendEmail function)
    // await sendEmail({
    //   email: staff.email,
    //   subject: 'Password Reset Code',
    //   message: `Your password reset code is: ${resetCode}`
    // });

    res.status(200).json({
      success: true,
      message: `Reset code sent to your email: ${resetCode}`, // Remove this in production
      code: resetCode, // Remove this in production - only for testing
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending reset code",
    });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const staff = await StaffAuth.findOne({
      email: email.toLowerCase(),
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() },
    });

    if (!staff) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying reset code",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const staff = await StaffAuth.findOne({
      email: email.toLowerCase(),
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() },
    });

    if (!staff) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    staff.password = newPassword;
    staff.resetCode = undefined;
    staff.resetCodeExpires = undefined;
    await staff.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

// Get staff profile
export const getStaffProfile = async (req, res) => {
  try {
    const staff = await StaffAuth.findById(req.params.id).select("-password");
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
    res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Get staff profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
};

// Update staff profile
export const updateStaffProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const staff = await StaffAuth.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    staff.name = name || staff.name;
    staff.email = email || staff.email;
    staff.phone = phone || staff.phone;

    await staff.save();

    const staffResponse = await StaffAuth.findById(req.params.id).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      staff: staffResponse,
    });
  } catch (error) {
    console.error("Update staff profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};
