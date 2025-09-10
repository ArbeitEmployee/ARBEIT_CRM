import Payment from "../../models/Payment.js";
import Invoice from "../../models/Invoice.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// ✅ Create Payment (admin-specific)
export const createPayment = async (req, res) => {
  try {
    // Validate required fields
    const { invoice: invoiceId, paymentDate, paymentMode, transactionId, amount } = req.body;
    
    if (!invoiceId) {
      return errorResponse(res, 400, "Invoice is required");
    }
    
    if (!paymentDate) {
      return errorResponse(res, 400, "Payment date is required");
    }
    
    if (!paymentMode) {
      return errorResponse(res, 400, "Payment mode is required");
    }
    
    if (!transactionId) {
      return errorResponse(res, 400, "Transaction ID is required");
    }
    
    if (!amount || amount <= 0) {
      return errorResponse(res, 400, "Valid payment amount is required");
    }
    
    // Check if invoice exists and belongs to the admin
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      admin: req.admin._id
    });
    
    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found");
    }
    
    // Check if payment amount exceeds invoice balance
    const balanceDue = invoice.total - (invoice.paidAmount || 0);
    if (amount > balanceDue) {
      return errorResponse(res, 400, `Payment amount cannot exceed balance due of ${balanceDue}`);
    }
    
    // Create the payment with admin reference
    const paymentData = {
      ...req.body,
      admin: req.admin._id, // Add admin reference from auth middleware
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      currency: invoice.currency || "USD"
    };
    
    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();
    
    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: savedPayment
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    
    if (error.code === 11000) {
      return errorResponse(res, 400, "Payment number conflict occurred");
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
    
    errorResponse(res, 500, "Server error while creating payment", error);
  }
};

// ✅ Get All Payments (for logged-in admin only)
export const getPayments = async (req, res) => {
  try {
    const { status, customer, invoice } = req.query;
    const filter = { admin: req.admin._id }; // Only get payments for this admin

    if (status) filter.status = status;
    if (customer) filter.customer = new RegExp(customer, "i");
    if (invoice) filter.invoice = invoice;

    const payments = await Payment.find(filter)
      .populate("invoice", "invoiceNumber total dueDate status")
      .sort({ paymentDate: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get payments error:", error);
    errorResponse(res, 500, "Server error while fetching payments", error);
  }
};

// ✅ Get Payments by Invoice ID
export const getPaymentsByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Verify the invoice belongs to the admin
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      admin: req.admin._id
    });
    
    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found");
    }
    
    const payments = await Payment.find({
      invoice: invoiceId,
      admin: req.admin._id
    }).sort({ paymentDate: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get payments by invoice error:", error);
    errorResponse(res, 500, "Server error while fetching payments", error);
  }
};

// ✅ Get Single Payment by ID (admin-specific)
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      admin: req.admin._id // Ensure the payment belongs to this admin
    }).populate("invoice", "invoiceNumber total dueDate status items");

    if (!payment) {
      return errorResponse(res, 404, "Payment not found");
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Get payment error:", error);
    errorResponse(res, 500, "Server error while fetching payment", error);
  }
};

// ✅ Update Payment (admin-specific)
export const updatePayment = async (req, res) => {
  try {
    // Prevent manual update of payment number
    if (req.body.paymentNumber) {
      delete req.body.paymentNumber;
    }
    
    // If updating amount, we need special handling
    if (req.body.amount !== undefined) {
      const existingPayment = await Payment.findOne({
        _id: req.params.id,
        admin: req.admin._id
      });
      
      if (existingPayment) {
        // Get the associated invoice
        const invoice = await Invoice.findById(existingPayment.invoice);
        
        if (invoice) {
          // Calculate the difference in amount
          const amountDifference = req.body.amount - existingPayment.amount;
          const balanceDue = invoice.total - (invoice.paidAmount || 0);
          
          // Check if the new amount would exceed the invoice balance
          if (amountDifference > balanceDue) {
            return errorResponse(res, 400, `Updated payment amount would exceed invoice balance of ${balanceDue}`);
          }
        }
      }
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: req.params.id,
        admin: req.admin._id // Ensure the payment belongs to this admin
      },
      req.body,
      { new: true, runValidators: true }
    ).populate("invoice", "invoiceNumber total dueDate status");
    
    if (!updatedPayment) {
      return errorResponse(res, 404, "Payment not found");
    }
    
    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment
    });
  } catch (error) {
    console.error("Update payment error:", error);
    
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
    
    errorResponse(res, 500, "Server error while updating payment", error);
  }
};

// ✅ Delete Payment (admin-specific)
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      admin: req.admin._id
    });
    
    if (!payment) {
      return errorResponse(res, 404, "Payment not found");
    }
    
    // Get the associated invoice to update its status
    const invoice = await Invoice.findById(payment.invoice);
    
    if (invoice) {
      // Subtract the payment amount from the invoice's paid amount
      invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
      
      // Update invoice status based on new paid amount
      if (invoice.paidAmount >= invoice.total) {
        invoice.status = "Paid";
      } else if (invoice.paidAmount > 0) {
        invoice.status = "Partiallypaid";
      } else {
        invoice.status = "Unpaid";
      }
      
      await invoice.save();
    }
    
    // Now delete the payment
    await Payment.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      data: {
        id: payment._id,
        paymentNumber: payment.paymentNumber
      }
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    errorResponse(res, 500, "Server error while deleting payment", error);
  }
};

// ✅ Get payment stats (admin-specific)
export const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { admin: req.admin._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Get total payments amount
    const totalPayments = await Payment.aggregate([
      { $match: { admin: req.admin._id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        total: totalPayments[0] || { totalAmount: 0, count: 0 }
      }
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};