import CreditNote from "../../models/CreditNote.js";

// Create new credit note
export const createCreditNote = async (req, res) => {
  try {
    // Validate required fields
    const { customer, items } = req.body;
    
    if (!customer) {
      return res.status(400).json({ message: "Customer is required" });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description) {
        return res.status(400).json({ message: `Item ${i + 1} description is required` });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: `Item ${i + 1} quantity must be greater than 0` });
      }
      if (!item.rate || item.rate <= 0) {
        return res.status(400).json({ message: `Item ${i + 1} rate must be greater than 0` });
      }
    }

    // Create the credit note with proper data structure
    const creditNoteData = {
      customer,
      billTo: req.body.billTo || "",
      shipTo: req.body.shipTo || "",
      creditNoteDate: req.body.creditNoteDate || new Date(),
      currency: req.body.currency || "USD",
      status: req.body.status || "Draft",
      discountType: req.body.discountType || "percent",
      discountValue: req.body.discountValue || 0,
      adminNote: req.body.adminNote || "",
      reference: req.body.reference || "",
      project: req.body.project || "",
      items: items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
        amount: Number(item.quantity) * Number(item.rate) // Calculate amount upfront
      }))
    };

    // Calculate totals manually to ensure they're correct
    const subtotal = creditNoteData.items.reduce((sum, item) => sum + item.amount, 0);
    const discount = creditNoteData.discountType === "percent" 
      ? subtotal * (creditNoteData.discountValue / 100) 
      : Number(creditNoteData.discountValue);
    const total = subtotal - discount;

    creditNoteData.subtotal = subtotal;
    creditNoteData.discount = discount;
    creditNoteData.total = total;

    const creditNote = new CreditNote(creditNoteData);
    const savedCreditNote = await creditNote.save();
    
    res.status(201).json({
      success: true,
      message: "Credit note created successfully",
      data: savedCreditNote
    });
  } catch (error) {
    console.error("Credit note creation error:", error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      error: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

// Get all credit notes
export const getCreditNotes = async (req, res) => {
  try {
    const creditNotes = await CreditNote.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: creditNotes
    });
  } catch (error) {
    console.error("Get credit notes error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get credit note by ID
export const getCreditNoteById = async (req, res) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id);
    if (!creditNote) return res.status(404).json({ 
      success: false,
      message: "Credit note not found" 
    });
    
    res.json({
      success: true,
      data: creditNote
    });
  } catch (error) {
    console.error("Get credit note error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update credit note
export const updateCreditNote = async (req, res) => {
  try {
    // If items are being updated, recalculate totals
    if (req.body.items) {
      const subtotal = req.body.items.reduce((sum, item) => {
        const amount = Number(item.quantity) * Number(item.rate);
        return sum + amount;
      }, 0);
      
      const discount = req.body.discountType === "percent" 
        ? subtotal * (req.body.discountValue / 100) 
        : Number(req.body.discountValue);
      
      const total = subtotal - discount;

      req.body.subtotal = subtotal;
      req.body.discount = discount;
      req.body.total = total;
      
      // Also update item amounts
      req.body.items = req.body.items.map(item => ({
        ...item,
        amount: Number(item.quantity) * Number(item.rate)
      }));
    }

    const updatedCreditNote = await CreditNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCreditNote) {
      return res.status(404).json({ 
        success: false,
        message: "Credit note not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Credit note updated successfully",
      data: updatedCreditNote
    });
  } catch (error) {
    console.error("Update credit note error:", error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      error: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

// Delete credit note
export const deleteCreditNote = async (req, res) => {
  try {
    const deletedCreditNote = await CreditNote.findByIdAndDelete(req.params.id);
    if (!deletedCreditNote) {
      return res.status(404).json({ 
        success: false,
        message: "Credit note not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Credit note deleted successfully" 
    });
  } catch (error) {
    console.error("Delete credit note error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};