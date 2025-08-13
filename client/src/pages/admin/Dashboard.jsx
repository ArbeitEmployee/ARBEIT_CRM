import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) {
      navigate("/admin/login");
    }
    // Optionally: verify token validity by calling backend
  }, [navigate]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mt-6">Admin Dashboard</h2>
      <p className="text-gray-600">
        Welcome to the admin panel. Here you can manage leads, clients, and all CRM data.
      </p>
    </div>
  );
};

export default Dashboard;


