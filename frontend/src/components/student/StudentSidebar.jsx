import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout, getCurrentUserProfile } from "../../services/authService";
import { getMyStudentProfile } from "../../services/studentService";

export default function StudentSidebar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [user, studentProfile] = await Promise.all([
          getCurrentUserProfile(),
          getMyStudentProfile().catch(() => null),
        ]);

        if (studentProfile) {
          setProfile({
            ...user,
            ...studentProfile,
            fullName: studentProfile.full_name || user?.full_name || "Student",
            studentId: studentProfile.student_id || "Student Portal",
            gradeClass: studentProfile.current_grade
              ? `Grade ${studentProfile.current_grade}${studentProfile.current_class ? ` • ${studentProfile.current_class}` : ""}`
              : "",
          });
        } else if (user) {
          setProfile({
            ...user,
            fullName: user.full_name || user.username || "Student",
            studentId: user.email || "Student Portal",
            gradeClass: "",
          });
        }
      } catch (err) {
        console.error("Failed to load student sidebar profile:", err);
      }
    }

    loadData();
  }, []);

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

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-slate-900 text-white shadow-xl z-20">
      {/* Brand Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
            🎓
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">SSMS Portal</h1>
            <p className="text-xs text-blue-400 font-medium">Student Dashboard</p>
          </div>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="border-b border-slate-800 bg-slate-800/40 px-6 py-4">
        <p className="text-sm font-semibold text-white truncate">
          {profile?.fullName || "Student Account"}
        </p>
        <p className="text-xs font-medium text-slate-400 mt-0.5">
          {profile?.studentId || "STU-PORTAL"}
        </p>
        {profile?.gradeClass && (
          <span className="mt-2 inline-block rounded-full bg-blue-900/50 border border-blue-700/50 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">
            {profile.gradeClass}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Navigation
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quick Links / Logout */}
      <div className="border-t border-slate-800 p-4 space-y-2">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <span>🏠</span>
          <span>Main System Portal</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
