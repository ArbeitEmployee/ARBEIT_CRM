import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Client from "../../models/Client.js";
import Customer from "../../models/Customer.js"; // Added missing import
import sendEmail from "../../utils/sendEmail.js";

// REGISTER CLIENT - Fixed for customer code system
export const registerClient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      website,
      position,
      password,
      confirmPassword,
      companyName,
      vatNumber,
      companyPhone,
      country,
      city,
      address,
      zipCode,
      customerCode
    } = req.body;

    if (!name || !email || !password || !confirmPassword || !companyName || !customerCode) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verify the customer code is valid
    const customerRecord = await Customer.findOne({ 
      customerCode: customerCode.toUpperCase() 
    });
    
    if (!customerRecord) {
      return res.status(400).json({ message: "Invalid customer code" });
    }
    
    // Check if this customer code is already registered
    const existingClientWithCode = await Client.findOne({ customerCode: customerCode.toUpperCase() });
    if (existingClientWithCode) {
      return res.status(400).json({ message: "Customer code already registered" });
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await Client.create({
      name,
      email,
      phone,
      website,
      position,
      password: hashedPassword,
      companyName,
      vatNumber,
      companyPhone,
      country,
      city,
      address,
      zipCode,
      customerCode: customerCode.toUpperCase(),
      admin: customerRecord.admin, // Get from customer record
      customer: customerRecord._id // Get from customer record
    });

    res.status(201).json({ message: "Client registered successfully", client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN CLIENT - Updated to return client data including admin ID
export const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: client._id, email: client.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Update last login
    client.lastLogin = new Date();
    await client.save();

    // Return client data along with token including admin ID
    res.json({ 
      message: "Login successful", 
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyName: client.companyName,
        customerCode: client.customerCode,
        admin: client.admin // Include admin ID
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD - SEND OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const client = await Client.findOne({ email });
    if (!client) return res.status(404).json({ message: "Email not found" });

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    client.resetCode = resetCode;
    client.resetCodeExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await client.save();

    await sendEmail(
      email,
      "Password Reset Code",
      `Your password reset code is ${resetCode}`
    );

    res.json({ message: "Reset code sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY RESET CODE
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const client = await Client.findOne({ email });
    if (!client) return res.status(404).json({ message: "Email not found" });

    if (!client.resetCode || !client.resetCodeExpire) {
      return res.status(400).json({ message: "No reset code found" });
    }

    if (client.resetCode !== code || client.resetCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD (AFTER CODE VERIFIED)
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const client = await Client.findOne({ email });
    if (!client) return res.status(404).json({ message: "Email not found" });

    if (!client.resetCode || !client.resetCodeExpire) {
      return res.status(400).json({ message: "No verification process found" });
    }

    if (client.resetCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Reset code expired" });
    }

    client.password = await bcrypt.hash(newPassword, 10);
    client.resetCode = undefined;
    client.resetCodeExpire = undefined;
    await client.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};