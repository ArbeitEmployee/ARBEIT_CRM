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

  if (!staff)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex items-center justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 px-8 py-6 text-lg font-semibold text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          Loading...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <button
            onClick={() => navigate("/staff/dashboard")}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Dashboard
          </button>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Staff Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">My Profile</h1>
        </header>

        {/* Avatar Card */}
        <div className="flex items-center gap-4 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-3xl font-extrabold text-white shadow-md">
            {staff.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{staff.name}</h2>
            <p className="text-sm text-slate-500">{staff.email}</p>
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {staff.staffCode}
            </span>
          </div>
        </div>

        {/* Info / Edit Card */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Personal Information
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Staff Code
              </label>
              <input
                type="text"
                value={staff.staffCode}
                disabled
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Name
              </label>
              <input
                type="text"
                value={isEditing ? formData.name : staff.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={isEditing ? formData.email : staff.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Position
              </label>
              <input
                type="text"
                value={staff.position || "Not set"}
                disabled
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {isEditing && (
              <button
                onClick={handleUpdate}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
