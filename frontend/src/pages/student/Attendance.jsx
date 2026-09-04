import { useEffect, useState } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getAttendanceRecords } from "../../services/studentService";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance(start = startDate, end = endDate) {
    try {
      setLoading(true);
      setError("");
      const data = await getAttendanceRecords(start || null, end || null);
      setAttendance(data);
    } catch (err) {
      console.error("Attendance loading error:", err);
      setError(err.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAttendance(startDate, endDate);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    fetchAttendance("", "");
  };

  // Compute live attendance statistics
  const total = attendance.length;
  const presentCount = attendance.filter(
    (a) => (a.status || "").toUpperCase() === "PRESENT"
  ).length;
  const lateCount = attendance.filter(
    (a) => (a.status || "").toUpperCase() === "LATE"
  ).length;
  const absentCount = attendance.filter(
    (a) => (a.status || "").toUpperCase() === "ABSENT"
  ).length;
  const rate = total > 0 ? `${Math.round((presentCount / total) * 100)}%` : "100%";

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>📅</span>
              <span>Daily Check-ins</span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
              Attendance History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review daily presence, late arrivals, and recorded check-in times.
            </p>
          </div>

          {/* Metric Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Attendance Rate"
              value={rate}
              subtext="Overall presence"
              color="emerald"
            />
            <MetricCard
              title="Present Days"
              value={presentCount}
              subtext="Full sessions attended"
              color="blue"
            />
            <MetricCard
              title="Late Arrivals"
              value={lateCount}
              subtext="Tardy check-ins"
              color="amber"
            />
            <MetricCard
              title="Absences"
              value={absentCount}
              subtext="Unattended sessions"
              color="rose"
            />
          </div>

          {/* Filter Bar & Table Section */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attendance Log</h2>
                <p className="text-xs text-slate-500">Showing {attendance.length} session entries</p>
              </div>

              {/* Date Filter Form */}
              <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <label className="font-semibold text-slate-500">From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="font-semibold text-slate-500">To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-3.5 py-1.5 font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  Filter
                </button>

                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl bg-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-300 transition"
                  >
                    Reset
                  </button>
                )}
              </form>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                <p className="mt-3 text-xs font-medium text-slate-500">Loading attendance...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
                {error}
              </div>
            ) : attendance.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                <p className="text-2xl mb-2">🗓️</p>
                <p className="font-semibold text-slate-700">No attendance entries found</p>
                <p className="text-xs text-slate-400 mt-1">No check-ins recorded for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Check In</th>
                      <th className="px-5 py-3.5 font-semibold">Check Out</th>
                      <th className="px-5 py-3.5 font-semibold">Period / Class</th>
                      <th className="px-5 py-3.5 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((entry) => {
                      const status = (entry.status || "PRESENT").toUpperCase();
                      const statusBadge =
                        status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "LATE"
                          ? "bg-amber-100 text-amber-800"
                          : status === "EXCUSED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-rose-100 text-rose-800";

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {entry.date}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusBadge}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {entry.check_in_time || "—"}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {entry.check_out_time || "—"}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {entry.class_period || "Full Session"}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {entry.reason || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, subtext, color }) {
  const colorMap = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-extrabold ${colorMap[color] || "text-slate-900"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtext}</p>
    </div>
  );
}