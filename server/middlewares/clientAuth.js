import jwt from "jsonwebtoken";
import Client from "../models/Client.js";

export const clientProtect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.id).select("-password");
    
    if (!client) {
      return res.status(401).json({ message: "Client not found" });
    }

    req.client = client;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};