import Lead from "../../models/Lead.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// Helper function to parse various date formats into YYYY-MM-DD
const parseDate = (dateString) => {
  if (!dateString) return "";

  let date;

  // Try parsing DD-MM-YYYY
  let match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    date = new Date(`${match[3]}-${match[2]}-${match[1]}`); // YYYY-MM-DD for Date constructor
  } else {
    // Try parsing YYYY-MM-DD
    match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      date = new Date(dateString);
    } else {
      // Try parsing M/D/YYYY or MM/DD/YYYY
      match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        date = new Date(`${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`); // YYYY-MM-DD for Date constructor
      } else {
        // Fallback to general Date constructor for other formats (e.g., Excel's numeric date)
        // If dateString is a number (Excel date), convert it
        if (!isNaN(dateString) && !isNaN(parseFloat(dateString))) {
          // Excel dates are days since 1900-01-01, with 1900-02-29 bug
          // JavaScript Date objects are milliseconds since 1970-01-01
          // Convert Excel date to JS date: (excel_date - 25569) * 86400000
          // 25569 is the number of days between 1900-01-01 and 1970-01-01 (adjusted for Excel's bug)
          date = new Date((dateString - 25569) * 86400 * 1000);
        } else {
          date = new Date(dateString);
        }
      }
    }
  }

  // Check if it's a valid date
  if (isNaN(date.getTime())) {
    return ""; // Return empty string if date is invalid
  }

  // Format to YYYY-MM-DD to match schema validation
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get all leads for logged-in admin
// @route   GET /api/leads
// @access  Private
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ admin: req.admin._id })
      .populate('customer', 'company contact email')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalLeads: leads.length,
      new: leads.filter(lead => lead.status === "New").length,
      contacted: leads.filter(lead => lead.status === "Contacted").length,
      qualified: leads.filter(lead => lead.status === "Qualified").length,
      proposal: leads.filter(lead => lead.status === "Proposal").length,
      customer: leads.filter(lead => lead.status === "Customer").length,
      lost: leads.filter(lead => lead.status === "Lost").length
    };

    // Calculate leads by source for charting
    const leadsBySource = leads.reduce((acc, lead) => {
      const source = lead.source && lead.source !== "" ? lead.source : "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(leadsBySource).map(source => ({
      name: source,
      value: leadsBySource[source]
    }));

    res.json({
      leads,
      stats,
      chartData
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error while fetching leads" });
  }
};

// @desc    Create a lead for logged-in admin
// @route   POST /api/leads
// @access  Private
export const createLead = async (req, res) => {
  try {
    const { name, company, email } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({
        message: "Name, company, and email are required fields"
      });
    }

    // Check if customer exists by company name and link if found
    let customerId = null;
    const customer = await Customer.findOne({
      admin: req.admin._id,
      company: { $regex: new RegExp(`^${company}$`, 'i') }
    });

    if (customer) {
      customerId = customer._id;
    }

    const lead = new Lead({
      admin: req.admin._id,
      name,
      company,
      email,
      phone: req.body.phone || "",
      value: req.body.value || 0,
      tags: req.body.tags || "",
      assigned: req.body.assigned || "",
      status: req.body.status || "New",
      source: req.body.source || "",
      lastContact: req.body.lastContact || "",
      created: req.body.created || "",
      customerId
    });

    const createdLead = await lead.save();
    const populatedLead = await Lead.findById(createdLead._id)
      .populate('customer', 'company contact email');

    res.status(201).json(populatedLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message
    });
  }
};

// @desc    Update a lead for logged-in admin
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (req, res) => {
  try {
    const { name, company, email } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({
        message: "Name, company, and email are required fields"
      });
    }

    const lead = await Lead.findOne({ _id: req.params.id, admin: req.admin._id });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check if customer exists by company name and link if found
    let customerId = null;
    const customer = await Customer.findOne({
      admin: req.admin._id,
      company: { $regex: new RegExp(`^${company}$`, 'i') }
    });

    if (customer) {
      customerId = customer._id;
    }

    lead.name = name;
    lead.company = company;
    lead.email = email;
    lead.phone = req.body.phone || "";
    lead.value = req.body.value || 0;
    lead.tags = req.body.tags || "";
    lead.assigned = req.body.assigned || "";
    lead.status = req.body.status || "New";
    lead.source = req.body.source || "";
    lead.lastContact = req.body.lastContact || "";
    lead.created = req.body.created || "";
    lead.customerId = customerId;

    const updatedLead = await lead.save();
    const populatedLead = await Lead.findById(updatedLead._id)
      .populate('customer', 'company contact email');

    res.json(populatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(400).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : error.message
    });
  }
};

// @desc    Delete a lead for logged-in admin
// @route   DELETE /api/leads/:id
// @access  Private
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, admin: req.admin._id });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    await Lead.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Lead removed successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ message: "Server error while deleting lead" });
  }
};

// @desc    Bulk delete leads for logged-in admin
// @route   POST /api/leads/bulk-delete
// @access  Private
export const bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No lead IDs provided" });
    }

    const result = await Lead.deleteMany({ _id: { $in: ids }, admin: req.admin._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No leads found to delete" });
    }

    res.json({
      message: `${result.deletedCount} lead(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting leads:", error);
    res.status(500).json({ message: "Server error while bulk deleting leads" });
  }
};

// @desc    Import leads from CSV/Excel for logged-in admin
// @route   POST /api/leads/import
// @access  Private
export const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return res.status(400).json({ message: "File is empty" });
    }

    // Validate required fields
    const requiredFields = ['Name', 'Company', 'Email'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Process each row
    const importedLeads = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1

      // Skip if required fields are missing
      if (!row.Name || !row.Company || !row.Email) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields (Name, Company, Email)`);
        continue;
      }

      // Check if customer exists by company name
      let customerId = null;
      try {
        const customer = await Customer.findOne({
          admin: req.admin._id,
          company: { $regex: new RegExp(`^${row.Company}$`, 'i') }
        });

        if (customer) {
          customerId = customer._id;
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error finding customer - ${error.message}`);
        continue;
      }

      // Validate status
      const validStatuses = ["New", "Contacted", "Qualified", "Proposal", "Customer", "Lost"];
      if (row.Status && !validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      // Validate source
      const validSources = ["Website", "Referral", "Social Media", "Cold Call", "Event", "Other", ""];
      if (row.Source && !validSources.includes(row.Source)) {
        errorMessages.push(`Row ${rowNumber}: Invalid source "${row.Source}"`);
        continue;
      }

      // Parse value
      const value = parseFloat(row.Value || 0);
      if (isNaN(value) || value < 0) {
        errorMessages.push(`Row ${rowNumber}: Invalid value`);
        continue;
      }

      // Parse and format dates using the helper function
      const formattedLastContact = parseDate(row['Last Contact']);
      const formattedCreated = parseDate(row.Created);

      const leadData = {
        admin: req.admin._id,
        name: row.Name,
        company: row.Company,
        email: row.Email,
        phone: row.Phone || "",
        value: value,
        tags: row.Tags || "",
        assigned: row.Assigned || "",
        status: row.Status || "New",
        source: row.Source || "",
        lastContact: formattedLastContact, // Use formatted date
        created: formattedCreated,         // Use formatted date
        customerId
      };

      try {
        const lead = new Lead(leadData);
        const savedLead = await lead.save();
        const populatedLead = await Lead.findById(savedLead._id)
          .populate('customer', 'company contact email');

        importedLeads.push(populatedLead);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed")
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedLeads.length} successful and ${errorMessages.length} failed`,
      importedCount: importedLeads.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedLeads
    });

  } catch (error) {
    console.error("Error importing leads:", error);
    res.status(500).json({
      message: error.message.includes("validation failed")
        ? "Validation error: " + error.message
        : "Server error while importing leads"
    });
  }
};