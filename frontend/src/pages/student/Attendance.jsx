import StudentSidebar from "../../components/student/StudentSidebar";

const attendance = [
  ["Aug 25, 2026", "Present", "08:02 AM", "Morning"],
  ["Aug 24, 2026", "Present", "07:58 AM", "Morning"],
  ["Aug 23, 2026", "Late", "08:17 AM", "Morning"],
  ["Aug 22, 2026", "Present", "07:55 AM", "Morning"],
  ["Aug 21, 2026", "Absent", "-", "Morning"],
];

export default function Attendance() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>

          <p className="mt-2 text-gray-600">
            View your attendance history.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
            <Summary title="Attendance" value="94%" />
            <Summary title="Present" value="47" />
            <Summary title="Late" value="2" />
            <Summary title="Absent" value="3" />
          </div>

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Attendance History
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Period</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map(([date, status, checkIn, period]) => (
                    <tr key={date} className="border-b last:border-0">
                      <td className="px-4 py-4 font-medium">{date}</td>
                      <td className="px-4 py-4">
                        <Status status={status} />
                      </td>
                      <td className="px-4 py-4">{checkIn}</td>
                      <td className="px-4 py-4">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Summary({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Status({ status }) {
  const styles = {
    Present: "bg-green-100 text-green-700",
    Late: "bg-yellow-100 text-yellow-700",
    Absent: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}