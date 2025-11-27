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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Tasks</h1>
            <button
              onClick={() => navigate("/staff/dashboard")}
              className="text-blue-600 hover:underline flex items-center"
            >
              ← Back to Dashboard
            </button>
          </div>
          <button
            onClick={fetchStaffTasks}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Tasks
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">
              No Tasks Assigned
            </h2>
            <p className="text-gray-500">
              You don't have any tasks assigned to you yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {getDisplayStatus(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
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
                          className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {updatingTask === task._id && (
                          <span className="text-xs text-gray-500">
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
        )}
      </main>
    </div>
  );
};

export default StaffTasks;
