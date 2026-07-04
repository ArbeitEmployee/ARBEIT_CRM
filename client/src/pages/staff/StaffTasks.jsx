/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// src/pages/staff/StaffTasks.jsx - UPDATED FILE
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StaffTasks = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const staff = JSON.parse(localStorage.getItem("crm_staff"));
    if (!staff) {
      navigate("/staff/login");
      return;
    }
    fetchStaffTasks();
  }, [navigate]);

  const fetchStaffTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("crm_staff_token");
      const staff = JSON.parse(localStorage.getItem("crm_staff"));

      // ← CHANGED: Using staff name instead of ID for matching
      const res = await fetch(
        `${API_BASE_URL}/tasks/staff/${encodeURIComponent(staff.name)}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      console.log("Staff tasks response:", data); // Debug log

      if (data.success) {
        setTasks(data.tasks);
      } else {
        console.error("Error fetching tasks:", data.message);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // ← ADDED: Function to update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setUpdatingTask(taskId);
      const token = localStorage.getItem("crm_staff_token");

      const res = await fetch(`${API_BASE_URL}/tasks/staff/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus.toLowerCase().replace(" ", "-") }
              : task
          )
        );
        alert("Task status updated successfully!");
      } else {
        alert("Error updating task: " + data.message);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task status");
    } finally {
      setUpdatingTask(null);
    }
  };

  // ← ADDED: Status options for staff
  const statusOptions = [
    {
      value: "Not Started",
      label: "Not Started",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "In Progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "Testing",
      label: "Testing",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "Feedback",
      label: "Feedback",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "Complete",
      label: "Complete",
      color: "bg-green-100 text-green-800",
    },
  ];

  // ← ADDED: Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Handle DD-MM-YYYY format
      const parts = dateString.split("-");
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // ← ADDED: Get status color
  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(
      (opt) => opt.value.toLowerCase().replace(" ", "-") === status
    );
    return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
  };

  // ← ADDED: Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ← ADDED: Get display status text
  const getDisplayStatus = (status) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex items-center justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 px-8 py-6 text-lg font-semibold text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Staff Portal
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">My Tasks</h1>
            <button
              onClick={() => navigate("/staff/dashboard")}
              className="mt-1 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Back to Dashboard
            </button>
          </div>
          <button
            onClick={fetchStaffTasks}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            Refresh Tasks
          </button>
        </header>

        {tasks.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <h2 className="mb-2 text-xl font-semibold text-slate-700">
              No Tasks Assigned
            </h2>
            <p className="text-slate-500">
              You don't have any tasks assigned to you yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Task
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Priority
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Due Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {tasks.map((task) => (
                    <tr key={task._id} className="transition hover:bg-white/70">
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <div>
                          <div className="font-medium text-slate-900">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="truncate max-w-xs text-sm text-slate-500">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-slate-700 tabular-nums">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getDisplayStatus(task.status)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <select
                            value={
                              statusOptions.find(
                                (opt) =>
                                  opt.value.toLowerCase().replace(" ", "-") ===
                                  task.status
                              )?.value || ""
                            }
                            onChange={(e) =>
                              updateTaskStatus(task._id, e.target.value)
                            }
                            disabled={updatingTask === task._id}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {updatingTask === task._id && (
                            <span className="text-xs text-slate-500">
                              Updating...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTasks;
