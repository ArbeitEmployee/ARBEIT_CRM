import CreditNote from "../../models/CreditNote.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// Create new credit note
export const createCreditNote = async (req, res) => {
  try {
    // Validate required fields
    const { customer, items } = req.body;
    
    if (!customer) {
      return errorResponse(res, 400, "Customer is required");
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, "At least one item is required");
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description) {
        return errorResponse(res, 400, `Item ${i + 1} description is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        return errorResponse(res, 400, `Item ${i + 1} quantity must be greater than 0`);
      }
      if (!item.rate || item.rate <= 0) {
        return errorResponse(res, 400, `Item ${i + 1} rate must be greater than 0`);
      }
    }

    // Create the credit note with admin reference
    const creditNoteData = {
      ...req.body,
      admin: req.admin._id // Add admin reference from auth middleware
    };

    const creditNote = new CreditNote(creditNoteData);
    const savedCreditNote = await creditNote.save();
    
    res.status(201).json({
      success: true,
      message: "Credit note created successfully",
      data: savedCreditNote
    });
  } catch (error) {
    console.error("Credit note creation error:", error);
    
    if (error.code === 11000) {
      return errorResponse(res, 400, "Credit note number conflict occurred");
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
    
    errorResponse(res, 500, "Server error while creating credit note", error);
  }
};

// Get all credit notes for logged-in admin
export const getCreditNotes = async (req, res) => {
  try {
    const { status, customer } = req.query;
    const filter = { admin: req.admin._id }; // Only get credit notes for this admin

    if (status) filter.status = status;
    if (customer) filter.customer = new RegExp(customer, "i");

    const creditNotes = await CreditNote.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: creditNotes.length,
      data: creditNotes
    });
  } catch (error) {
    console.error("Get credit notes error:", error);
    errorResponse(res, 500, "Server error while fetching credit notes", error);
  }
};

// Get credit note by ID (admin-specific)
export const getCreditNoteById = async (req, res) => {
  try {
    const creditNote = await CreditNote.findOne({
      _id: req.params.id,
      admin: req.admin._id // Ensure the credit note belongs to this admin
    });
    
    if (!creditNote) {
      return errorResponse(res, 404, "Credit note not found");
    }
    
    res.json({
      success: true,
      data: creditNote
    });
  } catch (error) {
    console.error("Get credit note error:", error);
    errorResponse(res, 500, "Server error while fetching credit note", error);
  }
};

// Update credit note (admin-specific)
export const updateCreditNote = async (req, res) => {
  try {
    // Prevent manual update of credit note number
    if (req.body.creditNoteNumber) {
      delete req.body.creditNoteNumber;
    }

    const updatedCreditNote = await CreditNote.findOneAndUpdate(
      {
        _id: req.params.id,
        admin: req.admin._id // Ensure the credit note belongs to this admin
      },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCreditNote) {
      return errorResponse(res, 404, "Credit note not found");
    }
    
    res.json({
      success: true,
      message: "Credit note updated successfully",
      data: updatedCreditNote
    });
  } catch (error) {
    console.error("Update credit note error:", error);
    
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
    
    errorResponse(res, 500, "Server error while updating credit note", error);
  }
};

// Delete credit note (admin-specific)
export const deleteCreditNote = async (req, res) => {
  try {
    const deletedCreditNote = await CreditNote.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id // Ensure the credit note belongs to this admin
    });
    
    if (!deletedCreditNote) {
      return errorResponse(res, 404, "Credit note not found");
    }
    
    res.json({ 
      success: true,
      message: "Credit note deleted successfully",
      data: {
        id: deletedCreditNote._id,
        creditNoteNumber: deletedCreditNote.creditNoteNumber
      }
    });
  } catch (error) {
    console.error("Delete credit note error:", error);
    errorResponse(res, 500, "Server error while deleting credit note", error);
  }
};

// Get credit note stats (admin-specific)
export const getCreditNoteStats = async (req, res) => {
  try {
    const stats = await CreditNote.aggregate([
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
    console.error("Error fetching credit note stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};