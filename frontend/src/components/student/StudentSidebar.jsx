
import { NavLink } from "react-router-dom";

export default function StudentSidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/student/dashboard",
      icon: "🏠",
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
          Aemiro Belete
        </p>

        <p className="text-sm text-gray-400">
          STU000001
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
          className="w-full rounded-lg px-3 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"
        >
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}

