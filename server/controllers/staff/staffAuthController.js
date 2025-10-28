import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Staff from "../../models/staffLogReg.js";
import sendEmail from "../../utils/sendEmail.js";

// STAFF REGISTER
export const registerStaff = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, staffCode } = req.body;

    if (!name || !email || !password || !confirmPassword || !staffCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Validate staff code (frontend simulation - in real app, validate against predefined codes)
    const validStaffCodes = ["STAFF-2024", "STAFF-ADMIN", "STAFF-RECRUIT"];
    if (!validStaffCodes.includes(staffCode.toUpperCase())) {
      return res
        .status(400)
        .json({ message: "Invalid staff registration code" });
    }

    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const staff = await Staff.register({
      name,
      email,
      password,
      staffCode: staffCode.toUpperCase(),
    });

    // Return staff without password
    const staffResponse = {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      staffCode: staff.staffCode,
      createdAt: staff.createdAt,
    };

    res.status(201).json({
      message: "Staff registered successfully",
      staff: staffResponse,
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// STAFF LOGIN
export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const staff = await Staff.findByEmail(email.toLowerCase());
    if (!staff) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!staff.isActive) {
      return res.status(400).json({
        message: "Staff account is inactive. Please contact administrator.",
      });
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: staff._id,
        email: staff.email,
        type: "staff",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    staff.lastLogin = new Date();
    await staff.save();

    // Return staff data along with token
    res.json({
      message: "Staff login successful",
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        staffCode: staff.staffCode,
        lastLogin: staff.lastLogin,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// STAFF FORGOT PASSWORD - SEND RESET CODE
export const staffForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const staff = await Staff.findByEmail(email.toLowerCase());
    if (!staff) {
      return res
        .status(404)
        .json({ message: "No staff account found with this email" });
    }

    if (!staff.isActive) {
      return res.status(400).json({
        message: "Staff account is inactive. Please contact administrator.",
      });
    }

    const resetCode = staff.generateResetCode();
    await staff.save();

    try {
      await sendEmail(
        email,
        "Staff Password Reset Code",
        `Your staff password reset code is: ${resetCode}. This code will expire in 10 minutes.`
      );
      res.json({ message: "Reset code sent to your staff email" });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Clear the reset code if email fails
      staff.resetCode = undefined;
      staff.resetCodeExpire = undefined;
      await staff.save();

      res
        .status(500)
        .json({ message: "Failed to send reset code. Please try again." });
    }
  } catch (error) {
    console.error("Staff forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// STAFF VERIFY RESET CODE
export const staffVerifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const staff = await Staff.findByEmail(email.toLowerCase());
    if (!staff) {
      return res.status(404).json({ message: "Staff email not found" });
    }

    const isValid = staff.verifyResetCode(code);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Staff verify reset code error:", error);
    res.status(500).json({ message: error.message });
  }
};

// STAFF RESET PASSWORD (AFTER CODE VERIFIED)
export const staffResetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const staff = await Staff.findByEmail(email.toLowerCase());
    if (!staff) {
      return res.status(404).json({ message: "Staff email not found" });
    }

    // Verify code again before resetting password
    const isValid = staff.verifyResetCode(code);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Update password
    staff.password = newPassword; // This will be hashed by the pre-save middleware
    staff.resetCode = undefined;
    staff.resetCodeExpire = undefined;
    await staff.save();

    res.json({ message: "Staff password reset successful" });
  } catch (error) {
    console.error("Staff reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// STAFF CHANGE PASSWORD
export const staffChangePassword = async (req, res) => {
  try {
    const staffId = req.staff._id;
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Verify old password
    const isOldPasswordValid = await staff.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update password
    staff.password = newPassword; // This will be hashed by the pre-save middleware
    await staff.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Staff change password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET STAFF PROFILE
export const getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff._id).select(
      "-password -resetCode -resetCodeExpire"
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(staff);
  } catch (error) {
    console.error("Get staff profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STAFF PROFILE
export const updateStaffProfile = async (req, res) => {
  try {
    const staffId = req.staff._id;
    const { name, phone } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Update fields
    if (name) staff.name = name;
    if (phone !== undefined) staff.phone = phone;

    await staff.save();

    // Return updated staff without sensitive data
    const updatedStaff = await Staff.findById(staffId).select(
      "-password -resetCode -resetCodeExpire"
    );

    res.json({
      message: "Staff profile updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Update staff profile error:", error);
    res.status(500).json({ message: error.message });
  }
};
