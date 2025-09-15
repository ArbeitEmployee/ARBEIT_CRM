import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Client from "../../models/Client.js";
import Customer from "../../models/Customer.js";
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

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Verify the customer code is valid
    const customerRecord = await Customer.findOne({ 
      customerCode: customerCode.toUpperCase() 
    });
    
    if (!customerRecord) {
      return res.status(400).json({ message: "Invalid customer code. Please check with your administrator." });
    }
    
    // Check if this customer code is already registered
    const existingClientWithCode = await Client.findOne({ customerCode: customerCode.toUpperCase() });
    if (existingClientWithCode) {
      return res.status(400).json({ message: "Customer code already registered" });
    }

    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const client = await Client.create({
      name,
      email: email.toLowerCase(),
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
      admin: customerRecord.admin,
      customer: customerRecord._id,
      isActive: true
    });

    // Return client without password
    const clientResponse = {
      id: client._id,
      name: client.name,
      email: client.email,
      companyName: client.companyName,
      customerCode: client.customerCode
    };

    res.status(201).json({ 
      message: "Client registered successfully", 
      client: clientResponse 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN CLIENT - Updated to return client data including admin ID
export const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const client = await Client.findOne({ email: email.toLowerCase() })
      .populate('customer', 'company contact email phone customerCode')
      .populate('admin', 'name email');
      
    if (!client) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!client.isActive) {
      return res.status(400).json({ message: "Account is inactive. Please contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { 
        id: client._id, 
        email: client.email,
        type: 'client'
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    client.lastLogin = new Date();
    await client.save();

    // Return client data along with token
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
        admin: client.admin,
        customer: client.customer
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD - SEND OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!client.isActive) {
      return res.status(400).json({ message: "Account is inactive. Please contact administrator." });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    client.resetCode = resetCode;
    client.resetCodeExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await client.save();

    try {
      await sendEmail(
        email,
        "Password Reset Code",
        `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`
      );
      res.json({ message: "Reset code sent to your email" });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Clear the reset code if email fails
      client.resetCode = undefined;
      client.resetCodeExpire = undefined;
      await client.save();
      
      res.status(500).json({ message: "Failed to send reset code. Please try again." });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// VERIFY RESET CODE
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!client.resetCode || !client.resetCodeExpire) {
      return res.status(400).json({ message: "No reset code found. Please request a new one." });
    }

    if (client.resetCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (client.resetCodeExpire < Date.now()) {
      // Clear expired code
      client.resetCode = undefined;
      client.resetCodeExpire = undefined;
      await client.save();
      return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
    }

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD (AFTER CODE VERIFIED)
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!client.resetCode || !client.resetCodeExpire) {
      return res.status(400).json({ message: "No verification process found" });
    }

    if (client.resetCode !== code || client.resetCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    client.password = hashedPassword;
    client.resetCode = undefined;
    client.resetCodeExpire = undefined;
    await client.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const clientId = req.client._id; // from protect middleware
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, client.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, client.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be the same as old password" });
    }

    // Update password
    client.password = await bcrypt.hash(newPassword, 12);
    await client.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET CLIENT PROFILE
export const getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.client._id)
      .select('-password -resetCode -resetCodeExpire')
      .populate('customer', 'company contact email phone customerCode')
      .populate('admin', 'name email');

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CLIENT PROFILE
export const updateClientProfile = async (req, res) => {
  try {
    const clientId = req.client._id;
    const {
      name,
      phone,
      website,
      position,
      companyName,
      vatNumber,
      companyPhone,
      country,
      city,
      address,
      zipCode
    } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Update fields
    if (name) client.name = name;
    if (phone !== undefined) client.phone = phone;
    if (website !== undefined) client.website = website;
    if (position !== undefined) client.position = position;
    if (companyName) client.companyName = companyName;
    if (vatNumber !== undefined) client.vatNumber = vatNumber;
    if (companyPhone !== undefined) client.companyPhone = companyPhone;
    if (country !== undefined) client.country = country;
    if (city !== undefined) client.city = city;
    if (address !== undefined) client.address = address;
    if (zipCode !== undefined) client.zipCode = zipCode;

    await client.save();

    // Return updated client without sensitive data
    const updatedClient = await Client.findById(clientId)
      .select('-password -resetCode -resetCodeExpire')
      .populate('customer', 'company contact email phone customerCode')
      .populate('admin', 'name email');

    res.json({ 
      message: "Profile updated successfully", 
      client: updatedClient 
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};