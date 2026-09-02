import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";

export default function StudentSidebar() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  async function fetchStudentProfile() {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("/api/accounts/profile/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }

        return;
      }

      setStudent(data);
    } catch (error) {
      console.error("Failed to load student profile:", error);
    }
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/student/dashboard",
      icon: "📊",
    },
    {
      name: "My Profile",
      path: "/student/profile",
      icon: "👤",
    },
    {
      name: "Academic Records",
      path: "/student/academics",
      icon: "📚",
    },
    {
      name: "Attendance",
      path: "/student/attendance",
      icon: "📅",
    },
    {
      name: "Documents",
      path: "/student/documents",
      icon: "📄",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const studentName =
    student?.first_name || student?.username || "Student";

  const fullName =
    student?.first_name || student?.last_name
      ? `${student?.first_name || ""} ${student?.last_name || ""}`.trim()
      : studentName;

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-gray-900 text-white">

      {/* Logo */}
      <div className="border-b border-gray-700 px-6 py-6">
        <h1 className="text-xl font-bold">SSMS</h1>

        <p className="mt-1 text-sm text-gray-400">
          Student Portal
        </p>
      </div>

      {/* Student */}
      <div className="border-b border-gray-700 px-6 py-5">
        <p className="font-medium">
          {fullName}
        </p>

        <p className="text-sm text-gray-400">
          {student?.student_id || "Student"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">

        <p className="mb-3 px-3 text-xs font-semibold uppercase text-gray-500">
          Student Menu
        </p>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-700 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-3 text-left text-sm text-gray-300 transition hover:bg-gray-800"
        >
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}

