import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";
import sendEmail from "../../utils/sendEmail.js";

// REGISTER ADMIN
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || "admin",
      status: "pending" // default to pending
    });

    res.status(201).json({ message: "Registration successful. Await superAdmin approval.", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN ADMIN
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    // Check approval
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

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//update status
export const updateAdminStatus = async (req, res) => {
  try {
    const { adminId, status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.status = status;
    await admin.save();

    res.json({ message: `Admin status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// FORGOT PASSWORD - SEND OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Email not found" });

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    admin.resetCode = resetCode;
    admin.resetCodeExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    await sendEmail(email, "Password Reset Code", `Your password reset code is ${resetCode}`);

    res.json({ message: "Reset code sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// VERIFY RESET CODE ONLY
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Email not found" });

    if (!admin.resetCode || !admin.resetCodeExpire)
      return res.status(400).json({ message: "No reset code found" });

    if (admin.resetCode !== code || admin.resetCodeExpire < Date.now())
      return res.status(400).json({ message: "Invalid or expired code" });

    // If valid, just confirm success without changing password
    res.json({ message: "Code verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


  // RESET PASSWORD (AFTER CODE VERIFIED)
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




