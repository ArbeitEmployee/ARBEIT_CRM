import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ClientDashboard = () => {
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("crm_client_token");
    if (!token) {
      navigate("/client/login");
    }
  }, [navigate]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white">Client Dashboard</h1>
      <p className="text-gray-300">Welcome to your client dashboard</p>
    </div>
  );
};

export default ClientDashboard;