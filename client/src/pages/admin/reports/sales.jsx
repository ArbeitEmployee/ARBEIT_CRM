/* eslint-disable react-hooks/exhaustive-deps */
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
import { formatBDT, compactBDT } from "../../../utils/currency";

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
          currency: payment.currency || "BDT",
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
        return "bg-slate-100 text-slate-700";
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
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "BDT") => {
    return formatBDT(amount);
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
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            <HiOutlineDownload /> Export
          </button>
          {showExportMenu && (
            <div className="absolute z-10 mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg">
              {["Excel", "CSV", "PDF", "Print"].map((item) => (
                <button
                  key={item}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
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
          className="flex items-center rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
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
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={() => {
              setSearchTerm(searchInput);
              setCurrentPage(1);
            }}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        Showing {indexOfFirstItem + 1} to{" "}
        {Math.min(indexOfLastItem, filteredData.length)} of{" "}
        {filteredData.length} entries
      </span>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`rounded-xl border px-3 py-1.5 font-semibold transition-colors ${
              currentPage === i + 1
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Total Income Report</h3>

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
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
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
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => compactBDT(value)}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatBDT(value),
                          "Income",
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="#8b5cf6"
                        name="Income"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Total Income</h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(
                        incomeData.reduce((sum, item) => sum + item.income, 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Average Monthly Income
                    </h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Payment Modes Report</h3>

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
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
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
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "Number of Payments") {
                            return [value, "Times Used"];
                          } else {
                            return [
                              formatBDT(value),
                              "Total Amount",
                            ];
                          }
                        }}
                        labelFormatter={(label) => `Payment Method: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#8b5cf6"
                        name="Number of Payments"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#22c55e"
                        name="Total Amount"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Total Payments
                    </h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
                      {incomeData.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Total Amount</h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
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
                      <div key={index} className="rounded-2xl border border-white/60 bg-white/70 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.name}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
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
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
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
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => compactBDT(value)}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatBDT(value),
                          "Total Revenue",
                        ]}
                        labelFormatter={(label) => `Customer Group: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        name="Total Revenue"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Total Revenue</h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(
                        customerGroupsData.reduce(
                          (sum, item) => sum + item.value,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                    <h5 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Average per Group
                    </h5>
                    <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
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
                      <div key={index} className="rounded-2xl border border-white/60 bg-white/70 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="rounded-full px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800">
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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
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
              <h2 className="text-lg font-semibold text-slate-900">Invoices Report</h2>
            </div>

            {renderTableControls()}

            {/*INVOICE Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Invoice#
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Amount
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Customer
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Total Tax
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Customer
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Project
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Tags
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Due Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Reference
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
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
                          className="transition-colors hover:bg-white/70"
                          style={{ color: "black" }}
                        >
                          <td className="px-4 sm:px-6 py-3">
                            {displayInvoiceNumber}
                          </td>
                          <td className="px-4 sm:px-6 py-3">{displayAmount}</td>
                          {compactView ? (
                            <>
                              <td className="px-4 sm:px-6 py-3">
                                {invoice.customer || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(invoice.invoiceDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                    invoice.status
                                  )}`}
                                >
                                  {invoice.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 sm:px-6 py-3">
                                {formatCurrency(totalTax, invoice.currency)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {invoice.customer || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {invoice.reference || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {invoice.tags || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(invoice.invoiceDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {invoice.reference || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
              <h2 className="text-lg font-semibold text-slate-900">Items Report</h2>
            </div>

            {renderTableControls()}

            {/* Items Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Description
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Long Description
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Rate
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Tax1
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Tax2
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Unit
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Group Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 sm:px-6 py-6 text-center text-slate-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr
                        key={item._id}
                        className="transition-colors hover:bg-white/70"
                        style={{ color: "black" }}
                      >
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleCheckboxChange(item._id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3">{item.description}</td>
                        <td className="px-4 sm:px-6 py-3">{item.longDescription}</td>
                        <td className="px-4 sm:px-6 py-3">{item.rate}</td>
                        <td className="px-4 sm:px-6 py-3">{item.tax1}</td>
                        <td className="px-4 sm:px-6 py-3">{item.tax2}</td>
                        <td className="px-4 sm:px-6 py-3">{item.unit}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {item.groupName}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 sm:px-6 py-6 text-center text-slate-500">
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
              <h2 className="text-lg font-semibold text-slate-900">Payments Received</h2>
            </div>

            {renderTableControls()}

            {/* Payments Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Payment #
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Invoice #
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Payment Mode
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Transaction ID
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Customer
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Amount
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Payment Date
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 sm:px-6 py-6 text-center text-slate-500">
                        Loading payments...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((payment) => (
                      <tr
                        key={payment.paymentId}
                        className="transition-colors hover:bg-white/70"
                        style={{ color: "black" }}
                      >
                        <td className="px-4 sm:px-6 py-3 font-mono">
                          {payment.paymentId}
                        </td>
                        <td className="px-4 sm:px-6 py-3 font-mono">
                          {payment.invoiceNumber}
                        </td>
                        <td className="px-4 sm:px-6 py-3">{payment.paymentMode}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {payment.transactionId}
                        </td>
                        <td className="px-4 sm:px-6 py-3">{payment.customer}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 sm:px-6 py-3">{payment.paymentDate}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
              <h2 className="text-lg font-semibold text-slate-900">Credit Notes Report</h2>
            </div>

            {renderTableControls()}

            {/* Credit Notes Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
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
                      className="px-4 sm:px-6 py-3"                    >
                      Credit Note#
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Customer
                    </th>

                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Project
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Reference
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Amount
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Date
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {creditNotesLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
                          className="transition-colors hover:bg-white/70"
                          style={{ color: "black" }}
                        >
                          <td className="px-4 sm:px-6 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCreditNotes.includes(note._id)}
                              onChange={() =>
                                toggleCreditNoteSelection(note._id)
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-3">{displayNoteNumber}</td>
                          <td className="px-4 sm:px-6 py-3">
                            {note.customer || "-"}
                          </td>

                          {compactView ? (
                            <>
                              <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                                {formatCurrency(note.total, note.currency)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(note.creditNoteDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                    note.status
                                  )}`}
                                >
                                  {note.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 sm:px-6 py-3">
                                {note.project || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {note.reference || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatCurrency(note.total, note.currency)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(note.creditNoteDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
              <h2 className="text-lg font-semibold text-slate-900">Proposals Report</h2>
            </div>

            {renderTableControls()}

            {/* Proposals Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
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
                      className="px-4 sm:px-6 py-3"                    >
                      Proposal#
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Client
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Title
                    </th>

                    <>
                      <th
                        className="px-4 sm:px-6 py-3"
                                              >
                        Amount
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3"
                                              >
                        Date
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3"
                                              >
                        Open Till
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3"
                                              >
                        Tags
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3"
                                              >
                        Status
                      </th>
                    </>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 9}
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
                          className="transition-colors hover:bg-white/70"
                          style={{ color: "black" }}
                        >
                          <td className="px-4 sm:px-6 py-3">
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
                          <td className="px-4 sm:px-6 py-3">
                            {displayProposalNumber}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {proposal.clientName || "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {proposal.title || "-"}
                          </td>
                          {compactView ? (
                            <>
                              <td className="px-4 sm:px-6 py-3">{displayAmount}</td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                    proposal.status
                                  )}`}
                                >
                                  {proposal.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 sm:px-6 py-3">{displayAmount}</td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(proposal.date)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(proposal.openTill)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {proposal.tags || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
              <h2 className="text-lg font-semibold text-slate-900">Estimates Report</h2>
            </div>

            {renderTableControls()}

            {/* Estimates Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
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
                      className="px-4 sm:px-6 py-3"                    >
                      Estimate#
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Customer
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Amount
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Amount
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Total Tax
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Project
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Tags
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Expiry Date
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {estimatesLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 6 : 10}
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
                          className="transition-colors hover:bg-white/70"
                          style={{ color: "black" }}
                        >
                          <td className="px-4 sm:px-6 py-3">
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
                          <td className="px-4 sm:px-6 py-3">
                            {displayEstimateNumber}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {estimate.customer || "-"}
                          </td>
                          {compactView ? (
                            <>
                              <td className="px-4 sm:px-6 py-3">{displayAmount}</td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(estimate.estimateDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                    estimate.status
                                  )}`}
                                >
                                  {estimate.status || "Draft"}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 sm:px-6 py-3">{displayAmount}</td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatCurrency(totalTax, estimate.currency)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {estimate.reference || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {estimate.tags || "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(estimate.estimateDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                {formatDate(estimate.expiryDate)}
                              </td>
                              <td className="px-4 sm:px-6 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
              <h2 className="text-lg font-semibold text-slate-900">Customers Report</h2>
            </div>

            {renderTableControls()}

            {/* Customers Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th
                      className="px-4 sm:px-6 py-3"                    >
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
                      className="px-4 sm:px-6 py-3"                    >
                      Company
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Primary Contact
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3"                    >
                      Primary Email
                    </th>
                    {compactView ? (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Active Customer
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Active Contacts
                        </th>
                      </>
                    ) : (
                      <>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Phone
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Active Customer
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Active Contacts
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Groups
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3"
                                                  >
                          Date Created
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {customersLoading ? (
                    <tr>
                      <td
                        colSpan={compactView ? 7 : 10}
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
                      >
                        Loading customers...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((customer) => (
                      <tr
                        key={customer._id}
                        className="transition-colors hover:bg-white/70"
                        style={{ color: "black" }}
                      >
                        <td className="px-4 sm:px-6 py-3">
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
                        <td className="px-4 sm:px-6 py-3">
                          {customer.company || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {customer.contact || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {customer.email || "-"}
                        </td>
                        {compactView ? (
                          <>
                            <td className="px-4 sm:px-6 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  customer.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {customer.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  customer.contactsActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-700"
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
                            <td className="px-4 sm:px-6 py-3">
                              {customer.phone || "-"}
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  customer.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {customer.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  customer.contactsActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {customer.contactsActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              {customer.groups && customer.groups.length > 0
                                ? customer.groups.map((group, index) => (
                                    <span
                                      key={index}
                                      className="mr-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                    >
                                      {group}
                                    </span>
                                  ))
                                : "-"}
                            </td>
                            <td className="px-4 sm:px-6 py-3">
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
                        className="px-4 sm:px-6 py-6 text-center text-slate-500"
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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            Select a report type from the options above
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="space-y-6 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Reports
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Sales Reports</h1>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
          <button
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "invoices"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "items"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "payments"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "creditNotes"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "proposals"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "estimates"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-4 text-center transition-all ${
              activeReport === "customers"
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Charts Based Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                activeChart === "totalIncome"
                  ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                  : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                activeChart === "paymentModes"
                  ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                  : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                activeChart === "customerValue"
                  ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                  : "border-white/60 bg-white/80 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur hover:bg-white"
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
        <div className="rounded-3xl border border-white/60 bg-white/60 p-4 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur sm:p-5">
          {activeReport && renderReportContent()}
          {activeChart && renderChartContent()}
          {!activeReport && !activeChart && (
            <div className="p-6 text-center text-slate-500">
              Select a report type or chart to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
