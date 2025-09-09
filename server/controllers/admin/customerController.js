import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all customers for logged-in admin
// @route   GET /api/customers
// @access  Protected
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ admin: req.admin._id }).sort({ dateCreated: -1 });
    
    // Calculate stats for this admin only
    const totalCustomers = await Customer.countDocuments({ admin: req.admin._id });
    const activeCustomers = await Customer.countDocuments({ admin: req.admin._id, active: true });
    const activeContacts = await Customer.countDocuments({ admin: req.admin._id, contactsActive: true });
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

// @desc    Create a customer for logged-in admin
// @route   POST /api/customers
// @access  Protected
export const createCustomer = async (req, res) => {
  try {
    const { company, contact, email } = req.body;
    
    if (!company || !contact || !email) {
      return res.status(400).json({ 
        message: "Company, contact, and email are required fields" 
      });
    }

    // CHANGED: Check if customer with email already exists for THIS ADMIN only
    const existingCustomer = await Customer.findOne({ 
      admin: req.admin._id, 
      email: email.toLowerCase() 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ 
        message: "Customer with this email already exists" 
      });
    }

    const customer = new Customer({
      admin: req.admin._id,
      company,
      vatNumber: req.body.vatNumber || "",
      contact,
      phone: req.body.phone || "",
      email: email.toLowerCase(),
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

// @desc    Import customers from CSV for logged-in admin
// @route   POST /api/customers/import
// @access  Protected
export const importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const results = [];
    const errorMessages = [];

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      // Process CSV
      const csvText = fileBuffer.toString();
      const rows = csvText.split(/\r?\n/).filter(r => r.trim());
      if (rows.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }
      
      const headers = rows[0].split(',').map(h => h.trim());
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
        results.push(row);
      }
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Process Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      results.push(...jsonData);
    } else {
      return res.status(400).json({ message: "Invalid file format. Please upload CSV, XLS, or XLSX files." });
    }

    if (!results.length) {
      return res.status(400).json({ message: "File is empty or has no valid data" });
    }

    // Validate required fields - matching createCustomer requirements
    const requiredFields = ['Company', 'Contact', 'Email'];
    const firstRow = results[0];
    const missingFields = requiredFields.filter(field => 
      !firstRow.hasOwnProperty(field) && !firstRow.hasOwnProperty(field.toLowerCase())
    );
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required columns: ${missingFields.join(', ')}. Please ensure your file has Company, Contact, and Email columns.` 
      });
    }

    // Process each row
    const importedCustomers = [];
    const emailSet = new Set();

    for (const [index, row] of results.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Get values with case-insensitive column matching
      const company = row.Company || row.company;
      const contact = row.Contact || row.contact;
      const email = row.Email || row.email;
      
      // Skip if required fields are missing
      if (!company || !contact || !email) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields (Company, Contact, Email)`);
        continue;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Skip if email is duplicate in file
      if (emailSet.has(normalizedEmail)) {
        errorMessages.push(`Row ${rowNumber}: Duplicate email in file (${email})`);
        continue;
      }

      // CHANGED: Check if email already exists for THIS ADMIN only
      const existingCustomer = await Customer.findOne({ 
        admin: req.admin._id, 
        email: normalizedEmail 
      });
      
      if (existingCustomer) {
        errorMessages.push(`Row ${rowNumber}: Customer with email ${email} already exists`);
        continue;
      }

      emailSet.add(normalizedEmail);

      const customerData = {
        admin: req.admin._id,
        company: company.trim(),
        contact: contact.trim(),
        email: normalizedEmail,
        vatNumber: (row.VatNumber || row['VAT Number'] || row.vatNumber || "").toString().trim(),
        phone: (row.Phone || row.phone || "").toString().trim(),
        website: (row.Website || row.website || "").toString().trim(),
        groups: row.Groups || row.groups ? 
          (row.Groups || row.groups).toString().split(',').map(g => g.trim()).filter(g => g) : [],
        currency: row.Currency || row.currency || "System Default",
        language: row.Language || row.language || "System Default",
        active: row.Active !== undefined ? 
          (row.Active.toString().toLowerCase() === 'true' || row.Active.toString() === '1') : true,
        contactsActive: row.ContactsActive !== undefined ? 
          (row.ContactsActive.toString().toLowerCase() === 'true' || row.ContactsActive.toString() === '1') : true,
        dateCreated: new Date()
      };

      try {
        const customer = new Customer(customerData);
        const savedCustomer = await customer.save();
        importedCustomers.push(savedCustomer);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2] || error.message}`
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

// @desc    Update a customer for logged-in admin
// @route   PUT /api/customers/:id
// @access  Protected
export const updateCustomer = async (req, res) => {
  try {
    const { company, contact, email } = req.body;
    
    if (!company || !contact || !email) {
      return res.status(400).json({ 
        message: "Company, contact, and email are required fields" 
      });
    }

    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // CHANGED: Check email uniqueness for THIS ADMIN only
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== customer.email) {
      const existingCustomer = await Customer.findOne({ 
        admin: req.admin._id, 
        email: normalizedEmail 
      });
      if (existingCustomer) {
        return res.status(400).json({ 
          message: "Another customer with this email already exists" 
        });
      }
    }

    customer.company = company;
    customer.vatNumber = req.body.vatNumber || "";
    customer.contact = contact;
    customer.phone = req.body.phone || "";
    customer.email = normalizedEmail;
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

// @desc    Delete a customer for logged-in admin
// @route   DELETE /api/customers/:id
// @access  Protected
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer removed successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Server error while deleting customer" });
  }
};

// @desc    Update customer active status for logged-in admin
// @route   PUT /api/customers/:id/active
// @access  Protected
export const updateCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
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

// @desc    Update contacts active status for logged-in admin
// @route   PUT /api/customers/:id/contacts-active
// @access  Protected
export const updateContactsStatus = async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
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
