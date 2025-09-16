// File: controllers/client/clientEstimateRequestController.js
import EstimateRequest from "../../models/EstimateRequest.js";
import Client from "../../models/Client.js";

// @desc    Get all estimate requests for a specific client (filtered by their admin and customer)
// @route   GET /api/client/estimate-requests
// @access  Private (Client)
export const getClientEstimateRequests = async (req, res) => {
  try {
    const { search, status } = req.query;
    const clientId = req.client._id; // From client auth middleware
    
    console.log("Client ID:", clientId);
    
    // First, get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    console.log("Client found:", client ? "Yes" : "No");
    console.log("Customer populated:", client?.customer ? "Yes" : "No");
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (!client.customer) {
      return res.status(404).json({ 
        message: "Client not associated with any customer",
        debug: {
          clientId: client._id,
          customerField: client.customer,
          customerCodeField: client.customerCode
        }
      });
    }
    
    // Build filter for estimates - use the customer ID that the client is associated with
    let filter = { 
      admin: client.admin,
      customerId: client.customer._id  // Use the customer ID from client.customer
    };
    
    console.log("Filter used:", filter);
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { amount: parseFloat(search) || 0 }
      ];
    }
    
    const estimates = await EstimateRequest.find(filter)
      .populate('customer', 'company contact email phone customerCode')
      .sort({ createdAt: -1 });
    
    console.log("Estimates found:", estimates.length);
    
    // Calculate stats for this specific customer
    const totalEstimates = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id 
    });
    
    const draft = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Draft" 
    });
    
    const sent = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Sent" 
    });
    
    const accepted = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Accepted" 
    });
    
    const rejected = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Rejected" 
    });
    
    const expired = await EstimateRequest.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Expired" 
    });
    
    res.json({
      estimates,
      stats: {
        totalEstimates,
        draft,
        sent,
        accepted,
        rejected,
        expired
      },
      clientInfo: {
        company: client.customer.company,
        contact: client.customer.contact,
        email: client.customer.email,
        phone: client.customer.phone,
        customerCode: client.customer.customerCode
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

// @desc    Get single estimate request for client
// @route   GET /api/client/estimate-requests/:id
// @access  Private (Client)
export const getClientEstimateRequest = async (req, res) => {
  try {
    const clientId = req.client._id;
    const estimateId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find estimate that belongs to this client's customer
    const estimate = await EstimateRequest.findOne({
      _id: estimateId,
      admin: client.admin,
      customerId: client.customer._id
    }).populate('customer', 'company contact email phone customerCode');
    
    if (!estimate) {
      return res.status(404).json({ message: "Estimate not found or access denied" });
    }
    
    res.json(estimate);
  } catch (error) {
    console.error("Error fetching client estimate:", error);
    res.status(500).json({ 
      message: "Server error while fetching estimate",
      error: error.message 
    });
  }
};