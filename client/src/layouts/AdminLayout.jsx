import AdminHeader from "../components/headers/AdminHeader";

const AdminLayout = ({ children }) => {
  const handleToggleSidebar = () => {
    console.log("Sidebar toggled (can implement drawer)");
  };

  return (
    <>
      <AdminHeader onToggleSidebar={handleToggleSidebar} />
      <main className="p-4">{children}</main>
    </>
  );
};

export default AdminLayout;
