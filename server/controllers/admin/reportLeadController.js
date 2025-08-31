// MultipleFiles/controllers/admin/reportLeadController.js
import Lead from "../../models/Lead.js";

// Helper function to parse various date formats into a Date object
// This is crucial if lastContact is stored as a string in various formats
const parseDateStringToDate = (dateString) => {
  if (!dateString) return null;

  let date;
  // Try parsing DD-MM-YYYY
  let match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
  } else {
    // Try parsing YYYY-MM-DD
    match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      date = new Date(dateString);
    } else {
      // Try parsing M/D/YYYY or MM/DD/YYYY
      match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        date = new Date(`${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`);
      } else {
        // Fallback for Excel numeric dates or other formats
        if (!isNaN(dateString) && !isNaN(parseFloat(dateString))) {
          date = new Date((dateString - 25569) * 86400 * 1000);
        } else {
          date = new Date(dateString);
        }
      }
    }
  }
  return isNaN(date.getTime()) ? null : date;
};


// @desc    Get leads report data
// @route   GET /api/reports/leads
// @access  Public
export const getLeadsReport = async (req, res) => {
  try {
    const leads = await Lead.find({});

    // 1. Leads by Source
    const leadsBySource = leads.reduce((acc, lead) => {
      const source = lead.source && lead.source !== "" ? lead.source : "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const sourceChartData = Object.keys(leadsBySource).map(source => ({
      name: source,
      value: leadsBySource[source]
    }));

    // 2. Last Contact by Weekday
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const leadsByWeekday = new Array(7).fill(0); // Initialize counts for each day

    leads.forEach(lead => {
      const lastContactDate = parseDateStringToDate(lead.lastContact);
      if (lastContactDate) {
        const dayOfWeek = lastContactDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        leadsByWeekday[dayOfWeek]++;
      }
    });

    const weekdayChartData = weekdays.map((day, index) => ({
      name: day,
      value: leadsByWeekday[index]
    }));

    res.json({
      sourceChartData,
      weekdayChartData
    });
  } catch (error) {
    console.error("Error fetching leads report:", error);
    res.status(500).json({ message: "Server error while fetching leads report" });
  }
};
