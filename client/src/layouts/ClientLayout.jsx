import ClientHeader from "../components/headers/ClientHeader";

const ClientLayout = ({ children }) => {
  return (
    <>
      <ClientHeader />
      <main className="p-4">{children}</main>
    </>
  );
};

export default ClientLayout;
