import Expense from "../../models/Expense.js";
import Lead from "../../models/Lead.js";
import Contact from "../../models/Contact.js";
import Customer from "../../models/Customer.js";
import { Parser } from "json2csv";

// Helper function to calculate date ranges
const getDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'this-week':
      start = new Date(now.setDate(now.getDate() - now.getDay()));
      start.setHours(0, 0, 0, 0);
      end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      end.setHours(23, 59, 59, 999);
      break;
    case 'this-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this-quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this-year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last-week':
      start = new Date(now.setDate(now.getDate() - now.getDay() - 7));
      start.setHours(0, 0, 0, 0);
      end = new Date(now.setDate(now.getDate() - now.getDay() - 1));
      end.setHours(23, 59, 59, 999);
      break;
    case 'last-month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last-quarter':
      const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
      start = new Date(now.getFullYear(), lastQuarter * 3, 1);
      end = new Date(now.getFullYear(), lastQuarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last-year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      break;
    default: // all-time
      return {};
  }

  return {
    createdAt: {
      $gte: start,
      $lte: end
    }
  };
};

// @desc    Export data as CSV
// @route   GET /api/csvexport/:type
// @access  Private (Admin only)
export const exportToCSV = async (req, res) => {
  try {
    const { type } = req.params;
    const { period, startDate, endDate } = req.query;

    if (!type || !['leads', 'expenses', 'contacts', 'customers'].includes(type)) {
      return res.status(400).json({ message: "Invalid export type" });
    }

    let data = [];
    let fields = [];
    let opts = {};

    // Build date query
    const dateQuery = period !== 'all-time' ? getDateRange(period, startDate, endDate) : {};

    // Add admin filter to ensure each admin only exports their own data
    const adminQuery = { admin: req.admin._id, ...dateQuery };

    if (type === 'expenses') {
      data = await Expense.find(adminQuery)
        .populate('customer', 'company contact email')
        .sort({ createdAt: -1 });

      fields = [
        { label: 'ID', value: '_id' },
        { label: 'Category', value: 'category' },
        { label: 'Amount', value: 'amount' },
        { label: 'Name', value: 'name' },
        { label: 'Receipt', value: row => row.hasReceipt ? 'YES' : 'NO' },
        { label: 'Date', value: 'date' },
        { label: 'Project', value: 'project' },
        { label: 'Customer', value: row => row.customer ? row.customer.company : 'N/A' },
        { label: 'Invoiced', value: row => row.isInvoiced ? 'YES' : 'NO' },
        { label: 'Reference ID', value: 'referenceId' },
        { label: 'Payment Mode', value: 'paymentMode' },
        { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
      ];

    } else if (type === 'leads') {
      data = await Lead.find(adminQuery)
        .populate('customer', 'company contact email')
        .sort({ createdAt: -1 });

      // Convert data to plain objects to handle virtual fields
      const plainData = data.map(lead => lead.toObject());

      fields = [
        { label: 'ID', value: '_id' },
        { label: 'Name', value: 'name' },
        { label: 'Company', value: 'company' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Value', value: 'value' },
        { label: 'Tags', value: row => row.tags || '' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Status', value: 'status' },
        { label: 'Source', value: 'source' },
        { label: 'Last Contact', value: 'lastContact' },
        { label: 'Created', value: 'created' },
        { label: 'Customer Company', value: row => row.customer ? row.customer.company : 'N/A' },
        { label: 'Customer Contact', value: row => row.customer ? row.customer.contact : 'N/A' },
        { label: 'Customer Email', value: row => row.customer ? row.customer.email : 'N/A' },
        { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
      ];

      opts = { fields };

      // Convert JSON to CSV
      const parser = new Parser(opts);
      const csv = parser.parse(plainData);

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${new Date().toISOString().split('T')[0]}.csv`);

      // Send CSV file
      return res.status(200).send(csv);

    } else if (type === 'contacts') {
      data = await Contact.find(adminQuery)
        .populate('customer', 'company contact email phone')
        .sort({ createdAt: -1 });

      fields = [
        { label: 'ID', value: '_id' },
        { label: 'Subject', value: 'subject' },
        { label: 'Customer', value: row => row.customer ? row.customer.company : 'N/A' },
        { label: 'Contact Person', value: row => row.customer ? row.customer.contact : 'N/A' },
        { label: 'Email', value: row => row.customer ? row.customer.email : 'N/A' },
        { label: 'Phone', value: row => row.customer ? row.customer.phone : 'N/A' },
        { label: 'Contract Type', value: 'contractType' },
        { label: 'Contract Value', value: 'contractValue' },
        { label: 'Start Date', value: row => new Date(row.startDate).toLocaleDateString() },
        { label: 'End Date', value: row => new Date(row.endDate).toLocaleDateString() },
        { label: 'Project', value: 'project' },
        { label: 'Signature Status', value: 'signature' },
        { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
      ];

    } else if (type === 'customers') {
      data = await Customer.find(adminQuery).sort({ createdAt: -1 });

      fields = [
        { label: 'ID', value: '_id' },
        { label: 'Company', value: 'company' },
        { label: 'VAT Number', value: 'vatNumber' },
        { label: 'Primary Contact', value: 'contact' },
        { label: 'Phone', value: 'phone' },
        { label: 'Email', value: 'email' },
        { label: 'Website', value: 'website' },
        { label: 'Groups', value: row => row.groups.join(', ') },
        { label: 'Currency', value: 'currency' },
        { label: 'Language', value: 'language' },
        { label: 'Active Customer', value: row => row.active ? 'Yes' : 'No' },
        { label: 'Active Contacts', value: row => row.contactsActive ? 'Yes' : 'No' },
        { label: 'Date Created', value: row => new Date(row.dateCreated).toLocaleString() },
        { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
      ];
    }

    opts = { fields };

    // Convert JSON to CSV
    const parser = new Parser(opts);
    const csv = parser.parse(data);

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${new Date().toISOString().split('T')[0]}.csv`);

    // Send CSV file
    res.status(200).send(csv);

  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ message: "Server error while exporting CSV" });
  }
};