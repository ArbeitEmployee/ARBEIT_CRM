// src/pages/staff/StaffProfile.jsx - NEW FILE
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StaffProfile = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [staff, setStaff] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const staffData = JSON.parse(localStorage.getItem("crm_staff"));
    if (!staffData) {
      navigate("/staff/login");
      return;
    }
    setStaff(staffData);
    setFormData(staffData);
  }, [navigate]);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("crm_staff_token");
      const res = await fetch(`${API_BASE_URL}/staff/${staff.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("crm_staff", JSON.stringify(data.staff));
        setStaff(data.staff);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!staff) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/staff/dashboard")}
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold mt-2">My Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Staff Code
              </label>
              <input
                type="text"
                value={staff.staffCode}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={isEditing ? formData.name : staff.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={isEditing ? formData.email : staff.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <input
                type="text"
                value={staff.position || "Not set"}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              />
            </div>

            {isEditing && (
              <button
                onClick={handleUpdate}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffProfile;
