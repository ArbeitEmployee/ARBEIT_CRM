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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero Header */}
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Staff Portal
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                Staff Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Welcome back, {staff?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                {staff?.staffCode}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("crm_staff_token");
                  localStorage.removeItem("crm_staff");
                  navigate("/staff/login");
                }}
                className="rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  My Tasks
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
                  12
                </p>
                <p className="mt-1 text-sm text-slate-500">Assigned tasks</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0ea5e9] text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Completed
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
                  8
                </p>
                <p className="mt-1 text-sm text-slate-500">Tasks done</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22c55e] text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
                  4
                </p>
                <p className="mt-1 text-sm text-slate-500">Tasks pending</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b] text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <button
              onClick={() => navigate("/staff/tasks")}
              className="rounded-2xl bg-[#0ea5e9] p-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              View Tasks
            </button>
            <button
              onClick={() => navigate("/staff/profile")}
              className="rounded-2xl bg-[#22c55e] p-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              My Profile
            </button>
            <button
              onClick={() => navigate("/staff/reports")}
              className="rounded-2xl bg-[#8b5cf6] p-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              Reports
            </button>
            <button className="rounded-2xl bg-[#f59e0b] p-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110">
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
