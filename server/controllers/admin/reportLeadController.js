// MultipleFiles/controllers/admin/reportLeadController.js
import Lead from "../../models/Lead.js";

// Helper function to parse various date formats into a Date object
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

// Helper function to get the start and end of the current week
const getWeekRange = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { startOfWeek, endOfWeek };
};

// Helper function to get the days in a month
const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

// @desc    Get leads report data
// @route   GET /api/reports/leads
// @access  Public
export const getLeadsReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const leads = await Lead.find({});

    // 1. Leads by Source (This Week)
    const { startOfWeek, endOfWeek } = getWeekRange();
    
    const leadsBySource = leads.reduce((acc, lead) => {
      const createdDate = parseDateStringToDate(lead.created);
      
      // Only include leads from this week
      if (createdDate && createdDate >= startOfWeek && createdDate <= endOfWeek) {
        const source = lead.source && lead.source !== "" ? lead.source : "Unknown";
        acc[source] = (acc[source] || 0) + 1;
      }
      return acc;
    }, {});

    const sourceChartData = Object.keys(leadsBySource).map(source => ({
      name: source,
      value: leadsBySource[source]
    }));

    // 2. This Week Leads Conversions
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekConversionData = new Array(7).fill(0).map((_, index) => ({
      name: weekdays[index],
      value: 0
    }));

    leads.forEach(lead => {
      const createdDate = parseDateStringToDate(lead.created);
      if (createdDate && createdDate >= startOfWeek && createdDate <= endOfWeek) {
        const dayOfWeek = createdDate.getDay();
        weekConversionData[dayOfWeek].value++;
      }
    });

    // 3. Daily Leads for selected month
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const dailyLeadsData = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      value: 0
    }));

    leads.forEach(lead => {
      const createdDate = parseDateStringToDate(lead.created);
      if (createdDate) {
        const leadMonth = createdDate.getMonth() + 1;
        const leadYear = createdDate.getFullYear();
        
        if (leadMonth === currentMonth && leadYear === currentYear) {
          const day = createdDate.getDate() - 1; // Array index starts at 0
          if (day >= 0 && day < daysInMonth) {
            dailyLeadsData[day].value++;
          }
        }
      }
    });

    res.json({
      sourceChartData,
      weekConversionData,
      dailyLeadsData
    });
  } catch (error) {
    console.error("Error fetching leads report:", error);
    res.status(500).json({ message: "Server error while fetching leads report" });
  }
};