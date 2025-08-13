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
import ClientDashboard from "../pages/client/Dashboard";
import ClientHome from "../pages/client/Home";

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
              <Route path="sales/proposals" element={<Proposals />} />
              <Route path="sales/estimates" element={<Estimates />} />
              <Route path="sales/invoices" element={<Invoices/>} />
              <Route path="sales/payments" element={<Payments/>} />
              <Route path="sales/creditNotes" element={<CreditNotes/>} />
              <Route path="sales/items" element={<Items/>} />
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