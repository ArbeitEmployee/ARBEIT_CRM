import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("crm_client_token"); // Changed from crm_token to crm_client_token
    if (!token) {
      navigate("/client/login");
    }
  }, [navigate]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Client Home</h2>
      <p className="text-gray-600">
        Welcome to the client portal. You can view your leads, payments, and communication history here.
      </p>
    </div>
  );
};

export default Home;