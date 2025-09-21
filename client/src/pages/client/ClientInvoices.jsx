import { useState, useEffect, useRef } from "react";
import { 
  FaEye, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, 
  FaChevronRight, FaSearch, FaSyncAlt, FaFileInvoiceDollar,
  FaTimes, FaMoneyCheckAlt
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ClientInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    partiallypaid: 0
  });
  
  // Batch payment state
  const [showBatchPayment, setShowBatchPayment] = useState(false);
  const [batchPaymentData, setBatchPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: "",
    transactionId: "",
    notes: ""
  });
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [batchPaymentError, setBatchPaymentError] = useState("");
  const [batchPaymentLoading, setBatchPaymentLoading] = useState(false);

  // Get client token from localStorage
  const getClientToken = () => {
    return localStorage.getItem('crm_client_token');
  };

  // Create axios instance with client auth headers
  const createAxiosConfig = () => {
    const token = getClientToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch client invoices
  const fetchClientInvoices = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get("http://localhost:5000/api/client/invoices", config);
      
      if (data.success) {
        setInvoices(data.data || []);
        
        // Calculate stats
        const total = data.data.length;
        const paid = data.data.filter(i => i.status === "Paid").length;
        const unpaid = data.data.filter(i => i.status === "Unpaid").length;
        const overdue = data.data.filter(i => i.status === "Overdue").length;
        const partiallypaid = data.data.filter(i => i.status === "Partiallypaid").length;
        
        setStats({ total, paid, unpaid, overdue, partiallypaid });
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem('crm_client_token');
        navigate("/client/login");
      }
      setInvoices([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientInvoices();
  }, []);

  // Get payable invoices (Unpaid, Partiallypaid, Overdue)
  const getPayableInvoices = () => {
    return invoices.filter(invoice => 
      invoice.status === "Unpaid" || invoice.status === "Partiallypaid" || invoice.status === "Overdue"
    );
  };

  // Handle batch payment amount change
  const handlePaymentAmountChange = (invoiceId, amount) => {
    const numAmount = parseFloat(amount) || 0;
    
    // Get the invoice to validate amount
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (invoice) {
      const balanceDue = invoice.total - (invoice.paidAmount || 0);
      
      // Ensure payment doesn't exceed balance due
      if (numAmount > balanceDue) {
        setPaymentAmounts(prev => ({
          ...prev,
          [invoiceId]: balanceDue
        }));
        return;
      }
    }
    
    setPaymentAmounts(prev => ({
      ...prev,
      [invoiceId]: numAmount
    }));
  };

  // Process batch payments
  const processBatchPayments = async () => {
    setBatchPaymentLoading(true);
    setBatchPaymentError("");
    
    try {
      const config = createAxiosConfig();
      const payableInvoices = getPayableInvoices();
      let hasValidPayment = false;
      
      // Check if at least one payment is being made
      for (const invoice of payableInvoices) {
        if (paymentAmounts[invoice._id] > 0) {
          hasValidPayment = true;
          break;
        }
      }
      
      if (!hasValidPayment) {
        setBatchPaymentError("Please enter at least one payment amount.");
        setBatchPaymentLoading(false);
        return;
      }
      
      // Validate payment mode
      if (!batchPaymentData.paymentMode.trim()) {
        setBatchPaymentError("Payment mode is required.");
        setBatchPaymentLoading(false);
        return;
      }
      
      // Process each payment
      for (const invoice of payableInvoices) {
        const paymentAmount = paymentAmounts[invoice._id] || 0;
        
        if (paymentAmount > 0) {
          const paymentDataToSend = {
            invoice: invoice._id,
            paymentDate: batchPaymentData.paymentDate,
            paymentMode: batchPaymentData.paymentMode,
            transactionId: batchPaymentData.transactionId,
            amount: paymentAmount,
            notes: batchPaymentData.notes || `Batch payment processed on ${new Date().toLocaleDateString()}`
          };

          await axios.post(
            "http://localhost:5000/api/client/payments",
            paymentDataToSend,
            config
          );
        }
      }
      
      // Refresh data
      fetchClientInvoices();
      setShowBatchPayment(false);
      setPaymentAmounts({});
      alert("Payments processed successfully!");
      
    } catch (error) {
      console.error("Error processing batch payments", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('crm_client_token');
        navigate("/client/login");
      }
      setBatchPaymentError(error.response?.data?.message || "Error processing payments. Please try again.");
    }
    setBatchPaymentLoading(false);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredInvoices.slice(startIndex, startIndex + entriesPerPage);

  // Status colors
  const getStatusColor = (status) => {
    switch(status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Unpaid": return "bg-blue-100 text-blue-800";
      case "Overdue": return "bg-red-100 text-red-800";
      case "Partiallypaid": return "bg-yellow-100 text-yellow-800";
      case "Draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="bg-gray-100 min-h-screen p-4">Loading invoices...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <div className="flex items-center text-gray-600">
          <span>Dashboard</span>
          <FaChevronRight className="mx-1 text-xs" />
          <span>Invoices</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Invoices</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileInvoiceDollar className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unpaid</p>
              <p className="text-2xl font-bold">{stats.unpaid}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaFileInvoiceDollar className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-2xl font-bold">{stats.overdue}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimesCircle className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Partially Paid Invoices */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Partially Paid</p>
              <p className="text-2xl font-bold">{stats.partiallypaid}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          {/* Batch Payment Button */}
          {getPayableInvoices().length > 0 && (
            <button 
              onClick={() => {
                setShowBatchPayment(true);
                setBatchPaymentError("");
                setPaymentAmounts({});
              }}
              className="px-3 py-1 text-sm rounded flex items-center gap-2 bg-blue-600 text-white"
            >
              <FaMoneyCheckAlt /> Batch Payment
            </button>
          )}
        </div>
      </div>

      {/* White box for table */}
      <div className="bg-white shadow-md rounded-lg p-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Partiallypaid">Partially Paid</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Entries per page */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            {/* Refresh button */}
            <button
              className="border px-2.5 py-1.5 rounded text-sm flex items-center"
              onClick={fetchClientInvoices}
            >
              <FaSyncAlt />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-2 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded pl-8 pr-3 py-1 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left">
                <th className="p-3 rounded-l-lg" style={{ backgroundColor: '#333333', color: 'white' }}>
                  Invoice #
                </th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Date</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Due Date</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Amount</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Paid</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Balance</th>
                <th className="p-3" style={{ backgroundColor: '#333333', color: 'white' }}>Status</th>
                <th className="p-3 rounded-r-lg" style={{ backgroundColor: '#333333', color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((invoice) => {
                  const paidAmount = invoice.paidAmount || 0;
                  const balanceDue = invoice.total - paidAmount;
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                  
                  return (
                    <tr
                      key={invoice._id}
                      className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                      style={{ color: 'black' }}
                    >
                      <td className="p-3 rounded-l-lg border-0 font-medium">
                        {invoice.invoiceNumber || "INV-" + invoice._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3 border-0">{formatDate(invoice.invoiceDate)}</td>
                      <td className="p-3 border-0">
                        <div className="flex flex-col">
                          <span>{formatDate(invoice.dueDate)}</span>
                          {daysUntilDue !== null && (
                            <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-0">{formatCurrency(invoice.total, invoice.currency)}</td>
                      <td className="p-3 border-0">{formatCurrency(paidAmount, invoice.currency)}</td>
                      <td className="p-3 border-0">{formatCurrency(balanceDue, invoice.currency)}</td>
                      <td className="p-3 border-0">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-3 border-0 rounded-r-lg">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Invoice"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              return pageNum <= totalPages ? (
                <button
                  key={pageNum}
                  className={`border px-3 py-1 rounded text-sm ${
                    currentPage === pageNum ? "bg-gray-800 text-white" : ""
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ) : null;
            })}
            <button
              className="border px-3 py-1 rounded text-sm disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Invoice Modal */}
      {viewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <button
                onClick={() => setViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedInvoice.invoiceNumber || "INV-" + selectedInvoice._id.slice(-6).toUpperCase()}</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {formatDate(selectedInvoice.invoiceDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}
                  </p>
                  {selectedInvoice.tags && (
                    <p className="text-sm text-gray-600">
                      <strong>Tags:</strong> {selectedInvoice.tags}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Paid: {formatCurrency(selectedInvoice.paidAmount || 0, selectedInvoice.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Balance: {formatCurrency(selectedInvoice.total - (selectedInvoice.paidAmount || 0), selectedInvoice.currency)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Items</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Tax 1</th>
                      <th className="p-2 text-right">Tax 2</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.rate, selectedInvoice.currency)}</td>
                        <td className="p-2 text-right">{item.tax1}%</td>
                        <td className="p-2 text-right">{item.tax2}%</td>
                        <td className="p-2 text-right">{formatCurrency(item.amount, selectedInvoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" className="p-2 text-right font-semibold">Subtotal:</td>
                      <td className="p-2 text-right">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</td>
                    </tr>
                    {selectedInvoice.discount > 0 && (
                      <tr>
                        <td colSpan="5" className="p-2 text-right font-semibold">
                          Discount ({selectedInvoice.discountType === 'percent' ? `${selectedInvoice.discountValue}%` : 'Fixed'}):
                        </td>
                        <td className="p-2 text-right">-{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="p-2 text-right font-bold">Total:</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Payment Modal */}
      {showBatchPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-11/12 max-w-5xl max-h-screen overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Batch Payment</h2>
              <button onClick={() => setShowBatchPayment(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            {batchPaymentError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
                {batchPaymentError}
              </div>
            )}
            
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={batchPaymentData.paymentDate}
                  onChange={(e) => setBatchPaymentData({...batchPaymentData, paymentDate: e.target.value})}
                  className="border rounded w-full p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                <select
                  value={batchPaymentData.paymentMode}
                  onChange={(e) => setBatchPaymentData({...batchPaymentData, paymentMode: e.target.value})}
                  className="border rounded w-full p-2"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Stripe Checkout">Stripe Checkout</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={batchPaymentData.transactionId}
                  onChange={(e) => setBatchPaymentData({...batchPaymentData, transactionId: e.target.value})}
                  className="border rounded w-full p-2"
                  placeholder="Transaction reference"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={batchPaymentData.notes}
                onChange={(e) => setBatchPaymentData({...batchPaymentData, notes: e.target.value})}
                className="border rounded w-full p-2"
                rows="3"
                placeholder="Additional payment notes"
              />
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Invoices for Payment</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Invoice #</th>
                      <th className="p-2 border">Customer</th>
                      <th className="p-2 border">Total Amount</th>
                      <th className="p-2 border">Paid Amount</th>
                      <th className="p-2 border">Balance Due</th>
                      <th className="p-2 border">Payment Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPayableInvoices().map((invoice) => {
                      const paidAmount = invoice.paidAmount || 0;
                      const balanceDue = invoice.total - paidAmount;
                      
                      return (
                        <tr key={invoice._id}>
                          <td className="p-2 border">{invoice.invoiceNumber || "INV-" + invoice._id.slice(-6).toUpperCase()}</td>
                          <td className="p-2 border">{invoice.customer}</td>
                          <td className="p-2 border text-right">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(paidAmount, invoice.currency)}
                          </td>
                          <td className="p-2 border text-right">
                            {formatCurrency(balanceDue, invoice.currency)}
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              min="0"
                              max={balanceDue}
                              step="0.01"
                              value={paymentAmounts[invoice._id] || ""}
                              onChange={(e) => handlePaymentAmountChange(invoice._id, e.target.value)}
                              className="border rounded p-1 w-full"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowBatchPayment(false)} 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={processBatchPayments}
                disabled={batchPaymentLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {batchPaymentLoading ? "Processing..." : "Process Payments"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;