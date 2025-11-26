/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaFileInvoiceDollar,
  FaMoneyBill,
  FaFileAlt,
  FaFileInvoice,
  FaUsers,
  FaChartBar,
  FaFileDownload,
  FaSyncAlt,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { HiOutlineDownload } from "react-icons/hi";
import axios from "axios";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const SalesReports = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [activeReport, setActiveReport] = useState(null);
  const [activeChart, setActiveChart] = useState(null);
  const [invoicesData, setInvoicesData] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [creditNotesData, setCreditNotesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editCreditNote, setEditCreditNote] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [formData, setFormData] = useState({
    customer: "",
    status: "Draft",
  });
  const [proposalsData, setProposalsData] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [estimatesData, setEstimatesData] = useState([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [selectedEstimates, setSelectedEstimates] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [customerGroupsData, setCustomerGroupsData] = useState([]);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("crm_token");
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  useEffect(() => {
    if (activeChart === "totalIncome") {
      fetchIncomeData();
    } else if (activeChart === "paymentModes") {
      fetchPaymentModesData();
    } else if (activeChart === "customerValue") {
      fetchCustomerGroupsData();
    }
  }, [activeChart]);

  useEffect(() => {
    if (activeReport === "invoices") {
      fetchInvoices();
    } else if (activeReport === "items") {
      fetchItems();
    } else if (activeReport === "payments") {
      fetchPayments();
    } else if (activeReport === "creditNotes") {
      fetchCreditNotes();
    } else if (activeReport === "proposals") {
      fetchProposals();
    } else if (activeReport === "estimates") {
      fetchEstimates();
    } else if (activeReport === "customers") {
      fetchCustomers();
    }
  }, [activeReport]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const config = createAxiosConfig();
      const response = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );

      // Handle both response formats
      const data = response.data.data || response.data || [];
      setInvoicesData(data);

      // Calculate stats
      const total = data.length || 0;
      const paid = data.filter((i) => i.status === "Paid").length;
      const unpaid = data.filter((i) => i.status === "Unpaid").length;
      const overdue = data.filter((i) => i.status === "Overdue").length;
      const draft = data.filter((i) => i.status === "Draft").length;
      const partiallypaid = data.filter(
        (i) => i.status === "Partiallypaid"
      ).length;

      setStats((prev) => ({
        ...prev,
        totalInvoices: total,
        paidInvoices: paid,
        unpaidInvoices: unpaid,
        overdueInvoices: overdue,
        draftInvoices: draft,
        partiallypaidInvoices: partiallypaid,
      }));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/admin/items`, config);
      setItemsData(data);
      setItemsLoading(false);
    } catch (err) {
      console.error("Error fetching items", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setItemsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const config = createAxiosConfig();
      const response = await axios.get(
        `${API_BASE_URL}/admin/payments`,
        config
      );

      if (response.data.success) {
        // Use actual payment data from the payments API
        const paymentRecords = response.data.data.map((payment) => ({
          paymentId: payment.paymentNumber,

          invoiceNumber: payment.invoiceNumber,
          customer: payment.customer,
          amount: payment.amount,
          paidAmount: payment.amount, // For payments, amount is the paid amount
          paymentMode: payment.paymentMode,
          transactionId: payment.transactionId,
          paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
          status: payment.status,
          currency: payment.currency || "USD",
          isFullPayment: true, // Payments are always full payments
          notes: payment.notes || "",
        }));

        setPaymentsData(paymentRecords);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchCreditNotes = async () => {
    setCreditNotesLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/credit-notes`,
        config
      );
      const creditNotes = data.data || data;
      setCreditNotesData(creditNotes);

      // Calculate stats
      const total = creditNotes.length || 0;
      const draft = creditNotes.filter(
        (note) => note.status === "Draft"
      ).length;
      const issued = creditNotes.filter(
        (note) => note.status === "Issued"
      ).length;
      const cancelled = creditNotes.filter(
        (note) => note.status === "Cancelled"
      ).length;
      const pending = creditNotes.filter(
        (note) => note.status === "Pending"
      ).length;

      setStats((prev) => ({
        ...prev,
        totalCreditNotes: total,
        draftCreditNotes: draft,
        issuedCreditNotes: issued,
        cancelledCreditNotes: cancelled,
        pendingCreditNotes: pending,
      }));
    } catch (err) {
      console.error("Error fetching credit notes", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
    setCreditNotesLoading(false);
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/proposals`,
        config
      );
      setProposalsData(data.data || data);
    } catch (err) {
      console.error("Error fetching proposals", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
    setProposalsLoading(false);
  };

  const fetchEstimates = async () => {
    setEstimatesLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/admin/estimates`,
        config
      );
      setEstimatesData(data.data || data);
    } catch (err) {
      console.error("Error fetching estimates", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    }
    setEstimatesLoading(false);
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/customers`, config);
      setCustomersData(data.customers || []);
    } catch (err) {
      console.error("Error fetching customers", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
      setCustomersData([]);
    }
    setCustomersLoading(false);
  };

  const fetchPaymentModesData = async () => {
    setIncomeLoading(true);
    try {
      const config = createAxiosConfig();
      // Fetch invoices data to process payment modes
      const response = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );

      if (response.data.success) {
        const invoices = response.data.data || response.data || [];

        // Filter paid and partially paid invoices
        const paymentInvoices = invoices.filter(
          (invoice) =>
            invoice.status === "Paid" || invoice.status === "Partiallypaid"
        );

        // Count payment modes
        const paymentModesCount = {
          Bank: 0,
          "Stripe Checkout": 0,
        };

        paymentInvoices.forEach((invoice) => {
          const paymentMode = invoice.paymentMode || "Unknown";

          // Normalize payment mode names
          if (paymentMode.toLowerCase().includes("bank")) {
            paymentModesCount["Bank"] += 1;
          } else if (
            paymentMode.toLowerCase().includes("stripe") ||
            paymentMode.toLowerCase().includes("checkout")
          ) {
            paymentModesCount["Stripe Checkout"] += 1;
          } else {
            // For any other payment mode, categorize appropriately
            if (paymentMode !== "Unknown") {
              paymentModesCount["Bank"] += 1; // Default to Bank for other modes
            }
          }
        });

        // Convert to array format for the chart
        const chartData = Object.keys(paymentModesCount).map((mode) => ({
          name: mode,
          count: paymentModesCount[mode],
          amount: 0, // We'll calculate amounts if needed
        }));

        // If you also want to calculate amounts by payment mode
        paymentInvoices.forEach((invoice) => {
          const paymentMode = invoice.paymentMode || "Unknown";
          const amount =
            invoice.status === "Partiallypaid"
              ? invoice.paidAmount || 0
              : invoice.total || 0;

          // Normalize payment mode names
          if (paymentMode.toLowerCase().includes("bank")) {
            const bankItem = chartData.find((item) => item.name === "Bank");
            if (bankItem) bankItem.amount += amount;
          } else if (
            paymentMode.toLowerCase().includes("stripe") ||
            paymentMode.toLowerCase().includes("checkout")
          ) {
            const stripeItem = chartData.find(
              (item) => item.name === "Stripe Checkout"
            );
            if (stripeItem) stripeItem.amount += amount;
          } else {
            // For any other payment mode
            if (paymentMode !== "Unknown") {
              const bankItem = chartData.find((item) => item.name === "Bank");
              if (bankItem) bankItem.amount += amount;
            }
          }
        });

        setIncomeData(chartData);
      }
    } catch (error) {
      console.error("Error fetching payment modes data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setIncomeLoading(false);
    }
  };

  // Add this function to fetch and process income data
  const fetchIncomeData = async () => {
    setIncomeLoading(true);
    try {
      const config = createAxiosConfig();
      // Fetch invoices data to process payments
      const response = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );

      if (response.data.success) {
        const invoices = response.data.data || response.data || [];

        // Filter paid and partially paid invoices
        const paymentInvoices = invoices.filter(
          (invoice) =>
            invoice.status === "Paid" || invoice.status === "Partiallypaid"
        );

        // Group payments by month
        const monthlyData = {};

        paymentInvoices.forEach((invoice) => {
          const paymentDate = new Date(
            invoice.updatedAt || invoice.invoiceDate
          );
          const monthYear = `${paymentDate.toLocaleString("default", {
            month: "long",
          })} - ${paymentDate.getFullYear()}`;

          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
          }

          // Use paidAmount if available, otherwise use total for paid invoices
          const amount =
            invoice.status === "Partiallypaid"
              ? invoice.paidAmount || 0
              : invoice.total || 0;

          monthlyData[monthYear] += amount;
        });

        // Convert to array format for the chart
        const chartData = Object.keys(monthlyData).map((month) => ({
          name: month,
          income: monthlyData[month],
        }));

        // Sort by date (you might want to implement proper date sorting)
        chartData.sort((a, b) => {
          const [aMonth, aYear] = a.name.split(" - ");
          const [bMonth, bYear] = b.name.split(" - ");
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
          }

          return months.indexOf(aMonth) - months.indexOf(bMonth);
        });

        setIncomeData(chartData);
      }
    } catch (error) {
      console.error("Error fetching income data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setIncomeLoading(false);
    }
  };

  const fetchCustomerGroupsData = async () => {
    setIncomeLoading(true);
    try {
      const config = createAxiosConfig();
      // Fetch customers data
      const customersResponse = await axios.get(
        `${API_BASE_URL}/customers`,
        config
      );
      const customers = customersResponse.data.customers || [];

      // Fetch invoices data to get payment information
      const invoicesResponse = await axios.get(
        `${API_BASE_URL}/admin/invoices`,
        config
      );
      const invoices =
        invoicesResponse.data.data || invoicesResponse.data || [];

      // Filter paid and partially paid invoices
      const paymentInvoices = invoices.filter(
        (invoice) =>
          invoice.status === "Paid" || invoice.status === "Partiallypaid"
      );

      // Create a mapping of customer names to their groups
      const customerToGroupsMap = {};
      customers.forEach((customer) => {
        if (customer.company && customer.groups && customer.groups.length > 0) {
          customerToGroupsMap[customer.company] = customer.groups;
        }
      });

      // Group payments by customer group
      const groupPayments = {};

      paymentInvoices.forEach((invoice) => {
        const customerName = invoice.customer;
        const customerGroups = customerToGroupsMap[customerName] || [
          "Ungrouped",
        ];

        // Use paidAmount if available, otherwise use total for paid invoices
        const amount =
          invoice.status === "Partiallypaid"
            ? invoice.paidAmount || 0
            : invoice.total || 0;

        // Add amount to each group this customer belongs to
        customerGroups.forEach((group) => {
          if (!groupPayments[group]) {
            groupPayments[group] = 0;
          }
          groupPayments[group] += amount;
        });
      });

      // Filter out "Ungrouped" category as requested
      delete groupPayments["Ungrouped"];

      // Convert to array format for the chart, sorted by amount (descending)
      const chartData = Object.keys(groupPayments)
        .map((group) => ({
          name: group,
          value: groupPayments[group],
          count: 0, // We'll calculate customer count per group
        }))
        .sort((a, b) => b.value - a.value);

      // Calculate customer count per group
      const groupCustomerCount = {};
      customers.forEach((customer) => {
        if (customer.groups && customer.groups.length > 0) {
          customer.groups.forEach((group) => {
            if (group !== "Ungrouped") {
              if (!groupCustomerCount[group]) {
                groupCustomerCount[group] = 0;
              }
              groupCustomerCount[group] += 1;
            }
          });
        }
      });

      // Add customer count to chart data
      chartData.forEach((item) => {
        item.count = groupCustomerCount[item.name] || 0;
      });

      setCustomerGroupsData(chartData);
    } catch (error) {
      console.error("Error fetching customer groups data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("crm_token");
        navigate("/login");
      }
    } finally {
      setIncomeLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Unpaid":
        return "bg-blue-100 text-blue-800";
      case "Partiallypaid":
        return "bg-yellow-100 text-yellow-800";
      case "Issued":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Export handler
  const handleExport = (type) => {
    let exportData = [];
    let fileName = "";

    if (activeReport === "invoices") {
      if (!invoicesData.length) return;

      exportData = invoicesData.map((i) => ({
        InvoiceNumber:
          i.invoiceNumber || "INV-" + i._id.slice(-6).toUpperCase(),
        Customer: i.customer,
        Amount: i.total,
        TotalTax: i.items
          ? i.items.reduce(
              (sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0),
              0
            )
          : 0,
        Project: i.reference || "-",
        Tags: i.tags || "-",
        Date: i.invoiceDate
          ? new Date(i.invoiceDate).toLocaleDateString()
          : "-",
        DueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "-",
        Reference: i.reference || "-",
        Status: i.status,
      }));

      fileName = "invoices";
    } else if (activeReport === "items") {
      if (!itemsData.length) return;

      exportData = itemsData.map((item) => ({
        Description: item.description || "-",
        LongDescription: item.longDescription || "-",
        Rate: item.rate || 0,
        Tax1: item.tax1 || 0,
        Tax2: item.tax2 || 0,
        Unit: item.unit || "-",
        GroupName: item.groupName || "-",
      }));

      fileName = "items";
    } else if (activeReport === "payments") {
      if (!paymentsData.length) return;

      exportData = paymentsData.map((payment) => ({
        "Payment #": payment.paymentId,
        "Invoice #": payment.invoiceNumber,
        "Payment Mode": payment.paymentMode,
        "Transaction ID": payment.transactionId,
        Customer: payment.customer,
        Amount: payment.amount,
        "Payment Date": payment.paymentDate,
        Status: payment.status,
      }));

      fileName = "payments";
    } else if (activeReport === "creditNotes") {
      if (!creditNotesData.length) return;

      exportData = creditNotesData.map((note) => ({
        "Credit Note #":
          note.creditNoteNumber || "CN-" + note._id.slice(-6).toUpperCase(),
        Customer: note.customer || "-",
        Project: note.project || "-",
        Reference: note.reference || "-",
        Amount: note.total || 0,
        Date: note.creditNoteDate
          ? new Date(note.creditNoteDate).toLocaleDateString()
          : "-",
        Status: note.status || "Draft",
      }));

      fileName = "credit_notes";
    } else if (activeReport === "customers") {
      if (!customersData.length) return;

      exportData = customersData.map((customer) => ({
        Company: customer.company || "-",
        "Primary Contact": customer.contact || "-",
        "Primary Email": customer.email || "-",
        Phone: customer.phone || "-",
        "Active Customer": customer.active ? "Active" : "Inactive",
        "Active Contacts": customer.contactsActive ? "Active" : "Inactive",
        Groups: customer.groups ? customer.groups.join(", ") : "-",
        "Date Created": customer.dateCreated
          ? new Date(customer.dateCreated).toLocaleDateString()
          : "-",
      }));

      fileName = "customers";
    } else if (activeReport === "estimates") {
      if (!estimatesData.length) return;

      exportData = estimatesData.map((estimate) => ({
        "Estimate #":
          estimate.estimateNumber ||
          "EST-" + estimate._id.slice(-6).toUpperCase(),
        Customer: estimate.customer || "-",
        Amount: estimate.total || 0,
        "Total Tax": estimate.items
          ? estimate.items.reduce(
              (sum, item) => sum + (item.tax1 || 0) + (item.tax2 || 0),
              0
            )
          : 0,
        Project: estimate.reference || "-",
        Tags: estimate.tags || "-",
        Date: estimate.estimateDate
          ? new Date(estimate.estimateDate).toLocaleDateString()
          : "-",
        "Expiry Date": estimate.expiryDate
          ? new Date(estimate.expiryDate).toLocaleDateString()
          : "-",
        Status: estimate.status || "Draft",
      }));

      fileName = "estimates";
    } else if (activeReport === "proposals") {
      if (!proposalsData.length) return;

      exportData = proposalsData.map((proposal) => ({
        "Proposal #":
          proposal.proposalNumber ||
          "PRO-" + proposal._id.slice(-6).toUpperCase(),
        Client: proposal.clientName || "-",
        Title: proposal.title || "-",
        Amount: proposal.total || 0,
        Date: proposal.date
          ? new Date(proposal.date).toLocaleDateString()
          : "-",
        "Open Till": proposal.openTill
          ? new Date(proposal.openTill).toLocaleDateString()
          : "-",
        Tags: proposal.tags || "-",
        Status: proposal.status || "Draft",
      }));

      fileName = "proposals";
    }
    exportDataToFile(exportData, type, fileName);
    setShowExportMenu(false);
  };

  const exportDataToFile = (exportData, type, fileName) => {
    switch (type) {
      case "CSV": {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData
          .map((row) =>
            Object.values(row)
              .map((val) => `"${val}"`)
              .join(",")
          )
          .join("\n");
        const csvContent = headers + "\n" + rows;
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case "Excel": {
        const worksheet = XLSXUtils.json_to_sheet(exportData);
        const workbook = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(workbook, worksheet, fileName);
        XLSXWriteFile(workbook, `${fileName}.xlsx`);
        break;
      }

      case "PDF": {
        const doc = new jsPDF();
        const columns = Object.keys(exportData[0]);
        const tableRows = exportData.map((row) =>
          columns.map((col) => row[col])
        );
        autoTable(doc, { head: [columns], body: tableRows });
        doc.save(`${fileName}.pdf`);
        break;
      }

      case "Print": {
        const printWindow = window.open("", "", "height=500,width=800");
        printWindow.document.write(
          `<html><head><title>${fileName}</title></head><body>`
        );
        printWindow.document.write(
          `<h1>${
            fileName.charAt(0).toUpperCase() + fileName.slice(1)
          } Report</h1>`
        );
        printWindow.document.write(
          "<table border='1' style='border-collapse: collapse; width: 100%;'>"
        );
        printWindow.document.write("<thead><tr>");
        Object.keys(exportData[0]).forEach((col) => {
          printWindow.document.write(`<th>${col}</th>`);
        });
        printWindow.document.write("</tr></thead><tbody>");
        exportData.forEach((row) => {
          printWindow.document.write("<tr>");
          Object.values(row).forEach((val) => {
            printWindow.document.write(`<td>${val}</td>`);
          });
          printWindow.document.write("</tr>");
        });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
        break;
      }

      default:
        console.log("Unknown export type:", type);
    }
  };

  // Filter data based on active report
  const getFilteredData = () => {
    if (activeReport === "invoices") {
      return invoicesData.filter(
        (invoice) =>
          invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.invoiceNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "items") {
      return itemsData.filter(
        (item) =>
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.longDescription
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "payments") {
      return paymentsData.filter(
        (payment) =>
          payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.invoiceNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transactionId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "creditNotes") {
      return creditNotesData.filter(
        (note) =>
          note.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.creditNoteNumber || "CN-" + note._id.slice(-6).toUpperCase())
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          note.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.project?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "customers") {
      return customersData.filter(
        (customer) =>
          customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "estimates") {
      return estimatesData.filter(
        (estimate) =>
          estimate.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (
            estimate.estimateNumber ||
            "EST-" + estimate._id.slice(-6).toUpperCase()
          )
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          estimate.reference
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          estimate.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (activeReport === "proposals") {
      return proposalsData.filter(
        (proposal) =>
          proposal.clientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (
            proposal.proposalNumber ||
            "TEMP-" + proposal._id.slice(-6).toUpperCase()
          )
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    return [];
  };

  // Pagination
  const filteredData = getFilteredData();
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  // Handle checkbox selection for items
  const handleCheckboxChange = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(itemsData.map((item) => item._id));
    }
    setSelectAll(!selectAll);
  };

  // Handle checkbox selection for credit notes
  const toggleCreditNoteSelection = (id) => {
    if (selectedCreditNotes.includes(id)) {
      setSelectedCreditNotes(
        selectedCreditNotes.filter((noteId) => noteId !== id)
      );
    } else {
      setSelectedCreditNotes([...selectedCreditNotes, id]);
    }
  };

  const toggleProposalSelection = (id) => {
    if (selectedProposals.includes(id)) {
      setSelectedProposals(
        selectedProposals.filter((proposalId) => proposalId !== id)
      );
    } else {
      setSelectedProposals([...selectedProposals, id]);
    }
  };
  const toggleEstimateSelection = (id) => {
    if (selectedEstimates.includes(id)) {
      setSelectedEstimates(
        selectedEstimates.filter((estimateId) => estimateId !== id)
      );
    } else {
      setSelectedEstimates([...selectedEstimates, id]);
    }
  };

  const toggleCustomerSelection = (id) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(
        selectedCustomers.filter((customerId) => customerId !== id)
      );
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  // Render table controls (search, export, pagination, etc.)
  const renderTableControls = () => (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={entriesPerPage}
          onChange={(e) => {
            setEntriesPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="border px-2 py-1 rounded text-sm flex items-center gap-1"
          >
            <HiOutlineDownload /> Export
          </button>
          {showExportMenu && (
            <div className="absolute mt-1 w-32 bg-white border rounded shadow-md z-10">
              {["Excel", "CSV", "PDF", "Print"].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => handleExport(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          className="border px-2 py-1 rounded text-sm flex items-center"
          onClick={() => {
            if (activeReport === "invoices") fetchInvoices();
            else if (activeReport === "items") fetchItems();
            else if (activeReport === "payments") fetchPayments();
            else if (activeReport === "creditNotes") fetchCreditNotes();
            else if (activeReport === "proposals") fetchProposals();
          }}
        >
          <FaSyncAlt />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder={`Search ${activeReport}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border rounded pl-2 pr-3 py-1 text-sm"
          />
          <button
            onClick={() => {
              setSearchTerm(searchInput);
              setCurrentPage(1);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="flex justify-between items-center mt-4 text-sm">
      <span>
        Showing {indexOfFirstItem + 1} to{" "}
        {Math.min(indexOfLastItem, filteredData.length)} of{" "}
        {filteredData.length} entries
      </span>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1 ? "bg-gray-200" : ""
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderChartContent = () => {
    switch (activeChart) {
      case "totalIncome":
        return (
          <div className="p-6 bg-white rounded border">
            <h3 className="text-lg font-semibold mb-4">Total Income Report</h3>

            {incomeLoading ? (
              <div className="text-center py-8">Loading income data...</div>
            ) : incomeData.length > 0 ? (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Monthly Income</h4>
                    <p className="text-sm text-gray-500">
                      Total payments received by month
                    </p>
                  </div>
                  <button
                    onClick={fetchIncomeData}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                  >
                    <FaSyncAlt className="text-xs" /> Refresh
                  </button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={incomeData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toLocaleString()}`,
                          "Income",
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="#4f46e5"
                        name="Income"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800">Total Income</h5>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(
                        incomeData.reduce((sum, item) => sum + item.income, 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800">
                      Average Monthly Income
                    </h5>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(
                        incomeData.reduce((sum, item) => sum + item.income, 0) /
                          (incomeData.length || 1)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No income data available
              </div>
            )}
          </div>
        );

      case "paymentModes":
        return (
          <div className="p-6 bg-white rounded border">
            <h3 className="text-lg font-semibold mb-4">Payment Modes Report</h3>

            {incomeLoading ? (
              <div className="text-center py-8">
                Loading payment modes data...
              </div>
            ) : incomeData.length > 0 ? (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">
                      Payment Methods Distribution
                    </h4>
                    <p className="text-sm text-gray-500">
                      Payments by method type
                    </p>
                  </div>
                  <button
                    onClick={fetchPaymentModesData}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                  >
                    <FaSyncAlt className="text-xs" /> Refresh
                  </button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={incomeData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "Number of Payments") {
                            return [value, "Times Used"];
                          } else {
                            return [
                              `$${value.toLocaleString()}`,
                              "Total Amount",
                            ];
                          }
                        }}
                        labelFormatter={(label) => `Payment Method: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#4f46e5"
                        name="Number of Payments"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#10b981"
                        name="Total Amount"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800">
                      Total Payments
                    </h5>
                    <p className="text-2xl font-bold text-blue-900">
                      {incomeData.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800">Total Amount</h5>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(
                        incomeData.reduce((sum, item) => sum + item.amount, 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium mb-3">
                    Payment Methods Breakdown
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomeData.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.name}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.name === "Bank"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {(
                              (item.count /
                                incomeData.reduce(
                                  (sum, i) => sum + i.count,
                                  0
                                )) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">
                              Times Used:
                            </span>
                            <p className="font-semibold">{item.count}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">
                              Amount:
                            </span>
                            <p className="font-semibold">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payment data available
              </div>
            )}
          </div>
        );

      case "customerValue":
        return (
          <div className="p-6 bg-white rounded border">
            <h3 className="text-lg font-semibold mb-4">
              Total Value by Customer Group
            </h3>

            {incomeLoading ? (
              <div className="text-center py-8">
                Loading customer groups data...
              </div>
            ) : customerGroupsData.length > 0 ? (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Revenue by Customer Group</h4>
                    <p className="text-sm text-gray-500">
                      Total payments received by customer group
                    </p>
                  </div>
                  <button
                    onClick={fetchCustomerGroupsData}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
                  >
                    <FaSyncAlt className="text-xs" /> Refresh
                  </button>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={customerGroupsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toLocaleString()}`,
                          "Total Revenue",
                        ]}
                        labelFormatter={(label) => `Customer Group: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#4f46e5"
                        name="Total Revenue"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800">Total Revenue</h5>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(
                        customerGroupsData.reduce(
                          (sum, item) => sum + item.value,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800">
                      Average per Group
                    </h5>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(
                        customerGroupsData.reduce(
                          (sum, item) => sum + item.value,
                          0
                        ) / (customerGroupsData.length || 1)
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium mb-3">
                    Customer Groups Breakdown
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customerGroupsData.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            {(
                              (item.value /
                                customerGroupsData.reduce(
                                  (sum, i) => sum + i.value,
                                  0
                                )) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm text-gray-500">
                              Revenue:
                            </span>
                            <p className="font-semibold">
                              {formatCurrency(item.value)}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">
                              Customers:
                            </span>
                            <p className="font-semibold">{item.count}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No customer group data available or all customers are ungrouped
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6 bg-white rounded border text-gray-500 text-center">
            Select a chart type to view its report
          </div>
        );
    }
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case "invoices":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Invoices Report</h2>
            </div>

            {renderTableControls()}

            {/*INVOICE Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Invoice#
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Total Tax
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Project
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Tags
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Due Date
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Reference
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((invoice) => {
                      const displayInvoiceNumber =
                        invoice.invoiceNumber ||
                        "INV-" + invoice._id.slice(-6).toUpperCase();

                      const displayAmount = formatCurrency(
                        invoice.total,
                        invoice.currency
                      );

                      const totalTax = invoice.items
                        ? invoice.items.reduce(
                            (sum, item) =>
                              sum + (item.tax1 || 0) + (item.tax2 || 0),
                            0
                          )
                        : 0;

                      const formatDate = (dateString) => {
                        if (!dateString) return "-";
                        const date = new Date(dateString);
                        return isNaN(date.getTime())
                          ? "-"
                          : date.toLocaleDateString();
                      };

                      return (
                        <tr
                          key={invoice._id}
                          className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                          style={{ color: "black" }}
                        >
                          <td className="p-3 border-0 ">
                            {displayInvoiceNumber}
                          </td>
                          <td className="p-3 border-0 ">{displayAmount}</td>
                          {compactView ? (
                            <>
                              <td className="p-3 border-0">
                                {invoice.customer || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(invoice.invoiceDate)}
                              </td>
                              <td className="p-3 border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    invoice.status
                                  )}`}
                                >
                                  {invoice.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border-0 ">
                                {formatCurrency(totalTax, invoice.currency)}
                              </td>
                              <td className="p-3 border-0">
                                {invoice.customer || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {invoice.reference || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {invoice.tags || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(invoice.invoiceDate)}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="p-3 border-0">
                                {invoice.reference || "-"}
                              </td>
                              <td className="p-3 rounded-r-lg border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    invoice.status
                                  )}`}
                                >
                                  {invoice.status || "Draft"}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 5 : 11}
                        className="p-4 text-center text-gray-500"
                      >
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      case "items":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Items Report</h2>
            </div>

            {renderTableControls()}

            {/* Items Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Description
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Long Description
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Rate
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Tax1
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Tax2
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Unit
                    </th>
                    <th
                      className="p-3 rounded-r-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Group Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr
                        key={item._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                        style={{ color: "black" }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleCheckboxChange(item._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0">{item.description}</td>
                        <td className="p-3 border-0">{item.longDescription}</td>
                        <td className="p-3 border-0">{item.rate}</td>
                        <td className="p-3 border-0">{item.tax1}</td>
                        <td className="p-3 border-0">{item.tax2}</td>
                        <td className="p-3 border-0">{item.unit}</td>
                        <td className="p-3 rounded-r-lg border-0">
                          {item.groupName}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      case "payments":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Payments Received</h2>
            </div>

            {renderTableControls()}

            {/* Payments Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Payment #
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Invoice #
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Payment Mode
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Transaction ID
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Payment Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-gray-500">
                        Loading payments...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((payment) => (
                      <tr
                        key={payment.paymentId}
                        className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                        style={{ color: "black" }}
                      >
                        <td className="p-3 rounded-l-lg border-0 font-mono">
                          {payment.paymentId}
                        </td>
                        <td className="p-3 border-0 font-mono">
                          {payment.invoiceNumber}
                        </td>
                        <td className="p-3 border-0">{payment.paymentMode}</td>
                        <td className="p-3 border-0">
                          {payment.transactionId}
                        </td>
                        <td className="p-3 border-0">{payment.customer}</td>
                        <td className="p-3 border-0 ">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="p-3 border-0">{payment.paymentDate}</td>
                        <td className="p-3 border-0">
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-gray-500 bg-white shadow rounded-lg"
                      >
                        {paymentsData.length === 0
                          ? "No payment records found"
                          : "No payments match your search criteria"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      case "creditNotes":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Credit Notes Report</h2>
            </div>

            {renderTableControls()}

            {/* Credit Notes Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedCreditNotes.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCreditNotes(
                              currentData.map((c) => c._id)
                            );
                          } else {
                            setSelectedCreditNotes([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Credit Note#
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
                    </th>

                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Project
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Reference
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Amount
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Date
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotesLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="p-4 text-center text-gray-500"
                      >
                        Loading credit notes...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((note) => {
                      const displayNoteNumber =
                        note.creditNoteNumber ||
                        "CN-" + note._id.slice(-6).toUpperCase();
                      const formatDate = (dateString) => {
                        if (!dateString) return "-";
                        const date = new Date(dateString);
                        return isNaN(date.getTime())
                          ? "-"
                          : date.toLocaleDateString();
                      };

                      return (
                        <tr
                          key={note._id}
                          className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                          style={{ color: "black" }}
                        >
                          <td className="p-3 rounded-l-lg border-0">
                            <input
                              type="checkbox"
                              checked={selectedCreditNotes.includes(note._id)}
                              onChange={() =>
                                toggleCreditNoteSelection(note._id)
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="p-3 border-0 ">{displayNoteNumber}</td>
                          <td className="p-3 border-0">
                            {note.customer || "-"}
                          </td>

                          {compactView ? (
                            <>
                              <td className="p-3 border-0 text-right">
                                {formatCurrency(note.total, note.currency)}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(note.creditNoteDate)}
                              </td>
                              <td className="p-3 border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    note.status
                                  )}`}
                                >
                                  {note.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border-0">
                                {note.project || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {note.reference || "-"}
                              </td>
                              <td className="p-3 border-0 ">
                                {formatCurrency(note.total, note.currency)}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(note.creditNoteDate)}
                              </td>
                              <td className="p-3 border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    note.status
                                  )}`}
                                >
                                  {note.status || "Draft"}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="p-4 text-center text-gray-500"
                      >
                        No credit notes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );

      case "proposals":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Proposals Report</h2>
            </div>

            {renderTableControls()}

            {/* Proposals Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedProposals.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProposals(currentData.map((p) => p._id));
                          } else {
                            setSelectedProposals([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Proposal#
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Client
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Title
                    </th>

                    <>
                      <th
                        className="p-3"
                        style={{ backgroundColor: "#333333", color: "white" }}
                      >
                        Amount
                      </th>
                      <th
                        className="p-3"
                        style={{ backgroundColor: "#333333", color: "white" }}
                      >
                        Date
                      </th>
                      <th
                        className="p-3"
                        style={{ backgroundColor: "#333333", color: "white" }}
                      >
                        Open Till
                      </th>
                      <th
                        className="p-3"
                        style={{ backgroundColor: "#333333", color: "white" }}
                      >
                        Tags
                      </th>
                      <th
                        className="p-3"
                        style={{ backgroundColor: "#333333", color: "white" }}
                      >
                        Status
                      </th>
                    </>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="p-4 text-center text-gray-500"
                      >
                        Loading proposals...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((proposal) => {
                      const formatProposalNumber = (num) => {
                        if (!num)
                          return "TEMP-" + proposal._id.slice(-6).toUpperCase();
                        if (num.startsWith("PRO-")) return num;
                        const matches = num.match(/\d+/);
                        const numberPart = matches ? matches[0] : "000001";
                        return `PRO-${String(numberPart).padStart(6, "0")}`;
                      };

                      const displayProposalNumber = formatProposalNumber(
                        proposal.proposalNumber
                      );

                      const displayAmount = formatCurrency(
                        proposal.total,
                        proposal.currency
                      );

                      const formatDate = (dateString) => {
                        if (!dateString) return "-";
                        const date = new Date(dateString);
                        return isNaN(date.getTime())
                          ? "-"
                          : date.toLocaleDateString();
                      };

                      return (
                        <tr
                          key={proposal._id}
                          className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                          style={{ color: "black" }}
                        >
                          <td className="p-3 rounded-l-lg border-0">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedProposals.includes(
                                  proposal._id
                                )}
                                onChange={() =>
                                  toggleProposalSelection(proposal._id)
                                }
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                          <td className="p-3 border-0 ">
                            {displayProposalNumber}
                          </td>
                          <td className="p-3 border-0">
                            {proposal.clientName || "-"}
                          </td>
                          <td className="p-3 border-0">
                            {proposal.title || "-"}
                          </td>
                          {compactView ? (
                            <>
                              <td className="p-3 border-0 ">{displayAmount}</td>
                              <td className="p-3 border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    proposal.status
                                  )}`}
                                >
                                  {proposal.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border-0 ">{displayAmount}</td>
                              <td className="p-3 border-0">
                                {formatDate(proposal.date)}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(proposal.openTill)}
                              </td>
                              <td className="p-3 border-0">
                                {proposal.tags || "-"}
                              </td>
                              <td className="p-3 border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    proposal.status
                                  )}`}
                                >
                                  {proposal.status || "Draft"}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="p-4 text-center text-gray-500"
                      >
                        No proposals found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      case "estimates":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Estimates Report</h2>
            </div>

            {renderTableControls()}

            {/* Estimates Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedEstimates.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEstimates(currentData.map((e) => e._id));
                          } else {
                            setSelectedEstimates([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Estimate#
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Customer
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Amount
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Amount
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Total Tax
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Project
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Tags
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Expiry Date
                        </th>
                        <th
                          className="p-3 rounded-r-lg"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {estimatesLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 10}
                        className="p-4 text-center text-gray-500"
                      >
                        Loading estimates...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((estimate) => {
                      const displayEstimateNumber =
                        estimate.estimateNumber ||
                        "EST-" + estimate._id.slice(-6).toUpperCase();

                      const displayAmount = formatCurrency(
                        estimate.total,
                        estimate.currency
                      );

                      const totalTax = estimate.items
                        ? estimate.items.reduce(
                            (sum, item) =>
                              sum + (item.tax1 || 0) + (item.tax2 || 0),
                            0
                          )
                        : 0;

                      const formatDate = (dateString) => {
                        if (!dateString) return "-";
                        const date = new Date(dateString);
                        return isNaN(date.getTime())
                          ? "-"
                          : date.toLocaleDateString();
                      };

                      return (
                        <tr
                          key={estimate._id}
                          className="bg-white shadow rounded-lg hover:bg-gray-50 relative"
                          style={{ color: "black" }}
                        >
                          <td className="p-3 rounded-l-lg border-0">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedEstimates.includes(
                                  estimate._id
                                )}
                                onChange={() =>
                                  toggleEstimateSelection(estimate._id)
                                }
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                          <td className="p-3 border-0 ">
                            {displayEstimateNumber}
                          </td>
                          <td className="p-3 border-0">
                            {estimate.customer || "-"}
                          </td>
                          {compactView ? (
                            <>
                              <td className="p-3 border-0 ">{displayAmount}</td>
                              <td className="p-3 border-0">
                                {formatDate(estimate.estimateDate)}
                              </td>
                              <td className="p-3 rounded-r-lg border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    estimate.status
                                  )}`}
                                >
                                  {estimate.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border-0 ">{displayAmount}</td>
                              <td className="p-3 border-0 ">
                                {formatCurrency(totalTax, estimate.currency)}
                              </td>
                              <td className="p-3 border-0">
                                {estimate.reference || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {estimate.tags || "-"}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(estimate.estimateDate)}
                              </td>
                              <td className="p-3 border-0">
                                {formatDate(estimate.expiryDate)}
                              </td>
                              <td className="p-3 rounded-r-lg border-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                    estimate.status
                                  )}`}
                                >
                                  {estimate.status || "Draft"}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 10}
                        className="p-4 text-center text-gray-500"
                      >
                        No estimates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      case "customers":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Customers Report</h2>
            </div>

            {renderTableControls()}

            {/* Customers Table */}
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    <th
                      className="p-3 rounded-l-lg"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedCustomers.length === currentData.length &&
                          currentData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(currentData.map((c) => c._id));
                          } else {
                            setSelectedCustomers([]);
                          }
                        }}
                      />
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Company
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Primary Contact
                    </th>
                    <th
                      className="p-3"
                      style={{ backgroundColor: "#333333", color: "white" }}
                    >
                      Primary Email
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active Contacts
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Phone
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active Customer
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Active Contacts
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Groups
                        </th>
                        <th
                          className="p-3"
                          style={{ backgroundColor: "#333333", color: "white" }}
                        >
                          Date Created
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {customersLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 10}
                        className="p-4 text-center text-gray-500"
                      >
                        Loading customers...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((customer) => (
                      <tr
                        key={customer._id}
                        className="bg-white shadow rounded-lg hover:bg-gray-50"
                        style={{ color: "black" }}
                      >
                        <td className="p-3 rounded-l-lg border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer._id)}
                              onChange={() =>
                                toggleCustomerSelection(customer._id)
                              }
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="p-3 border-0">
                          {customer.company || "-"}
                        </td>
                        <td className="p-3 border-0">
                          {customer.contact || "-"}
                        </td>
                        <td className="p-3 border-0">
                          {customer.email || "-"}
                        </td>
                        {compactView ? (
                          <>
                            <td className="p-3 border-0">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  customer.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {customer.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 border-0">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  customer.contactsActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {customer.contactsActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 border-0">
                              {customer.phone || "-"}
                            </td>
                            <td className="p-3 border-0">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  customer.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {customer.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 border-0">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  customer.contactsActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {customer.contactsActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 border-0">
                              {customer.groups && customer.groups.length > 0
                                ? customer.groups.map((group, index) => (
                                    <span
                                      key={index}
                                      className="bg-gray-100 px-2 py-1 rounded text-xs mr-1"
                                    >
                                      {group}
                                    </span>
                                  ))
                                : "-"}
                            </td>
                            <td className="p-3 border-0">
                              {customer.dateCreated
                                ? new Date(
                                    customer.dateCreated
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 10}
                        className="p-4 text-center text-gray-500"
                      >
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        );
      default:
        return (
          <div className="p-6 text-center bg-white rounded border text-gray-500">
            Select a report type from the options above
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Sales Reports</h1>

        {/* Report Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "invoices"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("invoices");
              setActiveChart(null);
            }}
          >
            <FaFileInvoiceDollar className="text-xl mb-2" />
            <span className="text-xs text-center">Invoices Report</span>
          </button>

          {/* Other buttons remain the same */}
          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "items"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("items");
              setActiveChart(null);
            }}
          >
            <FaFileAlt className="text-xl mb-2" />
            <span className="text-xs text-center">Items Report</span>
          </button>

          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "payments"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("payments");
              setActiveChart(null);
            }}
          >
            <FaMoneyBill className="text-xl mb-2" />
            <span className="text-xs text-center">Payments Received</span>
          </button>

          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "creditNotes"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("creditNotes");
              setActiveChart(null);
            }}
          >
            <FaFileInvoice className="text-xl mb-2" />
            <span className="text-xs text-center">Credit Notes</span>
          </button>

          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "proposals"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("proposals");
              setActiveChart(null);
            }}
          >
            <FaFileAlt className="text-xl mb-2" />
            <span className="text-xs text-center">Proposals</span>
          </button>

          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "estimates"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("estimates");
              setActiveChart(null);
            }}
          >
            <FaFileAlt className="text-xl mb-2" />
            <span className="text-xs text-center">Estimates</span>
          </button>

          <button
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeReport === "customers"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
            onClick={() => {
              setActiveReport("customers");
              setActiveChart(null);
            }}
          >
            <FaUsers className="text-xl mb-2" />
            <span className="text-xs text-center">Customers</span>
          </button>
        </div>

        {/* Charts Based Report Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Charts Based Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                activeChart === "totalIncome"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setActiveChart("totalIncome");
                setActiveReport(null);
              }}
            >
              <FaChartBar className="text-xl mb-2" />
              <span>Total Income</span>
            </button>
            <button
              className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                activeChart === "paymentModes"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setActiveChart("paymentModes");
                setActiveReport(null);
              }}
            >
              <FaChartBar className="text-xl mb-2" />
              <span>Payment Modes</span>
            </button>
            <button
              className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                activeChart === "customerValue"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setActiveChart("customerValue");
                setActiveReport(null);
              }}
            >
              <FaChartBar className="text-xl mb-2" />
              <span>Total Value by Customer</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white p-4 rounded-lg border">
          {activeReport && renderReportContent()}
          {activeChart && renderChartContent()}
          {!activeReport && !activeChart && (
            <div className="p-6 text-center text-gray-500">
              Select a report type or chart to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
