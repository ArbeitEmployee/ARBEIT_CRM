import Support from "../../models/Support.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all support tickets with customer details for logged-in admin
// @route   GET /api/support
// @access  Private
export const getSupportTickets = async (req, res) => {
  try {
    const tickets = await Support.find({ admin: req.admin._id })
      .populate('customer', 'company contact email phone customerCode')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const totalTickets = await Support.countDocuments({ admin: req.admin._id });
    const open = await Support.countDocuments({ 
      admin: req.admin._id, 
      status: "Open" 
    });
    const answered = await Support.countDocuments({ 
      admin: req.admin._id, 
      status: "Answered" 
    });
    const onHold = await Support.countDocuments({ 
      admin: req.admin._id, 
      status: "On Hold" 
    });
    const closed = await Support.countDocuments({ 
      admin: req.admin._id, 
      status: "Closed" 
    });
    const inProgress = await Support.countDocuments({ 
      admin: req.admin._id, 
      status: "In Progress" 
    });
    
    res.json({
      tickets,
      stats: {
        totalTickets,
        open,
        answered,
        onHold,
        closed,
        inProgress
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({ message: "Server error while fetching support tickets" });
  }
};

// @desc    Create a support ticket for logged-in admin
// @route   POST /api/support
// @access  Private
export const createSupportTicket = async (req, res) => {
  try {
    const { subject, description, customerId, customerCode } = req.body;
    
    if (!subject || !description || !customerId) {
      return res.status(400).json({ 
        message: "Subject, description and customer are required fields" 
      });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({ _id: customerId, admin: req.admin._id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const ticket = new Support({
      admin: req.admin._id,
      subject,
      description,
      customerId,
      customerCode: customerCode || customer.customerCode,
      tags: req.body.tags || "",
      service: req.body.service || "GENERAL",
      department: req.body.department || "Support",
      priority: req.body.priority || "Medium",
      status: req.body.status || "Open",
      created: new Date()
    });

    const createdTicket = await ticket.save();
    const populatedTicket = await Support.findById(createdTicket._id)
      .populate('customer', 'company contact email phone customerCode');
      
    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Update a support ticket for logged-in admin
// @route   PUT /api/support/:id
// @access  Private
export const updateSupportTicket = async (req, res) => {
  try {
    const { subject, description, customerId, customerCode } = req.body;
    
    if (!subject || !description || !customerId) {
      return res.status(400).json({ 
        message: "Subject, description and customer are required fields" 
      });
    }

    // Check if ticket exists and belongs to the admin
    const ticket = await Support.findOne({ _id: req.params.id, admin: req.admin._id });
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({ _id: customerId, admin: req.admin._id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    ticket.subject = subject;
    ticket.description = description;
    ticket.customerId = customerId;
    ticket.customerCode = customerCode || customer.customerCode;
    ticket.tags = req.body.tags || "";
    ticket.service = req.body.service || "GENERAL";
    ticket.department = req.body.department || "Support";
    ticket.priority = req.body.priority || "Medium";
    ticket.status = req.body.status || "Open";
    ticket.lastReply = req.body.lastReply || ticket.lastReply;

    const updatedTicket = await ticket.save();
    const populatedTicket = await Support.findById(updatedTicket._id)
      .populate('customer', 'company contact email phone customerCode');
      
    res.json(populatedTicket);
  } catch (error) {
    console.error("Error updating support ticket:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a support ticket for logged-in admin
// @route   DELETE /api/support/:id
// @access  Private
export const deleteSupportTicket = async (req, res) => {
  try {
    const ticket = await Support.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    await Support.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Support ticket removed successfully" });
  } catch (error) {
    console.error("Error deleting support ticket:", error);
    res.status(500).json({ message: "Server error while deleting support ticket" });
  }
};

// @desc    Search customers by company name for logged-in admin
// @route   GET /api/support/customers/search
// @access  Private
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      admin: req.admin._id,
      $or: [
        { company: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: q, $options: 'i' } }
      ]
    }).select('company contact email phone customerCode').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};

// @desc    Get customer by customer code for logged-in admin
// @route   GET /api/support/customers/by-code/:code
// @access  Private
export const getCustomerByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.length < 4) {
      return res.status(400).json({ message: "Customer code is required" });
    }
    
    const customer = await Customer.findOne({ 
      admin: req.admin._id,
      customerCode: code.toUpperCase() 
    }).select('_id company contact email phone customerCode');
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json({ customer });
  } catch (error) {
    console.error("Error finding customer by code:", error);
    res.status(500).json({ message: "Server error while searching customer" });
  }
};

// @desc    Bulk delete support tickets for logged-in admin
// @route   POST /api/support/bulk-delete
// @access  Private
export const bulkDeleteSupportTickets = async (req, res) => {
  try {
    const { ticketIds } = req.body;
    
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ message: "Ticket IDs are required" });
    }

    const result = await Support.deleteMany({ 
      _id: { $in: ticketIds },
      admin: req.admin._id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No support tickets found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} support ticket(s) deleted successfully` 
    });
  } catch (error) {
    console.error("Error bulk deleting support tickets:", error);
    res.status(500).json({ message: "Server error while bulk deleting support tickets" });
  }
};

// @desc    Import support tickets from CSV for logged-in admin
// @route   POST /api/support/import
// @access  Private
export const importSupportTickets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    // Validate required fields
    const requiredFields = ['Subject', 'Description', 'Customer'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedTickets = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Subject || !row.Description || !row.Customer) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name or code for this admin
      let customer;
      try {
        customer = await Customer.findOne({ 
          admin: req.admin._id,
          $or: [
            { company: { $regex: new RegExp(row.Customer, 'i') } },
            { customerCode: { $regex: new RegExp(row.Customer, 'i') } }
          ]
        });
        
        if (!customer) {
          errorMessages.push(`Row ${rowNumber}: Customer "${row.Customer}" not found`);
          continue;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error finding customer - ${error.message}`);
        continue;
      }

      // Validate status
      const validStatuses = ["Open", "Answered", "On Hold", "Closed", "In Progress"];
      if (row.Status && !validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      // Validate priority
      const validPriorities = ["Low", "Medium", "High", "Urgent"];
      if (row.Priority && !validPriorities.includes(row.Priority)) {
        errorMessages.push(`Row ${rowNumber}: Invalid priority "${row.Priority}"`);
        continue;
      }

      // Validate service
      const validServices = ["FIELD", "STRATEGY", "TECHNICAL", "BILLING", "GENERAL"];
      if (row.Service && !validServices.includes(row.Service)) {
        errorMessages.push(`Row ${rowNumber}: Invalid service "${row.Service}"`);
        continue;
      }

      // Validate department
      const validDepartments = ["Marketing", "Sales", "Support", "Development", "Operations"];
      if (row.Department && !validDepartments.includes(row.Department)) {
        errorMessages.push(`Row ${rowNumber}: Invalid department "${row.Department}"`);
        continue;
      }

      const ticketData = {
        admin: req.admin._id,
        subject: row.Subject,
        description: row.Description,
        customerId: customer._id,
        customerCode: customer.customerCode,
        tags: row.Tags || "",
        service: row.Service || "GENERAL",
        department: row.Department || "Support",
        priority: row.Priority || "Medium",
        status: row.Status || "Open",
        created: row.Created ? new Date(row.Created) : new Date(),
        lastReply: row['Last Reply'] || "No Reply Yet"
      };

      try {
        const ticket = new Support(ticketData);
        const savedTicket = await ticket.save();
        const populatedTicket = await Support.findById(savedTicket._id)
          .populate('customer', 'company contact email phone customerCode');
          
        importedTickets.push(populatedTicket);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedTickets.length} successful and ${errorMessages.length} failed`,
      importedCount: importedTickets.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedTickets
    });

  } catch (error) {
    console.error("Error importing support tickets:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing support tickets" 
    });
  }
};