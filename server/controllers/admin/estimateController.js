import Estimate from "../../models/Estimate.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// ✅ Create Estimate
export const createEstimate = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.customer) {
      return errorResponse(res, 400, "Customer is required");
    }

    if (!req.body.reference) {
      return errorResponse(res, 400, "Reference is required");
    }

    // Validate items
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return errorResponse(res, 400, "At least one item is required");
    }

    // Validate item structure
    const invalidItems = req.body.items.filter(item => (
      !item.description ||
      typeof item.quantity !== "number" ||
      typeof item.rate !== "number"
    ));

    if (invalidItems.length > 0) {
      return errorResponse(res, 400, "Invalid items format");
    }

    // Create the estimate with admin reference
    const estimate = new Estimate({
      ...req.body,
      admin: req.admin._id // Add admin reference from auth middleware
    });

    await estimate.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Estimate created successfully",
      data: estimate 
    });
  } catch (error) {
    console.error("Create estimate error:", error);
    
    if (error.code === 11000) {
      return errorResponse(res, 400, "Estimate number conflict occurred");
    }
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    
    errorResponse(res, 500, "Server error while creating estimate", error);
  }
};

// ✅ Get All Estimates (for logged-in admin only)
export const getEstimates = async (req, res) => {
  try {
    const { status, customer } = req.query;
    const filter = { admin: req.admin._id }; // Only get estimates for this admin

    if (status) filter.status = status;
    if (customer) filter.customer = new RegExp(customer, "i");

    const estimates = await Estimate.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: estimates.length,
      data: estimates 
    });
  } catch (error) {
    console.error("Get estimates error:", error);
    errorResponse(res, 500, "Server error while fetching estimates", error);
  }
};

// ✅ Get Single Estimate by ID (admin-specific)
export const getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      admin: req.admin._id // Ensure the estimate belongs to this admin
    });

    if (!estimate) {
      return errorResponse(res, 404, "Estimate not found");
    }
    
    res.status(200).json({ 
      success: true, 
      data: estimate 
    });
  } catch (error) {
    console.error("Get estimate by ID error:", error);
    errorResponse(res, 500, "Server error while fetching estimate", error);
  }
};

// ✅ Update Estimate (admin-specific)
export const updateEstimate = async (req, res) => {
  try {
    // Prevent manual update of estimate number
    if (req.body.estimateNumber) {
      delete req.body.estimateNumber;
    }

    const estimate = await Estimate.findOneAndUpdate(
      { 
        _id: req.params.id,
        admin: req.admin._id // Ensure the estimate belongs to this admin
      },
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!estimate) {
      return errorResponse(res, 404, "Estimate not found");
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Estimate updated successfully",
      data: estimate 
    });
  } catch (error) {
    console.error("Update estimate error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    
    errorResponse(res, 500, "Server error while updating estimate", error);
  }
};

// ✅ Delete Estimate (admin-specific)
export const deleteEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id // Ensure the estimate belongs to this admin
    });
    
    if (!estimate) {
      return errorResponse(res, 404, "Estimate not found");
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Estimate deleted successfully",
      data: {
        id: estimate._id,
        estimateNumber: estimate.estimateNumber
      }
    });
  } catch (error) {
    console.error("Delete estimate error:", error);
    errorResponse(res, 500, "Server error while deleting estimate", error);
  }
};

// ✅ Get estimate stats (admin-specific)
export const getEstimateStats = async (req, res) => {
  try {
    const stats = await Estimate.aggregate([
      { $match: { admin: req.admin._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching estimate stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};