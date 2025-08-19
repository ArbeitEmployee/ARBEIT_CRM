import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

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

// @desc    Import customers from CSV
// @route   POST /api/customers/import
// @access  Public
export const importCustomers = async (req, res) => {
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

    // Validate required fields - matching createCustomer requirements
    const requiredFields = ['Company', 'Contact', 'Email'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedCustomers = [];
    const errorMessages = [];
    const emailSet = new Set();

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Company || !row.Contact || !row.Email) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Skip if email is duplicate
      if (emailSet.has(row.Email)) {
        errorMessages.push(`Row ${rowNumber}: Duplicate email (${row.Email})`);
        continue;
      }

      emailSet.add(row.Email);

      const customerData = {
        company: row.Company,
        contact: row.Contact,
        email: row.Email,
        vatNumber: row.Vat || "",
        phone: row.Phone || "",
        website: row.Website || "",
        groups: row.Groups ? row.Groups.split(',').map(g => g.trim()) : [],
        currency: row.Currency || "System Default",
        language: row.Language && row.Language !== "System Default" ? row.Language : "English", // fallback to 'en'
        active: row.Active !== undefined ? Boolean(row.Active) : true,
        contactsActive: row.ContactsActive !== undefined ? Boolean(row.ContactsActive) : true,
        dateCreated: new Date()
      };

      try {
        const customer = new Customer(customerData);
        const savedCustomer = await customer.save();
        importedCustomers.push(savedCustomer);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedCustomers.length} successful and ${errorMessages.length} failed`,
      importedCount: importedCustomers.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedCustomers
    });

  } catch (error) {
    console.error("Error importing customers:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing customers" 
    });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
export const updateCustomer = async (req, res) => {
  try {
    const { company, contact, email } = req.body;
    
    if (!company || !contact || !email) {
      return res.status(400).json({ 
        message: "Company, contact, and email are required fields" 
      });
    }

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.company = company;
    customer.vatNumber = req.body.vatNumber || "";
    customer.contact = contact;
    customer.phone = req.body.phone || "";
    customer.email = email;
    customer.website = req.body.website || "";
    customer.groups = req.body.groups || [];
    customer.currency = req.body.currency || "System Default";
    customer.language = req.body.language || "System Default";
    customer.active = req.body.active !== undefined ? req.body.active : true;
    customer.contactsActive = req.body.contactsActive !== undefined ? req.body.contactsActive : true;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await Customer.deleteOne({ _id: req.params.id });
    res.json({ message: "Customer removed successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Server error while deleting customer" });
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