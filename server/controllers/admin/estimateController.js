import Estimate from "../../models/Estimate.js";

// ✅ Create Estimate
export const createEstimate = async (req, res) => {
  try {
    const estimate = new Estimate(req.body);
    await estimate.save();
    res.status(201).json({ success: true, data: estimate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Estimates
export const getEstimates = async (req, res) => {
  try {
    const estimates = await Estimate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: estimates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Estimate by ID
export const getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }
    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }
    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Estimate
export const deleteEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findByIdAndDelete(req.params.id);
    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }
    res.status(200).json({ success: true, message: "Estimate deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
