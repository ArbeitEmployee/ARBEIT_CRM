// clientPaymentController.js
import Payment from "../../models/Payment.js";
import Invoice from "../../models/Invoice.js";
import Client from "../../models/Client.js";

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined
  });
};

// ✅ Get All Payments for Client (client-specific)
export const getClientPayments = async (req, res) => {
  try {
    const clientId = req.client._id;
    const { status, invoice } = req.query;
    
    // Get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return errorResponse(res, 404, "Client or customer not found");
    }
    
    const filter = { 
      admin: client.admin,
      customer: client.customer.company // Only get payments for this client's customer
    };

    if (status) filter.status = status;
    if (invoice) filter.invoice = invoice;

    const payments = await Payment.find(filter)
      .populate("invoice", "invoiceNumber total dueDate status currency")
      .sort({ paymentDate: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get client payments error:", error);
    errorResponse(res, 500, "Server error while fetching payments", error);
  }
};

// ✅ Get Single Payment by ID (client-specific)
export const getClientPayment = async (req, res) => {
  try {
    const clientId = req.client._id;
    const paymentId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return errorResponse(res, 404, "Client or customer not found");
    }
    
    const payment = await Payment.findOne({
      _id: paymentId,
      admin: client.admin,
      customer: client.customer.company // Ensure the payment belongs to this client's customer
    }).populate("invoice", "invoiceNumber total dueDate status currency items");

    if (!payment) {
      return errorResponse(res, 404, "Payment not found");
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Get client payment error:", error);
    errorResponse(res, 500, "Server error while fetching payment", error);
  }
};

// ✅ Record Payment (client-specific)
export const recordPayment = async (req, res) => {
  try {
    const clientId = req.client._id;
    const { invoice: invoiceId, paymentDate, paymentMode, transactionId, amount, notes } = req.body;
    
    // Validate required fields
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
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return errorResponse(res, 404, "Client or customer not found");
    }
    
    // Check if invoice exists and belongs to the client's customer
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      admin: client.admin,
      customer: client.customer.company
    });
    
    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found or access denied");
    }
    
    // Check if payment amount exceeds invoice balance
    const balanceDue = invoice.total - (invoice.paidAmount || 0);
    if (amount > balanceDue) {
      return errorResponse(res, 400, `Payment amount cannot exceed balance due of ${balanceDue}`);
    }
    
    // Create the payment
    const paymentData = {
      admin: client.admin,
      invoice: invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      paymentDate,
      paymentMode,
      transactionId,
      amount,
      currency: invoice.currency || "USD",
      notes: notes || "",
      status: "Completed"
    };
    
    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();
    
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: savedPayment
    });
  } catch (error) {
    console.error("Client payment creation error:", error);
    
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
    
    errorResponse(res, 500, "Server error while recording payment", error);
  }
};

// ✅ Get payment stats for client
export const getClientPaymentStats = async (req, res) => {
  try {
    const clientId = req.client._id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return errorResponse(res, 404, "Client or customer not found");
    }
    
    const stats = await Payment.aggregate([
      { 
        $match: { 
          admin: client.admin,
          customer: client.customer.company 
        } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Get total payments amount for this client
    const totalPayments = await Payment.aggregate([
      { 
        $match: { 
          admin: client.admin,
          customer: client.customer.company 
        } 
      },
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
    console.error("Error fetching client payment stats:", error);
    errorResponse(res, 500, "Server error while fetching stats", error);
  }
};