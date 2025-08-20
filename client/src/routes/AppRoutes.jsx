
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





const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to client home */}
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
              <Route path="sales/proposals" element={<Proposals/>} />
              <Route path="/proposals/new" element={<ProposalForm />} />
              <Route path="sales/estimates" element={<Estimates />} />
               <Route path="/estimates/new" element={<EstimateForm />} />
              <Route path="sales/invoices" element={<Invoices/>} />
              <Route path="sales/payments" element={<Payments/>} />
              <Route path="sales/creditNotes" element={<CreditNotes/>} />
              <Route path="sales/items" element={<Items/>} />
              <Route path="subscriptions" element={<SubscriptionPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="contracts" element={<ContactsPage />} />
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
              {/* Add more client routes here */}
            </Routes>
          </ClientLayout>
        }
      />
    </Routes>
  );
};

export default AppRoutes;