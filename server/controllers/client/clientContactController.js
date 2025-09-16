import Contact from "../../models/Contact.js";
import Customer from "../../models/Customer.js";
import Client from "../../models/Client.js";

// @desc    Get all contacts for a specific client (filtered by their admin)
// @route   GET /api/client/contacts
// @access  Private (Client)
export const getClientContacts = async (req, res) => {
  try {
    const { search, status } = req.query;
    const clientId = req.client._id; // From client auth middleware
    
    // First, get the client's details to find their associated customer
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (!client.customer) {
      return res.status(404).json({ 
        message: "Client not associated with any customer"
      });
    }
    
    // Build filter for contacts - use the customer ID that the client is associated with
    let filter = { 
      admin: client.admin,
      customerId: client.customer._id  // Use the customer ID from client.customer
    };
    
    // Add status filter if provided
    if (status && status !== "All") {
      if (status === "Active") {
        filter.endDate = { $gte: new Date() };
      } else if (status === "Expired") {
        filter.endDate = { $lt: new Date() };
      } else if (status === "About to Expire") {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        filter.endDate = { 
          $gte: new Date(),
          $lte: thirtyDaysFromNow
        };
      }
    }
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { contractType: { $regex: search, $options: 'i' } },
        { project: { $regex: search, $options: 'i' } }
      ];
    }
    
    const contacts = await Contact.find(filter)
      .populate('customer', 'company contact email phone customerCode')
      .sort({ createdAt: -1 });
    
    // Calculate stats for this specific customer
    const active = await Contact.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      endDate: { $gte: new Date() } 
    });
    
    const expired = await Contact.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      endDate: { $lt: new Date() } 
    });
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const aboutToExpire = await Contact.countDocuments({ 
      admin: client.admin, 
      customerId: client.customer._id,
      endDate: { 
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      } 
    });
    
    res.json({
      contacts,
      stats: {
        active,
        expired,
        aboutToExpire
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
    console.error("Error fetching client contacts:", error);
    res.status(500).json({ 
      message: "Server error while fetching contacts",
      error: error.message 
    });
  }
};

// @desc    Get single contact for client
// @route   GET /api/client/contacts/:id
// @access  Private (Client)
export const getClientContact = async (req, res) => {
  try {
    const clientId = req.client._id;
    const contactId = req.params.id;
    
    // Get client with customer info
    const client = await Client.findById(clientId).populate('customer');
    
    if (!client || !client.customer) {
      return res.status(404).json({ message: "Client or customer not found" });
    }
    
    // Find contact that belongs to this client's customer
    const contact = await Contact.findOne({
      _id: contactId,
      admin: client.admin,
      customerId: client.customer._id
    }).populate('customer', 'company contact email phone customerCode');
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found or access denied" });
    }
    
    res.json(contact);
  } catch (error) {
    console.error("Error fetching client contact:", error);
    res.status(500).json({ 
      message: "Server error while fetching contact",
      error: error.message 
    });
  }
};