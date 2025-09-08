import Expense from "../../models/Expense.js";
import Customer from "../../models/Customer.js";
import XLSX from "xlsx";

// @desc    Get all expenses for logged-in admin
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ admin: req.admin._id })
      .populate('customer', 'company contact email')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const billable = expenses
      .filter(expense => expense.isInvoiced)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const nonBillable = total - billable;
    const notInvoiced = expenses
      .filter(expense => !expense.isInvoiced)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    res.json({
      expenses,
      stats: {
        total,
        billable,
        nonBillable,
        notInvoiced
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Server error while fetching expenses" });
  }
};

// @desc    Create an expense for logged-in admin
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { category, amount, name, customerId, date } = req.body;
    
    if (!category || !amount || !name || !customerId || !date) {
      return res.status(400).json({ 
        message: "Category, amount, name, customer, and date are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const expense = new Expense({
      admin: req.admin._id,
      category,
      amount,
      name,
      hasReceipt: req.body.hasReceipt || false,
      date,
      project: req.body.project || "",
      customerId,
      isInvoiced: req.body.isInvoiced || false,
      referenceId: req.body.referenceId || "",
      paymentMode: req.body.paymentMode || ""
    });

    const createdExpense = await expense.save();
    const populatedExpense = await Expense.findById(createdExpense._id)
      .populate('customer', 'company contact email');
      
    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Import expenses from CSV for logged-in admin
// @route   POST /api/expenses/import
// @access  Private
export const importExpenses = async (req, res) => {
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
    const requiredFields = ['Category', 'Amount', 'Name', 'Customer', 'Date'];
    const missingFields = requiredFields.filter(field => !jsonData[0].hasOwnProperty(field));
    
    if (missingFields.length) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Process each row
    const importedExpenses = [];
    const errorMessages = [];

    for (const [index, row] of jsonData.entries()) {
      const rowNumber = index + 2; // Excel rows start at 1, header is row 1
      
      // Skip if required fields are missing
      if (!row.Category || !row.Amount || !row.Name || !row.Customer || !row.Date) {
        errorMessages.push(`Row ${rowNumber}: Missing required fields`);
        continue;
      }

      // Find customer by company name
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

      // Validate category
      const validCategories = [
        "Travel Expense",
        "Meals & Entertainment",
        "Office Supplies",
        "Software & Tools",
        "Transportation",
        "Accommodation",
        "Communication",
        "Training & Education",
        "Other"
      ];
      
      if (!validCategories.includes(row.Category)) {
        errorMessages.push(`Row ${rowNumber}: Invalid category "${row.Category}"`);
        continue;
      }

      // Parse amount
      const amount = parseFloat(row.Amount);
      if (isNaN(amount) || amount < 0) {
        errorMessages.push(`Row ${rowNumber}: Invalid amount`);
        continue;
      }

      // Date validation and processing
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}-\d{2}-\d{4}$/;
      if (!dateRegex.test(row.Date)) {
        errorMessages.push(`Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY`);
        continue;
      }

      // Convert date to DD-MM-YYYY format if it's in YYYY-MM-DD format
      let formattedDate = row.Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(row.Date)) {
        const [year, month, day] = row.Date.split('-');
        formattedDate = `${day}-${month}-${year}`;
      }

      const expenseData = {
        admin: req.admin._id,
        category: row.Category,
        amount: amount,
        name: row.Name,
        hasReceipt: row.Receipt === "YES" || row.Receipt === "yes" || row.Receipt === true,
        date: formattedDate,
        project: row.Project || "",
        customerId: customer._id,
        isInvoiced: row.Invoiced === "YES" || row.Invoiced === "yes" || row.Invoiced === true,
        referenceId: row['Reference ID'] || "",
        paymentMode: row['Payment Mode'] || ""
      };

      try {
        const expense = new Expense(expenseData);
        const savedExpense = await expense.save();
        const populatedExpense = await Expense.findById(savedExpense._id)
          .populate('customer', 'company contact email');
          
        importedExpenses.push(populatedExpense);
      } catch (error) {
        const errorMsg = error.message.includes("validation failed") 
          ? `Row ${rowNumber}: Validation error - ${error.message.split(': ')[2]}`
          : `Row ${rowNumber}: ${error.message}`;
        errorMessages.push(errorMsg);
      }
    }

    res.status(201).json({
      message: `Import completed with ${importedExpenses.length} successful and ${errorMessages.length} failed`,
      importedCount: importedExpenses.length,
      errorCount: errorMessages.length,
      errorMessages,
      importedExpenses
    });

  } catch (error) {
    console.error("Error importing expenses:", error);
    res.status(500).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : "Server error while importing expenses" 
    });
  }
};

// @desc    Update an expense for logged-in admin
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { category, amount, name, customerId, date } = req.body;
    
    if (!category || !amount || !name || !customerId || !date) {
      return res.status(400).json({ 
        message: "Category, amount, name, customer, and date are required fields" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const expense = await Expense.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.category = category;
    expense.amount = amount;
    expense.name = name;
    expense.hasReceipt = req.body.hasReceipt || false;
    expense.date = date;
    expense.project = req.body.project || "";
    expense.customerId = customerId;
    expense.isInvoiced = req.body.isInvoiced || false;
    expense.referenceId = req.body.referenceId || "";
    expense.paymentMode = req.body.paymentMode || "";

    const updatedExpense = await expense.save();
    const populatedExpense = await Expense.findById(updatedExpense._id)
      .populate('customer', 'company contact email');
      
    res.json(populatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(400).json({ 
      message: error.message.includes("validation failed") 
        ? "Validation error: " + error.message 
        : error.message 
    });
  }
};

// @desc    Delete an expense for logged-in admin
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, admin: req.admin._id });
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.deleteOne({ _id: req.params.id, admin: req.admin._id });
    res.json({ message: "Expense removed successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error while deleting expense" });
  }
};

// @desc    Search customers by company name for expenses (for logged-in admin)
// @route   GET /api/expenses/customers/search
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
        { contact: { $regex: q, $options: 'i' } }
      ]
    }).select('company contact email').limit(10);
    
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Server error while searching customers" });
  }
};

// @desc    Bulk delete expenses for logged-in admin
// @route   POST /api/expenses/bulk-delete
// @access  Private
export const bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No expense IDs provided" });
    }

    const result = await Expense.deleteMany({ _id: { $in: ids }, admin: req.admin._id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No expenses found to delete" });
    }

    res.json({ 
      message: `${result.deletedCount} expense(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting expenses:", error);
    res.status(500).json({ message: "Server error while bulk deleting expenses" });
  }
};