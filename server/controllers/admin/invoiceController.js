import Invoice from "../../models/Invoice.js";

// Create new invoice
export const createInvoice = async (req, res) => {
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

    // Create the invoice with proper data structure
    const invoiceData = {
      customer,
      billTo: req.body.billTo || "",
      shipTo: req.body.shipTo || "",
      invoiceDate: req.body.invoiceDate || new Date(),
      dueDate: req.body.dueDate || null,
      tags: req.body.tags || "",
      paymentMode: req.body.paymentMode || "Bank",
      currency: req.body.currency || "USD",
      salesAgent: req.body.salesAgent || "",
      recurringInvoice: req.body.recurringInvoice || "No",
      discountType: req.body.discountType || "percent",
      discountValue: req.body.discountValue || 0,
      adminNote: req.body.adminNote || "",
      status: req.body.status || "Draft",
      paidAmount: req.body.paidAmount || 0, // Add paidAmount field
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
    res.status(400).json({ 
      success: false,
      message: error.message,
      error: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

// Get all invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ 
      success: false,
      message: "Invoice not found" 
    });
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    // If updating paidAmount, automatically update status based on payment
    if (req.body.paidAmount !== undefined) {
      const existingInvoice = await Invoice.findById(req.params.id);
      if (existingInvoice) {
        const paidAmount = Number(req.body.paidAmount);
        const total = existingInvoice.total;
        
        // Determine new status based on payment
        if (paidAmount >= total) {
          req.body.status = "Paid";
        } else if (paidAmount > 0) {
          req.body.status = "Partiallypaid"; // Match frontend spelling
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

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: updatedInvoice
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      error: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ 
        success: false,
        message: "Invoice not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Invoice deleted successfully" 
    });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};