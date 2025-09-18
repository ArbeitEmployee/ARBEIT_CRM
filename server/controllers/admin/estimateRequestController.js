// File: controllers/admin/estimateRequestController.js
import EstimateRequest from "../../models/EstimateRequest.js";
import Customer from "../../models/Customer.js";

// @desc    Get all estimate requests with customer details for logged-in admin
// @route   GET /api/estimate-requests
// @access  Private
export const getEstimateRequests = async (req, res) => {
  try {
    const { search, status } = req.query;

    let filter = { admin: req.admin._id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { amount: parseFloat(search) || 0 },
      ];
    }

    const estimateRequests = await EstimateRequest.find(filter)
      .populate("customer", "company contact email phone customerCode")
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalEstimates = await EstimateRequest.countDocuments({
      admin: req.admin._id,
    });
    const draft = await EstimateRequest.countDocuments({
      admin: req.admin._id,
      status: "Draft",
    });
    const sent = await EstimateRequest.countDocuments({
      admin: req.admin._id,
      status: "Sent",
    });
    const accepted = await EstimateRequest.countDocuments({
      admin: req.admin._id,
      status: "Accepted",
    });
    const rejected = await EstimateRequest.countDocuments({
      admin: req.admin._id,
      status: "Rejected",
    });
    const expired = await EstimateRequest.countDocuments({
      admin: req.admin._id,
      status: "Expired",
    });

    res.json({
      estimates: estimateRequests,
      stats: {
        totalEstimates,
        draft,
        sent,
        accepted,
        rejected,
        expired,
      },
    });
  } catch (error) {
    console.error("Error fetching estimate requests:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching estimate requests" });
  }
};

// @desc    Create an estimate request for logged-in admin
// @route   POST /api/estimate-requests
// @access  Private
export const createEstimateRequest = async (req, res) => {
  try {
    const { customerId, projectName, amount, createdDate, status, notes } =
      req.body;

    if (!customerId || !projectName || !amount || !createdDate) {
      return res.status(400).json({
        message:
          "Customer, Project Name, Amount, and Created Date are required fields",
      });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({
      _id: customerId,
      admin: req.admin._id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const estimateRequest = new EstimateRequest({
      admin: req.admin._id,
      customerId,
      projectName,
      amount,
      createdDate: new Date(createdDate),
      status: status || "Draft",
      notes: notes || "",
    });

    const createdEstimateRequest = await estimateRequest.save();
    const populatedEstimateRequest = await EstimateRequest.findById(
      createdEstimateRequest._id
    ).populate("customer", "company contact email phone customerCode");

    res.status(201).json(populatedEstimateRequest);
  } catch (error) {
    console.error("Error creating estimate request:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message,
    });
  }
};

// @desc    Update an estimate request for logged-in admin
// @route   PUT /api/estimate-requests/:id
// @access  Private
export const updateEstimateRequest = async (req, res) => {
  try {
    const { customerId, projectName, amount, createdDate, status, notes } =
      req.body;

    if (!customerId || !projectName || !amount || !createdDate) {
      return res.status(400).json({
        message:
          "Customer, Project Name, Amount, and Created Date are required fields",
      });
    }

    // Check if estimate request exists and belongs to the admin
    const estimateRequest = await EstimateRequest.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });
    if (!estimateRequest) {
      return res.status(404).json({ message: "Estimate request not found" });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({
      _id: customerId,
      admin: req.admin._id,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    estimateRequest.customerId = customerId;
    estimateRequest.projectName = projectName;
    estimateRequest.amount = amount;
    estimateRequest.createdDate = new Date(createdDate);
    estimateRequest.status = status || "Draft";
    estimateRequest.notes = notes || "";

    // If status is being changed to "Sent", update the sent date
    if (status === "Sent" && estimateRequest.status !== "Sent") {
      estimateRequest.sentDate = new Date();
    }

    const updatedEstimateRequest = await estimateRequest.save();
    const populatedEstimateRequest = await EstimateRequest.findById(
      updatedEstimateRequest._id
    ).populate("customer", "company contact email phone customerCode");

    res.json(populatedEstimateRequest);
  } catch (error) {
    console.error("Error updating estimate request:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message,
    });
  }
};

// @desc    Delete an estimate request for logged-in admin
// @route   DELETE /api/estimate-requests/:id
// @access  Private
export const deleteEstimateRequest = async (req, res) => {
  try {
    const estimateRequest = await EstimateRequest.findOne({
      _id: req.params.id,
      admin: req.admin._id,
    });

    if (!estimateRequest) {
      return res.status(404).json({ message: "Estimate request not found" });
    }

    await EstimateRequest.deleteOne({
      _id: req.params.id,
      admin: req.admin._id,
    });
    res.json({ message: "Estimate request removed successfully" });
  } catch (error) {
    console.error("Error deleting estimate request:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting estimate request" });
  }
};

// @desc    Bulk delete estimate requests for logged-in admin
// @route   POST /api/estimate-requests/bulk-delete
// @access  Private
export const bulkDeleteEstimateRequests = async (req, res) => {
  try {
    const { estimateIds } = req.body;

    if (
      !estimateIds ||
      !Array.isArray(estimateIds) ||
      estimateIds.length === 0
    ) {
      return res.status(400).json({ message: "Estimate IDs are required" });
    }

    const result = await EstimateRequest.deleteMany({
      _id: { $in: estimateIds },
      admin: req.admin._id,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No estimate requests found to delete" });
    }

    res.json({
      message: `${result.deletedCount} estimate request(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error bulk deleting estimate requests:", error);
    res
      .status(500)
      .json({ message: "Server error while bulk deleting estimate requests" });
  }
};

// @desc    Search customers by company name for logged-in admin
// @route   GET /api/estimate-requests/customers/search
// @access  Private
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      admin: req.admin._id,
      company: { $regex: q, $options: "i" },
    })
      .select("company contact email phone customerCode")
      .limit(10);

    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};

// @desc    Get customer by customer code for logged-in admin
// @route   GET /api/estimate-requests/customers/by-code/:code
// @access  Private
export const getCustomerByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 4) {
      return res.status(400).json({ message: "Customer code is required" });
    }

    const customer = await Customer.findOne({
      admin: req.admin._id,
      customerCode: code.toUpperCase(),
    }).select("_id company contact email phone customerCode");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ customer });
  } catch (error) {
    console.error("Error finding customer by code:", error);
    res.status(500).json({ message: "Server error while searching customer" });
  }
};
