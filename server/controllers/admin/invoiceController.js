import Invoice from "../../models/Invoice.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// ✅ Create Invoice (admin-specific)
export const createInvoice = async (req, res) => {
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

    // Create the invoice with admin reference
    const invoiceData = {
      ...req.body,
      admin: req.admin._id, // Add admin reference from auth middleware
      items: items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax1: Number(item.tax1 || 0),
        tax2: Number(item.tax2 || 0),
        amount: Number(item.quantity) * Number(item.rate)
      }))
    };

    // Calculate totals manually to ensure they're correct
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const discount = invoiceData.discountType === "percent" 
      ? subtotal * (invoiceData.discountValue / 100) 
      : Number(invoiceData.discountValue);
    const total = subtotal - discount;

    invoiceData.subtotal = subtotal;
    invoiceData.discount = discount;
    invoiceData.total = total;

    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();
    
    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: savedInvoice
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    
    if (error.code === 11000) {
      return errorResponse(res, 400, "Invoice number conflict occurred");
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
    
    errorResponse(res, 500, "Server error while creating invoice", error);
  }
};

// ✅ Get All Invoices (for logged-in admin only)
export const getInvoices = async (req, res) => {
  try {
    const { status, customer } = req.query;
    const filter = { admin: req.admin._id }; // Only get invoices for this admin

    if (status) filter.status = status;
    if (customer) filter.customer = new RegExp(customer, "i");

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    errorResponse(res, 500, "Server error while fetching invoices", error);
  }
};

// ✅ Get Single Invoice by ID (admin-specific)
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      admin: req.admin._id // Ensure the invoice belongs to this admin
    });

    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found");
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    errorResponse(res, 500, "Server error while fetching invoice", error);
  }
};

// ✅ Update Invoice (admin-specific)
export const updateInvoice = async (req, res) => {
  try {
    // Prevent manual update of invoice number
    if (req.body.invoiceNumber) {
      delete req.body.invoiceNumber;
    }

    // If updating paidAmount, automatically update status based on payment
    if (req.body.paidAmount !== undefined) {
      const existingInvoice = await Invoice.findOne({
        _id: req.params.id,
        admin: req.admin._id
      });
      
      if (existingInvoice) {
        const paidAmount = Number(req.body.paidAmount);
        const total = existingInvoice.total;
        
        // Determine new status based on payment
        if (paidAmount >= total) {
          req.body.status = "Paid";
        } else if (paidAmount > 0) {
          req.body.status = "Partiallypaid";
        } else {
          req.body.status = "Unpaid";
        }
      }
    }

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

    const updatedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: req.params.id,
        admin: req.admin._id // Ensure the invoice belongs to this admin
      },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return errorResponse(res, 404, "Invoice not found");
    }
    
    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    
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
    
    errorResponse(res, 500, "Server error while updating invoice", error);
  }
};

// ✅ Delete Invoice (admin-specific)
export const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      admin: req.admin._id // Ensure the invoice belongs to this admin
    });
    
    if (!deletedInvoice) {
      return errorResponse(res, 404, "Invoice not found");
    }
    
    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: {
        id: deletedInvoice._id,
        invoiceNumber: deletedInvoice.invoiceNumber
      }
    });
  } catch (error) {
    console.error("Delete invoice error:", error);
    errorResponse(res, 500, "Server error while deleting invoice", error);
  }
};

// ✅ Get invoice stats (admin-specific)
export const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
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
    console.error("Error fetching invoice stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};