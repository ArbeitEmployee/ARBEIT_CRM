
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ClientLayout from "../layouts/ClientLayout";

// Admin Pages
import Dashboard from "../pages/admin/Dashboard";
import AdminLogin from "../pages/admin/adminLogin";
import ForgotPassword from "../pages/admin/forgotPassword";
import AdminSignup from "../pages/admin/adminSignup";

// Client Pages
import ClientLogin from "../pages/client/login";
import ClientRegistration from "../pages/client/registration";
import ClientForgotPassword from "../pages/client/forgotPassword";
import Home from "../pages/client/Home";
import ClientKnowledgeBasePage from "../pages/client/ClientKnowledgeBase";
import ClientProjectPage from "../pages/client/ClientProjectPage";

//Admin Section
import Customers from "../pages/admin/customers";
import Proposals from "../pages/admin/sales/proposals";
import Estimates from "../pages/admin/sales/estimates";
import Invoices from "../pages/admin/sales/invoices";
import Payments from "../pages/admin/sales/payments";
import CreditNotes from "../pages/admin/sales/creditNotes";
import Items from "../pages/admin/sales/items";
import ProposalForm from "../pages/admin/sales/proposalForm";
import SubscriptionPage from "../pages/admin/Subscription";
import ExpensesPage from "../pages/admin/Expenses";
import ContactsPage from "../pages/admin/Contacts";
import EstimateForm from "../pages/admin/sales/estimateForm";
import ProjectsPage from "../pages/admin/Project";
import TasksPage from "../pages/admin/Task";
import SupportPage from "../pages/admin/Support";
import LeadsPage from "../pages/admin/Leads";
import EstimateRequestPage from "../pages/admin/EstimateRequest";
import KnowledgeBase from "../pages/admin/KnowledgeBase";


import InvoiceForm from "../pages/admin/sales/invoiceForm";
import CreditNoteForm from "../pages/admin/sales/creditNoteForm";
import SalesReports from "../pages/admin/reports/sales";
import ExpenseReports from "../pages/admin/reports/expenses";
import ExpensesVsIncome from "../pages/admin/reports/expenses-vs-income";
import LeadsReport from "../pages/admin/reports/LeadsReport";
import KbArticlesReport from "../pages/admin/reports/kbArticles";
import StaffsPage from "../pages/admin/staffs";

// Utilities
import BulkPdfExport from "../pages/admin/utilities/BulkPdfExport";
import CsvExport from "../pages/admin/utilities/CsvExport";
import Calendar from "../pages/admin/utilities/Calendar";
import AnnouncementsPage from "../pages/admin/utilities/Announcements";
import GoalsPage from "../pages/admin/utilities/Goals";
import AllAdmins from "../pages/admin/admins/all";
import PendingAdmins from "../pages/admin/admins/pending";
import ChangePassword from "../pages/admin/changePassword";
import ClientChangePassword from "../pages/client/changePassword";
import ClientContactsPage from "../pages/client/ClientContacts";
import ClientEstimateRequest from "../pages/client/ClientEstimateRequest";
import ClientSupportPage from "../pages/client/ClientSupport";


const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to  admin */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* Admin Auth Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />

      {/* Client Auth Routes */}
      <Route path="/client/login" element={<ClientLogin />} />
      <Route path="/client/registration" element={<ClientRegistration />} />
      <Route path="/client/forgot-password" element={<ClientForgotPassword />} />

      {/* Admin Dashboard Routes */}
      <Route
        path="/admin/*"
        element={
          <AdminLayout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="staffs" element={<StaffsPage/>} />
              <Route path="sales/proposals" element={<Proposals/>} />
              <Route path="/proposals/new" element={<ProposalForm />} />
              <Route path="sales/estimates" element={<Estimates />} />
              <Route path="/estimates/new" element={<EstimateForm />} />
              <Route path="sales/invoices" element={<Invoices/>} />
              <Route path="/invoices/new" element={<InvoiceForm/>} />
              <Route path="sales/payments" element={<Payments/>} />
              <Route path="sales/creditNotes" element={<CreditNotes/>} />
              <Route path="reports/sales" element={<SalesReports />} />
              <Route path="reports/expenses" element={<ExpenseReports />} />
              <Route path="reports/expenses-vs-income" element={<ExpensesVsIncome />} />
              <Route path="change-password" element={<ChangePassword/>} />
              
              <Route path="/credit-notes/new" element={<CreditNoteForm/>} />
              <Route path="sales/items" element={<Items/>} />
              <Route path="subscriptions" element={<SubscriptionPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="contracts" element={<ContactsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="estimate-request" element={<EstimateRequestPage />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="reports/leads" element={<LeadsReport />} />
              <Route path="reports/kb-articles" element={<KbArticlesReport />} />
              <Route path="admins/all" element={<AllAdmins />} />
              <Route path="admins/pending" element={< PendingAdmins/>} />

              {/*Utilities */}
              <Route path="utilities/bulk-pdf" element={<BulkPdfExport />} />
              <Route path="utilities/csv" element={<CsvExport />} />
              <Route path="utilities/calendar" element={<Calendar />} />
              <Route path="utilities/announcements" element={<AnnouncementsPage />} />
              <Route path="utilities/goals" element={<GoalsPage />} />

              {/* Add more admin routes here */}
            </Routes>
          </AdminLayout>
        }
      />

      {/* Client Routes */}
      <Route
        path="/client/*"
        element={
          <ClientLayout>
            <Routes>
              <Route index element={<Home />} />
              <Route path="home" element={<Home />} />
              <Route path="knowledge-base" element={<ClientKnowledgeBasePage />} />
              <Route path="change-password" element={<ClientChangePassword/>} />
              <Route path="projects" element={<ClientProjectPage />} />
              <Route path="contracts" element={<ClientContactsPage />} />
              <Route path="estimates" element={<ClientEstimateRequest />} />
              <Route path="support" element={<ClientSupportPage />} />
              
              
              {/* Add more client routes here  <Route path="knowledge-base" element={<ClientKnowledgeBasePage />} />*/}
            </Routes>
          </ClientLayout>
        }
      />
    </Routes>
  );
};

export default AppRoutes;