import Staff from "../../models/Staff.js";
import XLSX from "xlsx";
import { Readable } from "stream";
import {
  generateStaffCode,
  isValidStaffCode,
} from "../../utils/codeGenerator.js"; // Add this import

// Get all staffs for logged-in admin
export const getStaffs = async (req, res) => {
  try {
    const staffs = await Staff.find({ admin: req.admin._id }).sort({
      dateCreated: -1,
    });

    const totalStaffs = await Staff.countDocuments({ admin: req.admin._id });
    const activeStaffs = await Staff.countDocuments({
      admin: req.admin._id,
      active: true,
    });
    const inactiveStaffs = totalStaffs - activeStaffs;

    res.status(200).json({
      success: true,
      staffs,
      stats: {
        totalStaffs,
        activeStaffs,
        inactiveStaffs,
      },
    });
  } catch (error) {
    console.error("Error fetching staffs:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching staffs" });
  }
};

// Get single staff by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching staff" });
  }
};

// In createStaff function, add staff code handling:
export const createStaff = async (req, res) => {
  try {
    const { name, position, department, phone, email, active, staffCode } =
      req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required fields",
      });
    }

    // If staffCode provided, validate and check uniqueness
    let finalStaffCode = staffCode;
    if (staffCode && staffCode.trim() !== "") {
      if (!isValidStaffCode(staffCode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff code format. Must be like STAFF-ABC123",
        });
      }

      const normalizedCode = staffCode.toUpperCase();
      const existingStaff = await Staff.findOne({
        staffCode: normalizedCode,
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: "Staff code already exists",
        });
      }
      finalStaffCode = normalizedCode;
    } else {
      // Generate a unique staff code if not provided (same as customer approach)
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        finalStaffCode = generateStaffCode();

        const existingStaff = await Staff.findOne({
          staffCode: finalStaffCode,
        });

        if (!existingStaff) {
          isUnique = true;
        }

        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate unique staff code",
        });
      }
    }

    const newStaff = new Staff({
      admin: req.admin.id,
      staffCode: finalStaffCode,
      name,
      position,
      department,
      phone,
      email,
      active: active !== undefined ? active : true,
    });

    await newStaff.save();

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: newStaff,
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating staff",
      error: error.message,
    });
  }
};

// Update staff
export const updateStaff = async (req, res) => {
  try {
    const { name, position, department, phone, email, active } = req.body;

    const staff = await Staff.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    // Check email uniqueness
    if (email && email !== staff.email) {
      const existingStaff = await Staff.findOne({
        admin: req.admin._id,
        email,
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: "Another staff with this email already exists",
        });
      }
    }

    staff.name = name ?? staff.name;
    staff.position = position ?? staff.position;
    staff.department = department ?? staff.department;
    staff.phone = phone ?? staff.phone;
    staff.email = email ?? staff.email;
    staff.active = active ?? staff.active;

    await staff.save();

    res
      .status(200)
      .json({ success: true, message: "Staff updated successfully", staff });
  } catch (error) {
    console.error("Error updating staff:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating staff" });
  }
};

// Toggle staff active status
export const toggleStaffActive = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    staff.active = !staff.active;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff ${
        staff.active ? "activated" : "deactivated"
      } successfully`,
      staff,
    });
  } catch (error) {
    console.error("Error toggling staff status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating staff status",
    });
  }
};

// Delete staff
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting staff" });
  }
};

// Import staffs (scoped by admin)
export const importStaffs = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const results = [];
    const errorMessages = [];

    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

    if (fileExtension === "csv") {
      // process CSV
      const csvText = fileBuffer.toString();
      const rows = csvText.split(/\r?\n/).filter((r) => r.trim());
      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx];
        });
        results.push(row);
      }
    } else if (["xlsx", "xls"].includes(fileExtension)) {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      results.push(...XLSX.utils.sheet_to_json(worksheet));
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file format" });
    }

    const staffsToImport = [];
    for (const row of results) {
      const name = row.name || row.Name;
      const email = row.email || row.Email;
      if (!name || !email) continue;

      const exists = await Staff.findOne({
        admin: req.admin._id,
        email: email.toLowerCase(),
      });
      if (exists) {
        errorMessages.push(`Staff with email ${email} already exists`);
        continue;
      }

      staffsToImport.push({
        admin: req.admin._id,
        name,
        email: email.toLowerCase(),
        position: row.position || row.Position || "",
        department: row.department || row.Department || "",
        phone: row.phone || row.Phone || "",
        active: true,
      });
    }

    let importedCount = 0;
    if (staffsToImport.length > 0) {
      const inserted = await Staff.insertMany(staffsToImport, {
        ordered: false,
      });
      importedCount = inserted.length;
    }

    res.status(200).json({ success: true, importedCount, errorMessages });
  } catch (error) {
    console.error("Error importing staffs:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while importing staffs" });
  }
};
