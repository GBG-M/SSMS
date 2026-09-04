import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getCurrentUserProfile } from "../../services/authService";
import {
  getMyStudentProfile,
  getAcademicRecords,
  getAttendanceRecords,
  getDocuments,
} from "../../services/studentService";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [academics, setAcademics] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [userData, studentData, academicData, attendanceData, docsData] =
          await Promise.all([
            getCurrentUserProfile(),
            getMyStudentProfile().catch(() => null),
            getAcademicRecords().catch(() => []),
            getAttendanceRecords().catch(() => []),
            getDocuments().catch(() => []),
          ]);

        setUser(userData);
        setStudent(studentData);
        setAcademics(academicData);
        setAttendance(attendanceData);
        setDocuments(docsData);
      } catch (err) {
        console.error("Student dashboard loading error:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute live analytics
  const latestRecord = academics.length > 0 ? academics[0] : null;
  const currentGpa = latestRecord?.gpa || "N/A";
  const currentRank = latestRecord?.class_rank ? `#${latestRecord.class_rank}` : "N/A";

  // Count total subjects from latest academic record
  let subjectCount = 0;
  if (latestRecord && latestRecord.subjects) {
    if (typeof latestRecord.subjects === "object" && !Array.isArray(latestRecord.subjects)) {
      subjectCount = Object.keys(latestRecord.subjects).length;
    } else if (Array.isArray(latestRecord.subjects)) {
      subjectCount = latestRecord.subjects.length;
    }
  }

  // Attendance metrics
  const totalAttendanceDays = attendance.length;
  const presentDays = attendance.filter(
    (a) => (a.status || "").toUpperCase() === "PRESENT"
  ).length;
  const attendanceRate =
    totalAttendanceDays > 0
      ? `${Math.round((presentDays / totalAttendanceDays) * 100)}%`
      : "100%";

  const studentName =
    student?.first_name || user?.first_name || user?.username || "Student";
  const fullStudentName =
    student?.full_name ||
    `${student?.first_name || user?.first_name || ""} ${student?.last_name || user?.last_name || ""}`.trim() ||
    studentName;

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Top Welcome Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                <span>🌟</span>
                <span>Welcome Back</span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
                {fullStudentName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Academic Year {student?.academic_year || "2025/2026"} • Student Portal
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {student?.status || "Active Student"}
              </span>
              <Link
                to="/student/profile"
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
              >
                View Full Profile
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm font-medium text-slate-600">Loading student portal data...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-base font-bold">Failed to load student data</h2>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Profile Overview Banner */}
              <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-3xl font-bold text-white shadow-inner">
                      {student?.profile_picture ? (
                        <img
                          src={student.profile_picture}
                          alt={fullStudentName}
                          className="h-full w-full object-cover rounded-2xl"
                        />
                      ) : (
                        (student?.first_name?.[0] || user?.username?.[0] || "S").toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{fullStudentName}</h2>
                      <p className="text-xs text-blue-200 mt-0.5">
                        ID: <span className="font-semibold text-white">{student?.student_id || "STU2026-001"}</span>
                        {" • "}
                        Email: <span className="text-blue-100">{student?.email || user?.email}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                          Grade {student?.current_grade || "10"}
                        </span>
                        <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                          Class {student?.current_class || "10-A"}
                        </span>
                        {student?.guardian_name && (
                          <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                            Guardian: {student.guardian_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/student/academics"
                      className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow hover:bg-slate-100 transition"
                    >
                      View Report Card
                    </Link>
                  </div>
                </div>
              </div>

              {/* Metric Stats Cards */}
              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon="📊"
                  label="Current GPA"
                  value={currentGpa}
                  subtext={latestRecord?.term ? `${latestRecord.term} record` : "Cumulative"}
                  color="blue"
                />
                <MetricCard
                  icon="📅"
                  label="Attendance Rate"
                  value={attendanceRate}
                  subtext={`${presentDays} / ${totalAttendanceDays || 0} recorded sessions`}
                  color="emerald"
                />
                <MetricCard
                  icon="📚"
                  label="Registered Subjects"
                  value={subjectCount || "4"}
                  subtext="Enrolled this term"
                  color="indigo"
                />
                <MetricCard
                  icon="📄"
                  label="Documents on File"
                  value={documents.length}
                  subtext="Verified certificates & forms"
                  color="amber"
                />
              </div>

              {/* Main Content Grid: Recent Academics & Attendance */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Academic Highlights */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Latest Subject Performance</h2>
                        <p className="text-xs text-slate-500">
                          {latestRecord ? `${latestRecord.term} • ${latestRecord.academic_year}` : "Current Term"}
                        </p>
                      </div>
                      <Link
                        to="/student/academics"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        All Terms →
                      </Link>
                    </div>

                    {latestRecord && latestRecord.subjects && Object.keys(latestRecord.subjects).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(latestRecord.subjects).map(([subject, mark]) => {
                          const markVal = typeof mark === "object" ? mark.mark || mark.score || mark.grade : mark;
                          const num = Number(markVal);
                          const isHigh = !isNaN(num) && num >= 90;
                          return (
                            <div
                              key={subject}
                              className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3.5 hover:bg-slate-100/70 transition"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{subject}</p>
                                <p className="text-xs text-slate-500">Subject Assessment</p>
                              </div>
                              <span
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                  isHigh
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {markVal} {!isNaN(num) ? "%" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-slate-500">
                        <p>No subject performance records posted for this term yet.</p>
                      </div>
                    )}

                    {latestRecord?.remarks && (
                      <div className="mt-5 rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-xs text-blue-900">
                        <span className="font-bold">Teacher / Coordinator Remarks: </span>
                        {latestRecord.remarks}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Navigation Grid */}
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-4">Quick Navigation</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QuickActionCard
                        to="/student/academics"
                        icon="📚"
                        title="Academic Records"
                        description="View full grade reports, GPA history, and ranking."
                      />
                      <QuickActionCard
                        to="/student/attendance"
                        icon="📅"
                        title="Attendance History"
                        description="Review daily check-in logs and attendance rates."
                      />
                      <QuickActionCard
                        to="/student/documents"
                        icon="📄"
                        title="Student Documents"
                        description="Access certificates, ID cards, and upload documents."
                      />
                      <QuickActionCard
                        to="/student/profile"
                        icon="👤"
                        title="Personal Profile"
                        description="Update contact info and verify guardian information."
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Recent Attendance & Info Card */}
                <div className="space-y-6">
                  {/* Attendance Snippet */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h2 className="text-base font-bold text-slate-900">Recent Attendance</h2>
                      <Link
                        to="/student/attendance"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View All →
                      </Link>
                    </div>

                    {attendance.length > 0 ? (
                      <div className="space-y-3">
                        {attendance.slice(0, 5).map((entry, idx) => {
                          const status = (entry.status || "PRESENT").toUpperCase();
                          const statusBadge =
                            status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "LATE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800";

                          return (
                            <div
                              key={entry.id || idx}
                              className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800">
                                  {entry.date}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {entry.class_period || "Full Day"}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge}`}>
                                {status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No recent attendance entries recorded.
                      </div>
                    )}
                  </div>

                  {/* Emergency / Guardian Contact */}
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 mb-3">Guardian Information</h2>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <p className="text-slate-500">Guardian Name</p>
                        <p className="font-semibold text-slate-800">{student?.guardian_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-semibold text-slate-800">{student?.guardian_phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Email</p>
                        <p className="font-semibold text-slate-800">{student?.guardian_email || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color] || "bg-slate-50 text-slate-700"} text-base`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtext}</p>
    </div>
  );
}

function QuickActionCard({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition duration-150 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="text-2xl group-hover:scale-110 transition duration-150">{icon}</span>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
            {title}
          </h3>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      <p className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
        Open Portal <span>→</span>
      </p>
    </Link>
  );
}
