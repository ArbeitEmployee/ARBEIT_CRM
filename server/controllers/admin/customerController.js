import Customer from "../../models/Customer.js";

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({});
    
    // Calculate stats
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ active: true });
    const activeContacts = await Customer.countDocuments({ contactsActive: true });
    const loggedInContacts = 0; // You'll need to implement this based on your auth system
    
    res.json({
      customers,
      stats: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
        activeContacts,
        inactiveContacts: totalCustomers - activeContacts,
        loggedInContacts,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error while fetching customers" });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
export const createCustomer = async (req, res) => {
  try {
    const { company, contact, email } = req.body;
    
    if (!company || !contact || !email) {
      return res.status(400).json({ 
        message: "Company, contact, and email are required fields" 
      });
    }

    const customer = new Customer({
      company,
      vatNumber: req.body.vatNumber || "",
      contact,
      phone: req.body.phone || "",
      email,
      website: req.body.website || "",
      groups: req.body.groups || [],
      currency: req.body.currency || "System Default",
      language: req.body.language || "System Default",
      active: req.body.active !== undefined ? req.body.active : true,
      contactsActive: req.body.contactsActive !== undefined ? req.body.contactsActive : true,
      dateCreated: new Date()
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Update customer active status
// @route   PUT /api/customers/:id/active
// @access  Public
export const updateCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
      customer.active = !customer.active;
      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({ message: "Server error while updating customer status" });
  }
};

// @desc    Update contacts active status
// @route   PUT /api/customers/:id/contacts-active
// @access  Public
export const updateContactsStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (customer) {
      customer.contactsActive = !customer.contactsActive;
      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    console.error("Error updating contacts status:", error);
    res.status(500).json({ message: "Server error while updating contacts status" });
  }
};