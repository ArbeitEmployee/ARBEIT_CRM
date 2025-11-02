import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const StaffDashboard = () => {
  const [staff, setStaff] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load staff data from localStorage
    const storedStaff = JSON.parse(localStorage.getItem("crm_staff"));
    if (storedStaff) {
      setStaff(storedStaff);
    }

    // Fetch staff tasks
    fetchStaffTasks();
  }, []);

  const fetchStaffTasks = async () => {
    try {
      const token = localStorage.getItem("crm_staff_token");
      const staff = JSON.parse(localStorage.getItem("crm_staff"));

      if (!staff || !staff.id) {
        toast.error("Staff information not found");
        return;
      }

      // Use the CORRECT staff route (note: /api/staff NOT /api/staffs)
      const res = await fetch(
        `http://localhost:5000/api/staff/${staff.id}/tasks`, // FIXED: removed 's' from staffs
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("crm_staff_token");
      const staff = JSON.parse(localStorage.getItem("crm_staff"));

      // Use the CORRECT staff route (note: /api/staff NOT /api/staffs)
      const res = await fetch(
        `http://localhost:5000/api/staff/${staff.id}/tasks/${taskId}`, // FIXED: removed 's' from staffs
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        toast.success("Task updated successfully");
        fetchStaffTasks(); // Refresh tasks
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {staff?.name}!
        </h1>
        <p className="text-gray-600">
          This is your staff dashboard. Here you can manage your assigned tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Tasks
          </h3>
          <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Completed
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {tasks.filter((task) => task.status === "completed").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-gray-900">
            {tasks.filter((task) => task.status === "pending").length}
          </p>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No tasks assigned yet.</p>
              <p className="text-gray-400 mt-2">
                You'll see your tasks here when they are assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {task.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {task.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          updateTaskStatus(task._id, "in-progress")
                        }
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task._id, "completed")}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
