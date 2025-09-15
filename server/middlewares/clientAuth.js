import jwt from "jsonwebtoken";
import Client from "../models/Client.js";

export const clientProtect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.id)
      .select("-password")
      .populate('customer', 'company contact email phone customerCode')
      .populate('admin', 'name email');
    
    if (!client) {
      return res.status(401).json({ message: "Client not found" });
    }

    if (!client.isActive) {
      return res.status(401).json({ message: "Client account is inactive" });
    }

    req.client = client;
    next();
  } catch (error) {
    console.error("Client auth error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else {
      return res.status(500).json({ message: "Server error in authentication" });
    }
  }
};