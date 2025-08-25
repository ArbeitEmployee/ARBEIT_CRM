import Contact from "../../models/Contact.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Public
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({})
      .populate('customer', 'company contact email')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const active = contacts.length;
    const expired = contacts.filter(contact => {
      // Check if end date is in the past
      const endDateParts = contact.endDate.split('-');
      const endDate = new Date(`${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`);
      return endDate < new Date();
    }).length;
    
    const aboutToExpire = contacts.filter(contact => {
      // Check if end date is within 30 days
      const endDateParts = contact.endDate.split('-');
      const endDate = new Date(`${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate > new Date() && endDate <= thirtyDaysFromNow;
    }).length;
    
    // Recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = contacts.filter(contact => 
      new Date(contact.createdAt) > sevenDaysAgo
    ).length;

    // Calculate contract value by type
    const contractValueByType = contacts.reduce((acc, contact) => {
      if (!acc[contact.contractType]) {
        acc[contact.contractType] = 0;
      }
      acc[contact.contractType] += contact.contractValue;
      return acc;
    }, {});

    // Calculate contract count by type
    const contractCountByType = contacts.reduce((acc, contact) => {
      if (!acc[contact.contractType]) {
        acc[contact.contractType] = 0;
      }
      acc[contact.contractType] += 1;
      return acc;
    }, {});

    // Format data for charts
    const chartData = Object.keys(contractCountByType).map((type, index) => {
      const colors = ['#8884d8', '#82ca9d', '#ffc658'];
      return {
        name: type,
        value: contractCountByType[type],
        color: colors[index] || '#8884d8'
      };
    });

    const contractValueData = Object.keys(contractValueByType).map(type => ({
      type,
      value: contractValueByType[type]
    }));

    res.json({
      contacts,
      stats: {
        active,
        expired,
        aboutToExpire,
        recentlyAdded,
        trash: 0
      },
      chartData,
      contractValueData
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error while fetching contacts" });
  }
};

// @desc    Create a contact
// @route   POST /api/contacts
// @access  Public
export const createContact = async (req, res) => {
  try {
    const { subject, customerId, contractType, contractValue, startDate, endDate, project, signature } = req.body;
    
    if (!subject || !customerId || !contractType || !contractValue || !startDate || !endDate || !project || !signature) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const contact = new Contact({
      subject,
      customerId,
      contractType,
      contractValue,
      startDate,
      endDate,
      project,
      signature
    });

    const createdContact = await contact.save();
    const populatedContact = await Contact.findById(createdContact._id)
      .populate('customer', 'company contact email');
      
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

// @desc    Import contacts from CSV
// @route   POST /api/contacts/import
// @access  Public
export const importContacts = async (req, res) => {
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
    const requiredFields = ['Subject', 'Customer', 'Contract Type', 'Contract Value', 'Start Date', 'End Date', 'Project', 'Signature'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedContacts = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Subject || !row.Customer || !row['Contract Type'] || !row['Contract Value'] || !row['Start Date'] || !row['End Date'] || !row.Project || !row.Signature) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name
      let customer;
      try {
        customer = await Customer.findOne({ 
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
      const validContractTypes = [
        "Express Contract",
        "Standard Contract",
        "Custom Contract"
      ];
      
      if (!validContractTypes.includes(row['Contract Type'])) {
        errorMessages.push(`Row ${rowNumber}: Invalid contract type "${row['Contract Type']}"`);
        continue;
      }

      // Parse contract value
      const contractValue = parseFloat(row['Contract Value']);
      if (isNaN(contractValue) || contractValue < 0) {
        errorMessages.push(`Row ${rowNumber}: Invalid contract value`);
        continue;
      }

      // Validate signature status
      const validSignatureStatus = ["Signed", "Not Signed"];
      if (!validSignatureStatus.includes(row.Signature)) {
        errorMessages.push(`Row ${rowNumber}: Invalid signature status "${row.Signature}"`);
        continue;
      }

      // Validate date formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}-\d{2}-\d{4}$/;
      if (!dateRegex.test(row['Start Date']) || !dateRegex.test(row['End Date'])) {
        errorMessages.push(`Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY`);
        continue;
      }

      // Convert dates to DD-MM-YYYY format if they're in YYYY-MM-DD format
      let formattedStartDate = row['Start Date'];
      if (/^\d{4}-\d{2}-\d{2}$/.test(row['Start Date'])) {
        const [year, month, day] = row['Start Date'].split('-');
        formattedStartDate = `${day}-${month}-${year}`;
      }

      let formattedEndDate = row['End Date'];
      if (/^\d{4}-\d{2}-\d{2}$/.test(row['End Date'])) {
        const [year, month, day] = row['End Date'].split('-');
        formattedEndDate = `${day}-${month}-${year}`;
      }

      const contactData = {
        subject: row.Subject,
        customerId: customer._id,
        contractType: row['Contract Type'],
        contractValue: contractValue,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        project: row.Project,
        signature: row.Signature
      };

      try {
        const contact = new Contact(contactData);
        const savedContact = await contact.save();
        const populatedContact = await Contact.findById(savedContact._id)
          .populate('customer', 'company contact email');
          
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

// @desc    Update a contact
// @route   PUT /api/contacts/:id
// @access  Public
export const updateContact = async (req, res) => {
  try {
    const { subject, customerId, contractType, contractValue, startDate, endDate, project, signature } = req.body;
    
    if (!subject || !customerId || !contractType || !contractValue || !startDate || !endDate || !project || !signature) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contact.subject = subject;
    contact.customerId = customerId;
    contact.contractType = contractType;
    contact.contractValue = contractValue;
    contact.startDate = startDate;
    contact.endDate = endDate;
    contact.project = project;
    contact.signature = signature;

    const updatedContact = await contact.save();
    const populatedContact = await Contact.findById(updatedContact._id)
      .populate('customer', 'company contact email');
      
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

// @desc    Delete a contact
// @route   DELETE /api/contacts/:id
// @access  Public
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await Contact.deleteOne({ _id: req.params.id });
    res.json({ message: "Contact removed successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Server error while deleting contact" });
  }
};

// @desc    Search customers by company name for contacts
// @route   GET /api/contacts/customers/search
// @access  Public
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      $or: [
        { company: { $regex: q, $options: 'i' } },
        { contact: { $regex: q, $options: 'i' } }
      ]
    }).select('company contact email').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};

// @desc    Bulk delete contacts
// @route   POST /api/contacts/bulk-delete
// @access  Public
export const bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No contact IDs provided" });
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No contacts found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} contact(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting contacts:", error);
    res.status(500).json({ message: "Server error while bulk deleting contacts" });
  }
};