import jwt from "jsonwebtoken";
import Staff from "../models/staffLogReg.js";

export const staffProtect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized to access this route",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is for staff
      if (decoded.type !== "staff") {
        return res.status(401).json({
          message: "Invalid token type for staff access",
        });
      }

      const staff = await Staff.findById(decoded.id).select("-password");

      if (!staff) {
        return res.status(401).json({
          message: "Staff not found",
        });
      }

      if (!staff.isActive) {
        return res.status(401).json({
          message: "Staff account is inactive",
        });
      }

      req.staff = staff;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
