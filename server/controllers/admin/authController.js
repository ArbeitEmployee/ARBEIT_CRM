import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";
import sendEmail from "../../utils/sendEmail.js";

// REGISTER ADMIN
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();

    let role = "admin";
    let status = "pending";

    if (adminCount === 0) {
      // First registration → superAdmin
      role = "superAdmin";
      status = "approved";
    }

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
      status
    });

    res.status(201).json({
      message: role === "superAdmin"
        ? "SuperAdmin registered successfully."
        : "Registration successful. Await superAdmin approval.",
      admin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN ADMIN
// LOGIN ADMIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    if (admin.status === "pending")
      return res.status(403).json({ message: "Your account is pending approval from the superAdmin." });
    if (admin.status === "rejected")
      return res.status(403).json({ message: "Your account has been rejected by the superAdmin." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // send admin data along with token
    res.json({ 
      message: "Login successful", 
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        image: admin.image || null, // default null if no image uploaded
        status: admin.status,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all admins (superAdmin only)
export const getAllAdmins = async (req, res) => {
  try {
    // Exclude the password field from the response
    const admins = await Admin.find().select('-password');
    
    res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Server error while fetching admins' });
  }
};

// Update admin status
export const updateAdminStatus = async (req, res) => {
  try {
    const { adminId, status } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Prevent status change for superAdmin
    if (admin.role === "superAdmin") {
      return res.status(400).json({ message: 'Cannot change status of superAdmin' });
    }
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { status },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({ message: 'Status updated successfully', admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, role, status } = req.body;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Prevent role change for superAdmin
    if (admin.role === "superAdmin" && role && role !== "superAdmin") {
      return res.status(400).json({ message: 'Cannot change role of superAdmin' });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && admin.role !== "superAdmin") updateData.role = role; // Only update role if not superAdmin
    if (status) updateData.status = status;
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({ message: 'Admin updated successfully', admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error while updating admin' });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Prevent deleting superAdmin
    if (admin.role === "superAdmin") {
      return res.status(400).json({ message: 'Cannot delete superAdmin account' });
    }
    
    // Prevent superAdmin from deleting themselves
    if (req.admin.id.toString() === adminId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await Admin.findByIdAndDelete(adminId);
    
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Server error while deleting admin' });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Email not found" });

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    admin.resetCode = resetCode;
    admin.resetCodeExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await admin.save();

    await sendEmail(email, "Password Reset Code", `Your password reset code is ${resetCode}`);

    res.json({ message: "Reset code sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY RESET CODE
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Email not found" });

    if (!admin.resetCode || !admin.resetCodeExpire)
      return res.status(400).json({ message: "No reset code found" });

    if (admin.resetCode !== code || admin.resetCodeExpire < Date.now())
      return res.status(400).json({ message: "Invalid or expired code" });

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Email not found" });

    if (!admin.resetCode || !admin.resetCodeExpire)
      return res.status(400).json({ message: "No verification process found" });

    if (admin.resetCodeExpire < Date.now())
      return res.status(400).json({ message: "Reset code expired" });

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetCode = undefined;
    admin.resetCodeExpire = undefined;
    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// CHANGE PASSWORD 
export const changePassword = async (req, res) => {
  try {
    const adminId = req.admin.id; // from protect middleware
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Both fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
