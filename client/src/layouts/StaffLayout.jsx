import AdminLayout from "./AdminLayout";

const StaffLayout = ({ children }) => {
  return <AdminLayout userType="staff">{children}</AdminLayout>;
};

export default StaffLayout;
