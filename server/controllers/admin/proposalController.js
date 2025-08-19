import Proposal from "../../models/Proposal.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error?.message : undefined
  });
};

// Get all proposals
export const getProposals = async (req, res) => {
  try {
    const { status, client } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (client) filter.clientName = new RegExp(client, 'i');
    
    const proposals = await Proposal.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    errorResponse(res, 500, "Server error while fetching proposals", error);
  }
};

// Create new proposal
export const createProposal = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.clientName) {
      return errorResponse(res, 400, "Client name is required");
    }

    // Validate items
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return errorResponse(res, 400, "Proposal must contain at least one item");
    }

    // Validate each item
    const invalidItems = req.body.items.filter(item => (
      !item.description || 
      typeof item.quantity !== 'number' || 
      typeof item.rate !== 'number'
    ));

    if (invalidItems.length > 0) {
      return errorResponse(res, 400, "Invalid items format", {
        example: {
          description: "string (required)",
          quantity: "number (required)",
          rate: "number (required)",
          tax1: "number (optional)",
          tax2: "number (optional)"
        }
      });
    }

    // Remove proposalNumber if provided (will be auto-generated)
    if (req.body.proposalNumber) {
      delete req.body.proposalNumber;
    }

    const proposal = new Proposal(req.body);
    const savedProposal = await proposal.save();

    res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      data: savedProposal
    });

  } catch (error) {
    console.error("Error saving proposal:", error);
    
    if (error.code === 11000) {
      return errorResponse(res, 400, "Proposal number conflict occurred", error);
    }

    if (error.name === 'ValidationError') {
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

    errorResponse(res, 500, "Server error while creating proposal", error);
  }
};

// Get single proposal by ID
export const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return errorResponse(res, 404, "Proposal not found");
    }
    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    errorResponse(res, 500, "Server error while fetching proposal", error);
  }
};

// Update proposal
export const updateProposal = async (req, res) => {
  try {
    // Prevent proposalNumber from being updated
    if (req.body.proposalNumber) {
      delete req.body.proposalNumber;
    }

    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!proposal) {
      return errorResponse(res, 404, "Proposal not found");
    }

    res.status(200).json({
      success: true,
      message: "Proposal updated successfully",
      data: proposal
    });

  } catch (error) {
    console.error("Error updating proposal:", error);
    
    if (error.name === 'ValidationError') {
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

    errorResponse(res, 500, "Server error while updating proposal", error);
  }
};

// Delete proposal
export const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    
    if (!proposal) {
      return errorResponse(res, 404, "Proposal not found");
    }

    res.status(200).json({
      success: true,
      message: "Proposal deleted successfully",
      data: {
        id: proposal._id,
        proposalNumber: proposal.proposalNumber
      }
    });

  } catch (error) {
    console.error("Error deleting proposal:", error);
    errorResponse(res, 500, "Server error while deleting proposal", error);
  }
};

// Get proposal count by status
export const getProposalStats = async (req, res) => {
  try {
    const stats = await Proposal.aggregate([
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
    console.error("Error fetching proposal stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};