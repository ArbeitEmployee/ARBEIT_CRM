import Estimate from "../../models/Estimate.js";

// ✅ Create Estimate
export const createEstimate = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.customer) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer is required" 
      });
    }

    if (!req.body.reference) {
      return res.status(400).json({ 
        success: false, 
        message: "Reference is required" 
      });
    }

    // Validate items
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one item is required" 
      });
    }

    // Create the estimate
    const estimate = new Estimate(req.body);
    
    // Manually calculate values to ensure they're correct
    estimate.subtotal = estimate.items.reduce(
      (sum, item) => sum + (item.quantity * item.rate),
      0
    );

    estimate.discount = estimate.discountType === "percent"
      ? estimate.subtotal * (estimate.discountValue / 100)
      : estimate.discountValue;

    estimate.total = estimate.subtotal - estimate.discount;

    await estimate.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Estimate created successfully",
      data: estimate 
    });
  } catch (error) {
    console.error("Create estimate error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Get All Estimates
export const getEstimates = async (req, res) => {
  try {
    const estimates = await Estimate.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      data: estimates 
    });
  } catch (error) {
    console.error("Get estimates error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Get Single Estimate by ID
export const getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: "Estimate not found" 
      });
    }
    res.status(200).json({ 
      success: true, 
      data: estimate 
    });
  } catch (error) {
    console.error("Get estimate by ID error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Update Estimate
export const updateEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: "Estimate not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Estimate updated successfully",
      data: estimate 
    });
  } catch (error) {
    console.error("Update estimate error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ✅ Delete Estimate
export const deleteEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findByIdAndDelete(req.params.id);
    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: "Estimate not found" 
      });
    }
    res.status(200).json({ 
      success: true, 
      message: "Estimate deleted successfully" 
    });
  } catch (error) {
    console.error("Delete estimate error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};