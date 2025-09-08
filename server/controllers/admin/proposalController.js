import Proposal from "../../models/Proposal.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// ✅ Get all proposals (only for logged-in admin)
export const getProposals = async (req, res) => {
  try {
    const { status, client } = req.query;
    const filter = { admin: req.admin._id };

    if (status) filter.status = status;
    if (client) filter.clientName = new RegExp(client, "i");

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

// ✅ Create new proposal
export const createProposal = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.clientName) {
      return errorResponse(res, 400, "Client name is required");
    }

    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return errorResponse(res, 400, "Proposal must contain at least one item");
    }

    // Validate items structure
    const invalidItems = req.body.items.filter(item => (
      !item.description ||
      typeof item.quantity !== "number" ||
      typeof item.rate !== "number"
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

    // Handle date conversion
    const proposalData = {
      ...req.body,
      admin: req.admin._id
    };

    // Convert date strings to Date objects
    if (req.body.date) proposalData.date = new Date(req.body.date);
    if (req.body.openTill) proposalData.openTill = new Date(req.body.openTill);

    const proposal = new Proposal(proposalData);
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

    errorResponse(res, 500, "Server error while creating proposal", error);
  }
};

// ✅ Get single proposal by ID
export const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      _id: req.params.id,
      admin: req.admin._id
    });

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

// ✅ Update proposal
export const updateProposal = async (req, res) => {
  try {
    if (req.body.proposalNumber) {
      delete req.body.proposalNumber; // prevent manual updates
    }

    // Handle date conversion
    if (req.body.date) req.body.date = new Date(req.body.date);
    if (req.body.openTill) req.body.openTill = new Date(req.body.openTill);

    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, admin: req.admin._id },
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

    errorResponse(res, 500, "Server error while updating proposal", error);
  }
};

// ✅ Delete proposal
export const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id
    });

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

// ✅ Get proposal count by status (per admin)
export const getProposalStats = async (req, res) => {
  try {
    const stats = await Proposal.aggregate([
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
    console.error("Error fetching proposal stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};