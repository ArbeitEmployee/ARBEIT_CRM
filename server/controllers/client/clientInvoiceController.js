import Invoice from "../../models/Invoice.js";
import Payment from "../../models/Payment.js";
import Client from "../../models/Client.js";


// @desc    Get all invoices for a specific client
// @route   GET /api/client/invoices
// @access  Private (Client)
export const getClientInvoices = async (req, res) => {
  try {
    const clientId = req.client._id;
    
    // Get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ 
        success: false,
        message: "Client or customer not found" 
      });
    }
    
    // Find invoices for this client's customer
    const invoices = await Invoice.find({
      admin: client.admin,
      customer: client.customer.company
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching invoices",
      error: error.message 
    });
  }
};

// @desc    Get single invoice for client
// @route   GET /api/client/invoices/:id
// @access  Private (Client)
export const getClientInvoice = async (req, res) => {
  try {
    const clientId = req.client._id;
    const invoiceId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ 
        success: false,
        message: "Client or customer not found" 
      });
    }
    
    // Find invoice that belongs to this client's customer
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      admin: client.admin,
      customer: client.customer.company
    });
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found or access denied" 
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error("Error fetching client invoice:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching invoice",
      error: error.message 
    });
  }
};



// @desc    Record payment for an invoice
// @route   POST /api/client/payments
// @access  Private (Client)
export const recordPayment = async (req, res) => {
  try {
    const clientId = req.client._id;
    const { invoice: invoiceId, paymentDate, paymentMode, transactionId, amount, notes } = req.body;
    
    // Validate required fields
    if (!invoiceId || !paymentDate || !paymentMode || !transactionId || !amount) {
      return res.status(400).json({ 
        success: false,
        message: "All payment details are required" 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Payment amount must be greater than 0" 
      });
    }
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ 
        success: false,
        message: "Client or customer not found" 
      });
    }
    
    // Find invoice that belongs to this client's customer
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      admin: client.admin,
      customer: client.customer.company
    });
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found or access denied" 
      });
    }
    
    // Check if payment amount exceeds invoice balance
    const balanceDue = invoice.total - (invoice.paidAmount || 0);
    if (amount > balanceDue) {
      return res.status(400).json({ 
        success: false,
        message: `Payment amount cannot exceed balance due of ${balanceDue}` 
      });
    }
    
    // Create payment record
    const payment = new Payment({
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
    });
    
    const savedPayment = await payment.save();
    
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: savedPayment
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while recording payment",
      error: error.message 
    });
  }
};