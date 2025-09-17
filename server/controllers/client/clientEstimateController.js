import Estimate from "../../models/Estimate.js";
import Client from "../../models/Client.js";

// @desc    Get all estimates for a specific client
// @route   GET /api/client/estimates
// @access  Private (Client)
export const getClientEstimates = async (req, res) => {
  try {
    const { search, status } = req.query;
    const clientId = req.client._id; // From client auth middleware
    
    // Get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (!client.customer) {
      return res.status(404).json({ 
        message: "Client not associated with any customer"
      });
    }
    
    // Build filter for estimates - use the customer company name that the client is associated with
    let filter = { 
      admin: client.admin,
      customer: client.customer.company
    };
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { estimateNumber: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    const estimates = await Estimate.find(filter).sort({ createdAt: -1 });
    
    // Calculate stats for this specific client
    const totalEstimates = await Estimate.countDocuments({ 
      admin: client.admin, 
      customer: client.customer.company 
    });
    
    const draftEstimates = await Estimate.countDocuments({ 
      admin: client.admin, 
      customer: client.customer.company,
      status: "Draft" 
    });
    
    const pendingEstimates = await Estimate.countDocuments({ 
      admin: client.admin, 
      customer: client.customer.company,
      status: "Pending" 
    });
    
    const approvedEstimates = await Estimate.countDocuments({ 
      admin: client.admin, 
      customer: client.customer.company,
      status: "Approved" 
    });
    
    const rejectedEstimates = await Estimate.countDocuments({ 
      admin: client.admin, 
      customer: client.customer.company,
      status: "Rejected" 
    });
    
    res.json({
      estimates,
      stats: {
        totalEstimates,
        draftEstimates,
        pendingEstimates,
        approvedEstimates,
        rejectedEstimates
      },
      clientInfo: {
        company: client.customer.company,
        contact: client.customer.contact,
        email: client.customer.email,
        phone: client.customer.phone
      }
    });
  } catch (error) {
    console.error("Error fetching client estimates:", error);
    res.status(500).json({ 
      message: "Server error while fetching estimates",
      error: error.message 
    });
  }
};

// @desc    Approve an estimate
// @route   PUT /api/client/estimates/:id/approve
// @access  Private (Client)
export const approveEstimate = async (req, res) => {
  try {
    const clientId = req.client._id;
    const estimateId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find estimate that belongs to this client
    const estimate = await Estimate.findOne({
      _id: estimateId,
      admin: client.admin,
      customer: client.customer.company
    });
    
    if (!estimate) {
      return res.status(404).json({ message: "Estimate not found or access denied" });
    }
    
    if (estimate.status !== "Pending") {
      return res.status(400).json({ message: "Only pending estimates can be approved" });
    }
    
    // Update estimate status to Approved
    estimate.status = "Approved";
    await estimate.save();
    
    res.json({ 
      success: true, 
      message: "Estimate approved successfully",
      estimate 
    });
  } catch (error) {
    console.error("Error approving estimate:", error);
    res.status(500).json({ 
      message: "Server error while approving estimate",
      error: error.message 
    });
  }
};

// @desc    Reject an estimate
// @route   PUT /api/client/estimates/:id/reject
// @access  Private (Client)
export const rejectEstimate = async (req, res) => {
  try {
    const clientId = req.client._id;
    const estimateId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find estimate that belongs to this client
    const estimate = await Estimate.findOne({
      _id: estimateId,
      admin: client.admin,
      customer: client.customer.company
    });
    
    if (!estimate) {
      return res.status(404).json({ message: "Estimate not found or access denied" });
    }
    
    if (estimate.status !== "Pending") {
      return res.status(400).json({ message: "Only pending estimates can be rejected" });
    }
    
    // Update estimate status to Rejected
    estimate.status = "Rejected";
    await estimate.save();
    
    res.json({ 
      success: true, 
      message: "Estimate rejected successfully",
      estimate 
    });
  } catch (error) {
    console.error("Error rejecting estimate:", error);
    res.status(500).json({ 
      message: "Server error while rejecting estimate",
      error: error.message 
    });
  }
};