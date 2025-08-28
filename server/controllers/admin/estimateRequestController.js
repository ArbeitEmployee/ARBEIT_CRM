// FileName: estimateRequestController.js
import EstimateRequest from "../../models/EstimateRequest.js";
import Customer from "../../models/Customer.js"; // Assuming you have a Customer model

// @desc    Get all estimate requests with customer details
// @route   GET /api/estimate-requests
// @access  Public
export const getEstimateRequests = async (req, res) => {
  try {
    const { search, status } = req.query;

    let filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        // { estimateNumber: { $regex: search, $options: 'i' } }, // Removed
        { projectName: { $regex: search, $options: 'i' } },
        // { tags: { $regex: search, $options: 'i' } }, // Removed
        { status: { $regex: search, $options: 'i' } },
        { amount: parseFloat(search) || 0 } // Search by amount if it's a number
      ];
      // Add customer search to $or if customer is populated
      // This requires a separate search for customer company/contact/email
      // For simplicity, we'll handle customer search in the frontend for now
      // or you can add a lookup stage in aggregation if needed for backend search
    }

    const estimateRequests = await EstimateRequest.find(filter)
      .populate('customer', 'company contact email phone')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalEstimates = await EstimateRequest.countDocuments();
    const draft = await EstimateRequest.countDocuments({ status: "Draft" });
    const sent = await EstimateRequest.countDocuments({ status: "Sent" });
    const accepted = await EstimateRequest.countDocuments({ status: "Accepted" });
    const rejected = await EstimateRequest.countDocuments({ status: "Rejected" });
    const expired = await EstimateRequest.countDocuments({ status: "Expired" });

    res.json({
      estimates: estimateRequests, // Renamed to estimates for consistency with frontend state
      stats: {
        totalEstimates,
        draft,
        sent,
        accepted,
        rejected,
        expired
      }
    });
  } catch (error) {
    console.error("Error fetching estimate requests:", error);
    res.status(500).json({ message: "Server error while fetching estimate requests" });
  }
};

// @desc    Create an estimate request
// @route   POST /api/estimate-requests
// @access  Public
export const createEstimateRequest = async (req, res) => {
  try {
    const {
      // estimateNumber, // Removed
      customerId,
      projectName,
      amount,
      // tags, // Removed
      createdDate,
      // validUntil, // Removed
      status,
      notes // Added notes field
    } = req.body;

    if (!customerId || !projectName || !amount || !createdDate) {
      return res.status(400).json({
        message: "Customer, Project Name, Amount, and Created Date are required fields"
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Generate estimate number if not provided (no longer needed)
    // const finalEstimateNumber = estimateNumber || `EST-${Date.now().toString().slice(-6)}`;

    const estimateRequest = new EstimateRequest({
      // estimateNumber: finalEstimateNumber, // Removed
      customerId,
      projectName,
      amount,
      // tags: tags || "", // Removed
      createdDate: new Date(createdDate),
      // validUntil: validUntil ? new Date(validUntil) : null, // Removed
      status: status || "Draft",
      notes: notes || ""
    });

    const createdEstimateRequest = await estimateRequest.save();
    const populatedEstimateRequest = await EstimateRequest.findById(createdEstimateRequest._id)
      .populate('customer', 'company contact email phone');

    res.status(201).json(populatedEstimateRequest);
  } catch (error) {
    console.error("Error creating estimate request:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message
    });
  }
};

// @desc    Update an estimate request
// @route   PUT /api/estimate-requests/:id
// @access  Public
export const updateEstimateRequest = async (req, res) => {
  try {
    const {
      // estimateNumber, // Removed
      customerId,
      projectName,
      amount,
      // tags, // Removed
      createdDate,
      // validUntil, // Removed
      status,
      notes // Added notes field
    } = req.body;

    if (!customerId || !projectName || !amount || !createdDate) {
      return res.status(400).json({
        message: "Customer, Project Name, Amount, and Created Date are required fields"
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const estimateRequest = await EstimateRequest.findById(req.params.id);

    if (!estimateRequest) {
      return res.status(404).json({ message: "Estimate request not found" });
    }

    // estimateRequest.estimateNumber = estimateNumber || estimateRequest.estimateNumber; // Removed
    estimateRequest.customerId = customerId;
    estimateRequest.projectName = projectName;
    estimateRequest.amount = amount;
    // estimateRequest.tags = tags || ""; // Removed
    estimateRequest.createdDate = new Date(createdDate);
    // estimateRequest.validUntil = validUntil ? new Date(validUntil) : null; // Removed
    estimateRequest.status = status || "Draft";
    estimateRequest.notes = notes || "";

    const updatedEstimateRequest = await estimateRequest.save();
    const populatedEstimateRequest = await EstimateRequest.findById(updatedEstimateRequest._id)
      .populate('customer', 'company contact email phone');

    res.json(populatedEstimateRequest);
  } catch (error) {
    console.error("Error updating estimate request:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message
    });
  }
};

// @desc    Delete an estimate request
// @route   DELETE /api/estimate-requests/:id
// @access  Public
export const deleteEstimateRequest = async (req, res) => {
  try {
    const estimateRequest = await EstimateRequest.findById(req.params.id);

    if (!estimateRequest) {
      return res.status(404).json({ message: "Estimate request not found" });
    }

    await EstimateRequest.deleteOne({ _id: req.params.id });
    res.json({ message: "Estimate request removed successfully" });
  } catch (error) {
    console.error("Error deleting estimate request:", error);
    res.status(500).json({ message: "Server error while deleting estimate request" });
  }
};

// @desc    Bulk delete estimate requests
// @route   POST /api/estimate-requests/bulk-delete
// @access  Public
export const bulkDeleteEstimateRequests = async (req, res) => {
  try {
    const { estimateIds } = req.body;

    if (!estimateIds || !Array.isArray(estimateIds) || estimateIds.length === 0) {
      return res.status(400).json({ message: "Estimate IDs are required" });
    }

    const result = await EstimateRequest.deleteMany({ _id: { $in: estimateIds } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No estimate requests found to delete" });
    }

    res.json({
      message: `${result.deletedCount} estimate request(s) deleted successfully`
    });
  } catch (error) {
    console.error("Error bulk deleting estimate requests:", error);
    res.status(500).json({ message: "Server error while bulk deleting estimate requests" });
  }
};

// @desc    Search customers by company name
// @route   GET /api/estimate-requests/customers/search
// @access  Public
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      company: { $regex: q, $options: 'i' }
    }).select('company contact email phone').limit(10);

    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};
