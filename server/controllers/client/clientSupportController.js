import Support from "../../models/Support.js";
import Client from "../../models/Client.js";

// @desc    Get all support tickets for a specific client (filtered by their customer)
// @route   GET /api/client/support
// @access  Private (Client)
export const getClientSupportTickets = async (req, res) => {
  try {
    const { search, status } = req.query;
    const clientId = req.client._id; // From client auth middleware
    
    // Get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (!client.customer) {
      return res.status(404).json({ 
        message: "Client not associated with any customer",
        debug: {
          clientId: client._id,
          customerField: client.customer,
          customerCodeField: client.customerCode
        }
      });
    }
    
    // Build filter for support tickets - use the customer ID that the client is associated with
    let filter = { 
      admin: client.admin,
      customerId: client.customer._id  // Use the customer ID from client.customer
    };
    
    if (status && status !== "All") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { priority: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tickets = await Support.find(filter)
      .populate('customer', 'company contact email phone customerCode')
      .sort({ createdAt: -1 });
    
    // Calculate stats for this specific customer
    const totalTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id 
    });
    
    const openTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Open" 
    });
    
    const answeredTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Answered" 
    });
    
    const onHoldTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "On Hold" 
    });
    
    const closedTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "Closed" 
    });
    
    const inProgressTickets = await Support.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      status: "In Progress" 
    });
    
    res.json({
      tickets,
      stats: {
        totalTickets,
        openTickets,
        answeredTickets,
        onHoldTickets,
        closedTickets,
        inProgressTickets
      },
      clientInfo: {
        company: client.customer.company,
        contact: client.customer.contact,
        email: client.customer.email,
        phone: client.customer.phone,
        customerCode: client.customer.customerCode
      }
    });
  } catch (error) {
    console.error("Error fetching client support tickets:", error);
    res.status(500).json({ 
      message: "Server error while fetching support tickets",
      error: error.message 
    });
  }
};

// @desc    Get single support ticket for client
// @route   GET /api/client/support/:id
// @access  Private (Client)
export const getClientSupportTicket = async (req, res) => {
  try {
    const clientId = req.client._id;
    const ticketId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find support ticket that belongs to this client's customer
    const ticket = await Support.findOne({
      _id: ticketId,
      admin: client.admin,
      customerId: client.customer._id
    }).populate('customer', 'company contact email phone customerCode');
    
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found or access denied" });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error("Error fetching client support ticket:", error);
    res.status(500).json({ 
      message: "Server error while fetching support ticket",
      error: error.message 
    });
  }
};