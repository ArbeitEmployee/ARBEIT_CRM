import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invoices: {
      total: 0,
      draft: 0,
      notSent: 0,
      unpaid: 0,
      partiallyPaid: 0,
      overdue: 0,
      paid: 0,
      totalAmount: 0,
      pastDueAmount: 0,
      paidAmount: 0
    },
    estimates: {
      total: 0,
      draft: 0,
      notSent: 0,
      sent: 0,
      expired: 0,
      declined: 0,
      accepted: 0
    },
    proposals: {
      total: 0,
      draft: 0,
      sent: 0,
      open: 0,
      revised: 0,
      declined: 0,
      accepted: 0
    },
    leads: {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      customer: 0,
      lost: 0
    },
    projects: {
      total: 0,
      progress: 0,
      onHold: 0,
      cancelled: 0,
      finished: 0
    }
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const STATUS_COLORS = {
    draft: '#9CA3AF',
    notSent: '#8884d8',
    unpaid: '#EF4444',
    partiallyPaid: '#F59E0B',
    overdue: '#3B82F6',
    paid: '#10B981',
    sent: '#3B82F6',
    expired: '#6B7280',
    declined: '#EF4444',
    accepted: '#10B981',
    open: '#3B82F6',
    revised: '#8B5CF6',
    new: '#3B82F6',
    contacted: '#8B5CF6',
    qualified: '#10B981',
    proposal: '#F59E0B',
    customer: '#10B981',
    lost: '#EF4444',
    progress: '#3B82F6',
    onHold: '#F59E0B',
    cancelled: '#EF4444',
    finished: '#10B981'
  };

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) {
      navigate("/admin/login");
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const requests = [
        axios.get("http://localhost:5000/api/admin/invoices"),
        axios.get("http://localhost:5000/api/admin/proposals"),
        axios.get("http://localhost:5000/api/admin/estimates"),
        axios.get("http://localhost:5000/api/leads"),
        axios.get("http://localhost:5000/api/projects")
      ];

      const responses = await Promise.allSettled(requests);
      
      // Process invoices data
      if (responses[0].status === 'fulfilled') {
        const invoicesData = responses[0].value.data.data || responses[0].value.data || [];
        const totalInvoices = invoicesData.length;
        
        setStats(prev => ({
          ...prev,
          invoices: {
            ...prev.invoices,
            total: totalInvoices,
            draft: invoicesData.filter(i => i.status === "Draft").length,
            notSent: invoicesData.filter(i => i.status === "Not Sent").length,
            unpaid: invoicesData.filter(i => i.status === "Unpaid").length,
            partiallyPaid: invoicesData.filter(i => i.status === "Partiallypaid").length,
            overdue: invoicesData.filter(i => i.status === "Overdue").length,
            paid: invoicesData.filter(i => i.status === "Paid").length,
          }
        }));
      }

      // Process proposals data
      if (responses[1].status === 'fulfilled') {
        const proposalsData = responses[1].value.data.data || responses[1].value.data || [];
        
        setStats(prev => ({
          ...prev,
          proposals: {
            ...prev.proposals,
            total: proposalsData.length,
            draft: proposalsData.filter(p => p.status === "Draft").length,
            sent: proposalsData.filter(p => p.status === "Sent").length,
            open: proposalsData.filter(p => p.status === "Open").length,
            revised: proposalsData.filter(p => p.status === "Revised").length,
            declined: proposalsData.filter(p => p.status === "Declined").length,
            accepted: proposalsData.filter(p => p.status === "Accepted").length
          }
        }));
      }

      // Process estimates data
      if (responses[2].status === 'fulfilled') {
        const estimatesData = responses[2].value.data.data || responses[2].value.data || [];
        
        setStats(prev => ({
          ...prev,
          estimates: {
            ...prev.estimates,
            total: estimatesData.length,
            draft: estimatesData.filter(e => e.status === "Draft").length,
            notSent: estimatesData.filter(e => e.status === "Not Sent").length,
            sent: estimatesData.filter(e => e.status === "Sent").length,
            expired: estimatesData.filter(e => e.status === "Expired").length,
            declined: estimatesData.filter(e => e.status === "Declined").length,
            accepted: estimatesData.filter(e => e.status === "Accepted").length
          }
        }));
      }

      // Process leads data
      if (responses[3].status === 'fulfilled') {
        const leadsData = responses[3].value.data.leads || [];
        const leadsStats = responses[3].value.data.stats || {
          totalLeads: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          proposal: 0,
          customer: 0,
          lost: 0
        };
        
        setStats(prev => ({
          ...prev,
          leads: {
            total: leadsStats.totalLeads || leadsData.length,
            new: leadsStats.new || leadsData.filter(l => l.status === "New").length,
            contacted: leadsStats.contacted || leadsData.filter(l => l.status === "Contacted").length,
            qualified: leadsStats.qualified || leadsData.filter(l => l.status === "Qualified").length,
            proposal: leadsStats.proposal || leadsData.filter(l => l.status === "Proposal").length,
            customer: leadsStats.customer || leadsData.filter(l => l.status === "Customer").length,
            lost: leadsStats.lost || leadsData.filter(l => l.status === "Lost").length
          }
        }));
      }

      // Process projects data
      if (responses[4].status === 'fulfilled') {
        const projectsData = responses[4].value.data.projects || [];
        
        setStats(prev => ({
          ...prev,
          projects: {
            total: projectsData.length,
            progress: projectsData.filter(p => p.status === "Progress").length,
            onHold: projectsData.filter(p => p.status === "On Hold").length,
            cancelled: projectsData.filter(p => p.status === "Cancelled").length,
            finished: projectsData.filter(p => p.status === "Finished").length
          }
        }));
      }
      
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return "0.00%";
    return ((value / total) * 100).toFixed(2) + "%";
  };

  // Prepare data for charts
  const invoiceChartData = [
    { name: 'Draft', value: stats.invoices.draft, color: STATUS_COLORS.draft },
    { name: 'Not Sent', value: stats.invoices.notSent, color: STATUS_COLORS.notSent },
    { name: 'Unpaid', value: stats.invoices.unpaid, color: STATUS_COLORS.unpaid },
    { name: 'Partially Paid', value: stats.invoices.partiallyPaid, color: STATUS_COLORS.partiallyPaid },
    { name: 'Overdue', value: stats.invoices.overdue, color: STATUS_COLORS.overdue },
    { name: 'Paid', value: stats.invoices.paid, color: STATUS_COLORS.paid },
  ];

  const leadsChartData = [
    { name: 'New', value: stats.leads.new, color: STATUS_COLORS.new },
    { name: 'Contacted', value: stats.leads.contacted, color: STATUS_COLORS.contacted },
    { name: 'Qualified', value: stats.leads.qualified, color: STATUS_COLORS.qualified },
    { name: 'Proposal', value: stats.leads.proposal, color: STATUS_COLORS.proposal },
    { name: 'Customer', value: stats.leads.customer, color: STATUS_COLORS.customer },
    { name: 'Lost', value: stats.leads.lost, color: STATUS_COLORS.lost },
  ];

  const projectChartData = [
    { name: 'In Progress', value: stats.projects.progress, color: STATUS_COLORS.progress },
    { name: 'On Hold', value: stats.projects.onHold, color: STATUS_COLORS.onHold },
    { name: 'Cancelled', value: stats.projects.cancelled, color: STATUS_COLORS.cancelled },
    { name: 'Finished', value: stats.projects.finished, color: STATUS_COLORS.finished },
  ];

  const overviewData = [
    { name: 'Leads', value: stats.leads.total, fill: '#3B82F6' },
    { name: 'Invoices', value: stats.invoices.total, fill: '#10B981' },
    { name: 'Projects', value: stats.projects.total, fill: '#8B5CF6' },
    { name: 'Proposals', value: stats.proposals.total, fill: '#F59E0B' },
    { name: 'Estimates', value: stats.estimates.total, fill: '#EF4444' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome to the admin panel. Here you can manage leads, clients, and all CRM data.
            </p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Leads Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Leads</h2>
                <p className="text-lg font-bold text-gray-800">{formatNumber(stats.leads.total)}</p>
              </div>
            </div>
          </div>

          {/* Invoices Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Invoices</h2>
                <p className="text-lg font-bold text-gray-800">{formatNumber(stats.invoices.total)}</p>
              </div>
            </div>
          </div>

          {/* Projects Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Total Projects</h2>
                <p className="text-lg font-bold text-gray-800">{formatNumber(stats.projects.total)}</p>
              </div>
            </div>
          </div>

          {/* Proposals Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Proposals</h2>
                <p className="text-lg font-bold text-gray-800">{formatNumber(stats.proposals.total)}</p>
              </div>
            </div>
          </div>

          {/* Estimates Card */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-500 text-xs">Estimates</h2>
                <p className="text-lg font-bold text-gray-800">{formatNumber(stats.estimates.total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count">
                  {overviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice, Estimate, and Proposal Overviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Invoice Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Invoice Overview</h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {invoiceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {invoiceChartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(item.value)}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      {calculatePercentage(item.value, stats.invoices.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimate Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Estimate Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Draft</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.draft)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.draft, stats.estimates.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Not Sent</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.notSent)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.notSent, stats.estimates.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Sent</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.sent)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.sent, stats.estimates.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Expired</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.expired)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.expired, stats.estimates.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Declined</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.declined)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.declined, stats.estimates.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Accepted</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.estimates.accepted)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.estimates.accepted, stats.estimates.total)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Draft', value: stats.estimates.draft },
                    { name: 'Not Sent', value: stats.estimates.notSent },
                    { name: 'Sent', value: stats.estimates.sent },
                    { name: 'Expired', value: stats.estimates.expired },
                    { name: 'Declined', value: stats.estimates.declined },
                    { name: 'Accepted', value: stats.estimates.accepted },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Proposal Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Proposal Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Draft</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.draft)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.draft, stats.proposals.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Sent</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.sent)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.sent, stats.proposals.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Open</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.open)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.open, stats.proposals.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Revised</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.revised)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.revised, stats.proposals.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Declined</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.declined)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.declined, stats.proposals.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Accepted</span>
                <div className="text-right">
                  <span className="font-medium">{formatNumber(stats.proposals.accepted)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {calculatePercentage(stats.proposals.accepted, stats.proposals.total)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: 'Draft', value: stats.proposals.draft },
                    { name: 'Sent', value: stats.proposals.sent },
                    { name: 'Open', value: stats.proposals.open },
                    { name: 'Revised', value: stats.proposals.revised },
                    { name: 'Declined', value: stats.proposals.declined },
                    { name: 'Accepted', value: stats.proposals.accepted },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leads and Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Leads Overview</h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {leadsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {leadsChartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(item.value)}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      {calculatePercentage(item.value, stats.leads.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Overview */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Projects Overview</h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {projectChartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatNumber(item.value)}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      {calculatePercentage(item.value, stats.projects.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;