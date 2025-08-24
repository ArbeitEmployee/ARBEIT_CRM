import Subscription from "../../models/Subscription.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all subscriptions with customer details
// @route   GET /api/subscriptions
// @access  Public
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({})
      .populate('customer', 'company contact email phone')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: "Active" });
    const pastDueSubscriptions = await Subscription.countDocuments({ status: "Past Due" });
    const canceledSubscriptions = await Subscription.countDocuments({ status: "Canceled" });
    const futureSubscriptions = await Subscription.countDocuments({ status: "Future" });
    
    res.json({
      subscriptions,
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        pastDueSubscriptions,
        canceledSubscriptions,
        futureSubscriptions
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Server error while fetching subscriptions" });
  }
};

// @desc    Create a subscription
// @route   POST /api/subscriptions
// @access  Public
export const createSubscription = async (req, res) => {
  try {
    const { name, customerId, project, status, nextBilling, amount } = req.body;
    
    if (!name || !customerId || !project || !status || !nextBilling || !amount) {
      return res.status(400).json({ 
        message: "Name, customer, project, status, next billing date, and amount are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const subscription = new Subscription({
      name,
      customerId,
      project,
      status,
      nextBilling: new Date(nextBilling),
      dateSubscribed: req.body.dateSubscribed ? new Date(req.body.dateSubscribed) : new Date(),
      lastSent: req.body.lastSent ? new Date(req.body.lastSent) : null,
      amount,
      billingCycle: req.body.billingCycle || "Monthly",
      notes: req.body.notes || ""
    });

    const createdSubscription = await subscription.save();
    const populatedSubscription = await Subscription.findById(createdSubscription._id)
      .populate('customer', 'company contact email phone');
      
    res.status(201).json(populatedSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Import subscriptions from CSV
// @route   POST /api/subscriptions/import
// @access  Public
export const importSubscriptions = async (req, res) => {
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
    const requiredFields = ['Name', 'Customer', 'Project', 'Status', 'Next Billing', 'Amount'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedSubscriptions = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Name || !row.Customer || !row.Project || !row.Status || !row['Next Billing'] || !row.Amount) {
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

      // Validate status
      const validStatuses = [
        "Active", "Future", "Past Due", "Unpaid", 
        "Incomplete", "Canceled", "Incomplete Expired"
      ];
      
      if (!validStatuses.includes(row.Status)) {
        errorMessages.push(`Row ${rowNumber}: Invalid status "${row.Status}"`);
        continue;
      }

      // Parse dates
      let nextBillingDate;
      let dateSubscribed;
      let lastSentDate;
      
      try {
        nextBillingDate = new Date(row['Next Billing']);
        if (isNaN(nextBillingDate.getTime())) {
          errorMessages.push(`Row ${rowNumber}: Invalid Next Billing date format`);
          continue;
        }
        
        if (row['Date Subscribed']) {
          dateSubscribed = new Date(row['Date Subscribed']);
          if (isNaN(dateSubscribed.getTime())) {
            errorMessages.push(`Row ${rowNumber}: Invalid Date Subscribed format`);
            continue;
          }
        }
        
        if (row['Last Sent']) {
          lastSentDate = new Date(row['Last Sent']);
          if (isNaN(lastSentDate.getTime())) {
            errorMessages.push(`Row ${rowNumber}: Invalid Last Sent date format`);
            continue;
          }
        }
      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: Error parsing dates - ${error.message}`);
        continue;
      }

      // Parse amount
      const amount = parseFloat(row.Amount);
      if (isNaN(amount) || amount < 0) {
        errorMessages.push(`Row ${rowNumber}: Invalid amount`);
        continue;
      }

      const subscriptionData = {
        name: row.Name,
        customerId: customer._id,
        project: row.Project,
        status: row.Status,
        nextBilling: nextBillingDate,
        dateSubscribed: dateSubscribed || new Date(),
        lastSent: lastSentDate || null,
        amount: amount,
        billingCycle: row['Billing Cycle'] || "Monthly",
        notes: row.Notes || ""
      };

      try {
        const subscription = new Subscription(subscriptionData);
        const savedSubscription = await subscription.save();
        const populatedSubscription = await Subscription.findById(savedSubscription._id)
          .populate('customer', 'company contact email phone');
          
        importedSubscriptions.push(populatedSubscription);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedSubscriptions.length} successful and ${errorMessages.length} failed`,
      importedCount: importedSubscriptions.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedSubscriptions
    });

  } catch (error) {
    console.error("Error importing subscriptions:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing subscriptions" 
    });
  }
};

// @desc    Update a subscription
// @route   PUT /api/subscriptions/:id
// @access  Public
export const updateSubscription = async (req, res) => {
  try {
    const { name, customerId, project, status, nextBilling, amount } = req.body;
    
    if (!name || !customerId || !project || !status || !nextBilling || !amount) {
      return res.status(400).json({ 
        message: "Name, customer, project, status, next billing date, and amount are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.name = name;
    subscription.customerId = customerId;
    subscription.project = project;
    subscription.status = status;
    subscription.nextBilling = new Date(nextBilling);
    subscription.amount = amount;
    subscription.billingCycle = req.body.billingCycle || "Monthly";
    subscription.notes = req.body.notes || "";
    
    if (req.body.dateSubscribed) {
      subscription.dateSubscribed = new Date(req.body.dateSubscribed);
    }
    
    if (req.body.lastSent) {
      subscription.lastSent = new Date(req.body.lastSent);
    }

    const updatedSubscription = await subscription.save();
    const populatedSubscription = await Subscription.findById(updatedSubscription._id)
      .populate('customer', 'company contact email phone');
      
    res.json(populatedSubscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Public
export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    await Subscription.deleteOne({ _id: req.params.id });
    res.json({ message: "Subscription removed successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Server error while deleting subscription" });
  }
};

// @desc    Search customers by company name
// @route   GET /api/subscriptions/customers/search
// @access  Public
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const customers = await Customer.find({
      company: { $regex: q, $options: 'i' }
    }).select('company contact email phone').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};