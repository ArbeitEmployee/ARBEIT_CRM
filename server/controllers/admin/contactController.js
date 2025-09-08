import Contact from "../../models/Contact.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all contacts with customer details for logged-in admin
// @route   GET /api/contacts
// @access  Private
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ admin: req.admin._id })
      .populate('customer', 'company contact email phone')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const active = await Contact.countDocuments({ 
      admin: req.admin._id,
      endDate: { $gte: new Date() } 
    });
    
    const expired = await Contact.countDocuments({ 
      admin: req.admin._id,
      endDate: { $lt: new Date() } 
    });
    
    const aboutToExpire = await Contact.countDocuments({ 
      admin: req.admin._id,
      endDate: { 
        $gte: new Date(),
        $lte: new Date(new Date().setDate(new Date().getDate() + 30))
      } 
    });
    
    const recentlyAdded = await Contact.countDocuments({ 
      admin: req.admin._id,
      createdAt: { 
        $gte: new Date(new Date().setDate(new Date().getDate() - 7))
      } 
    });
    
    res.json({
      contacts,
      stats: {
        active,
        expired,
        aboutToExpire,
        recentlyAdded,
        trash: 0
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error while fetching contacts" });
  }
};

// @desc    Create a contact for logged-in admin
// @route   POST /api/contacts
// @access  Private
export const createContact = async (req, res) => {
  try {
    const { subject, customerId, contractType, contractValue, startDate, endDate, project, signature } = req.body;
    
    if (!subject || !customerId || !contractType || !contractValue || !startDate || !endDate || !project) {
      return res.status(400).json({ 
        message: "Subject, customer, contract type, contract value, start date, end date, and project are required fields" 
      });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({ _id: customerId, admin: req.admin._id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const contact = new Contact({
      admin: req.admin._id,
      subject,
      customerId,
      contractType,
      contractValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      project,
      signature: signature || "Not Signed"
    });

    const createdContact = await contact.save();
    const populatedContact = await Contact.findById(createdContact._id)
      .populate('customer', 'company contact email phone');
      
    res.status(201).json(populatedContact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Import contacts from CSV for logged-in admin
// @route   POST /api/contacts/import
// @access  Private
export const importContacts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use header: 1 to get the raw values, then process dates
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData.length) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    // Assuming the first row is headers
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    // Map headers to expected keys for easier access
    const headerMap = {
      'Subject': 'Subject',
      'Customer': 'Customer',
      'Contract Type': 'Contract Type',
      'Contract Value': 'Contract Value',
      'Start Date': 'Start Date',
      'End Date': 'End Date',
      'Project': 'Project',
      'Signature': 'Signature'
    };

    // Validate required fields
    const requiredFields = ['Subject', 'Customer', 'Contract Type', 'Contract Value', 'Start Date', 'End Date', 'Project'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields in header: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedContacts = [];
    const errorMessages = [];

    for (const [index, rowArray] of dataRows.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1, data starts at row 2
      
      // Create an object from the row array using headers
      const row = {};
      headers.forEach((header, i) => {
        row[header] = rowArray[i];
      });

      // Skip if required fields are missing in the row
      if (!row.Subject || !row.Customer || !row['Contract Type'] || !row['Contract Value'] || 
          !row['Start Date'] || !row['End Date'] || !row.Project) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name for this admin
      let customer;
      try {
        customer = await Customer.findOne({ 
          admin: req.admin._id,
          company: { $regex: new RegExp(row.Customer, 'i') } 
        });
        
        if (!customer) {
          errorMessages.push(`Row ${rowNumber}: Customer "${row.Customer}" not found`);
          continue;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error finding customer - ${error.message}`);
        continue;
      }

      // Validate contract type
      const validContractTypes = ["Express Contract", "Standard Contract", "Custom Contract"];
      
      if (!validContractTypes.includes(row['Contract Type'])) {
        errorMessages.push(`Row ${rowNumber}: Invalid contract type "${row['Contract Type']}"`);
        continue;
      }

      // Parse dates using XLSX.SSF.parse_date_code for numeric dates
      let startDate;
      let endDate;
      
      try {
        if (typeof row['Start Date'] === 'number') {
          const dateObj = XLSX.SSF.parse_date_code(row['Start Date']);
          startDate = new Date(dateObj.y, dateObj.m - 1, dateObj.d); // Month is 0-indexed in JS Date
        } else {
          startDate = new Date(row['Start Date']);
        }
        
        if (isNaN(startDate.getTime())) {
          errorMessages.push(`Row ${rowNumber}: Invalid Start Date format`);
          continue;
        }
        
        if (typeof row['End Date'] === 'number') {
          const dateObj = XLSX.SSF.parse_date_code(row['End Date']);
          endDate = new Date(dateObj.y, dateObj.m - 1, dateObj.d); // Month is 0-indexed in JS Date
        } else {
          endDate = new Date(row['End Date']);
        }

        if (isNaN(endDate.getTime())) {
          errorMessages.push(`Row ${rowNumber}: Invalid End Date format`);
          continue;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error parsing dates - ${error.message}`);
        continue;
      }

      // Parse contract value
      const contractValue = parseFloat(row['Contract Value']);
      if (isNaN(contractValue) || contractValue < 0) {
        errorMessages.push(`Row ${rowNumber}: Invalid contract value`);
        continue;
      }

      const contactData = {
        admin: req.admin._id,
        subject: row.Subject,
        customerId: customer._id,
        contractType: row['Contract Type'],
        contractValue: contractValue,
        startDate: startDate,
        endDate: endDate,
        project: row.Project,
        signature: row.Signature || "Not Signed"
      };

      try {
        const contact = new Contact(contactData);
        const savedContact = await contact.save();
        const populatedContact = await Contact.findById(savedContact._id)
          .populate('customer', 'company contact email phone');
          
        importedContacts.push(populatedContact);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedContacts.length} successful and ${errorMessages.length} failed`,
      importedCount: importedContacts.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedContacts
    });

  } catch (error) {
    console.error("Error importing contacts:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing contacts" 
    });
  }
};

// @desc    Update a contact for logged-in admin
// @route   PUT /api/contacts/:id
// @access  Private
export const updateContact = async (req, res) => {
  try {
    const { subject, customerId, contractType, contractValue, startDate, endDate, project, signature } = req.body;
    
    if (!subject || !customerId || !contractType || !contractValue || !startDate || !endDate || !project) {
      return res.status(400).json({ 
        message: "Subject, customer, contract type, contract value, start date, end date, and project are required fields" 
      });
    }

    // Check if contact exists and belongs to the admin
    const contact = await Contact.findOne({ _id: req.params.id, admin: req.admin._id });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Check if customer exists and belongs to the same admin
    const customer = await Customer.findOne({ _id: customerId, admin: req.admin._id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    contact.subject = subject;
    contact.customerId = customerId;
    contact.contractType = contractType;
    contact.contractValue = contractValue;
    contact.startDate = new Date(startDate);
    contact.endDate = new Date(endDate);
    contact.project = project;
    contact.signature = signature || "Not Signed";

    const updatedContact = await contact.save();
    const populatedContact = await Contact.findById(updatedContact._id)
      .populate('customer', 'company contact email phone');
      
    res.json(populatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a contact for logged-in admin
// @route   DELETE /api/contacts/:id
// @access  Private
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await Contact.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Contact removed successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Server error while deleting contact" });
  }
};

// @desc    Search customers by company name for logged-in admin
// @route   GET /api/contacts/customers/search
// @access  Private
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      admin: req.admin._id,
      company: { $regex: q, $options: 'i' }
    }).select('company contact email phone').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};