// src/pages/staff/StaffDashboard.jsx - NEW FILE
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StaffDashboard = () => {
  const [staff, setStaff] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const staffData = JSON.parse(localStorage.getItem("crm_staff"));
    if (!staffData) {
      navigate("/staff/login");
      return;
    }
    setStaff(staffData);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Staff Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {staff?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {staff?.staffCode}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("crm_staff_token");
                localStorage.removeItem("crm_staff");
                navigate("/staff/login");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">My Tasks</h3>
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-gray-600">Assigned tasks</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            <p className="text-3xl font-bold text-green-600">8</p>
            <p className="text-gray-600">Tasks done</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">4</p>
            <p className="text-gray-600">Tasks pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/staff/tasks")}
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition"
            >
              View Tasks
            </button>
            <button
              onClick={() => navigate("/staff/profile")}
              className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition"
            >
              My Profile
            </button>
            <button
              onClick={() => navigate("/staff/reports")}
              className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition"
            >
              Reports
            </button>
            <button className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition">
              Support
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
