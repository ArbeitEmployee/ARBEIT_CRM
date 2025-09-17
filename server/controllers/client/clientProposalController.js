import Proposal from "../../models/Proposal.js";
import Client from "../../models/Client.js";

// @desc    Get all proposals for a specific client
// @route   GET /api/client/proposals
// @access  Private (Client)
export const getClientProposals = async (req, res) => {
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
    
    // Build filter for proposals - use the customer company name that the client is associated with
    let filter = { 
      admin: client.admin,
      clientName: client.customer.company
    };
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { proposalNumber: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    const proposals = await Proposal.find(filter).sort({ createdAt: -1 });
    
    // Calculate stats for this specific client
    const totalProposals = await Proposal.countDocuments({ 
      admin: client.admin, 
      clientName: client.customer.company 
    });
    
    const draftProposals = await Proposal.countDocuments({ 
      admin: client.admin, 
      clientName: client.customer.company,
      status: "Draft" 
    });
    
    const sentProposals = await Proposal.countDocuments({ 
      admin: client.admin, 
      clientName: client.customer.company,
      status: "Sent" 
    });
    
    const acceptedProposals = await Proposal.countDocuments({ 
      admin: client.admin, 
      clientName: client.customer.company,
      status: "Accepted" 
    });
    
    const rejectedProposals = await Proposal.countDocuments({ 
      admin: client.admin, 
      clientName: client.customer.company,
      status: "Rejected" 
    });
    
    res.json({
      proposals,
      stats: {
        totalProposals,
        draftProposals,
        sentProposals,
        acceptedProposals,
        rejectedProposals
      },
      clientInfo: {
        company: client.customer.company,
        contact: client.customer.contact,
        email: client.customer.email,
        phone: client.customer.phone
      }
    });
  } catch (error) {
    console.error("Error fetching client proposals:", error);
    res.status(500).json({ 
      message: "Server error while fetching proposals",
      error: error.message 
    });
  }
};

// @desc    Accept a proposal
// @route   PUT /api/client/proposals/:id/accept
// @access  Private (Client)
export const acceptProposal = async (req, res) => {
  try {
    const clientId = req.client._id;
    const proposalId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find proposal that belongs to this client
    const proposal = await Proposal.findOne({
      _id: proposalId,
      admin: client.admin,
      clientName: client.customer.company
    });
    
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found or access denied" });
    }
    
    if (proposal.status !== "Sent") {
      return res.status(400).json({ message: "Only sent proposals can be accepted" });
    }
    
    // Update proposal status to Accepted
    proposal.status = "Accepted";
    await proposal.save();
    
    res.json({ 
      success: true, 
      message: "Proposal accepted successfully",
      proposal 
    });
  } catch (error) {
    console.error("Error accepting proposal:", error);
    res.status(500).json({ 
      message: "Server error while accepting proposal",
      error: error.message 
    });
  }
};

// @desc    Reject a proposal
// @route   PUT /api/client/proposals/:id/reject
// @access  Private (Client)
export const rejectProposal = async (req, res) => {
  try {
    const clientId = req.client._id;
    const proposalId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find proposal that belongs to this client
    const proposal = await Proposal.findOne({
      _id: proposalId,
      admin: client.admin,
      clientName: client.customer.company
    });
    
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found or access denied" });
    }
    
    if (proposal.status !== "Sent") {
      return res.status(400).json({ message: "Only sent proposals can be rejected" });
    }
    
    // Update proposal status to Rejected
    proposal.status = "Rejected";
    await proposal.save();
    
    res.json({ 
      success: true, 
      message: "Proposal rejected successfully",
      proposal 
    });
  } catch (error) {
    console.error("Error rejecting proposal:", error);
    res.status(500).json({ 
      message: "Server error while rejecting proposal",
      error: error.message 
    });
  }
};