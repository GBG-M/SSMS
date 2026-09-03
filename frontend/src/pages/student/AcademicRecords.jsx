import StudentSidebar from "../../components/student/StudentSidebar";

const records = [
  {
    term: "Term 1",
    year: "2026/2027",
    gpa: "3.72",
    percentage: "88.50%",
    rank: 5,
    remarks: "Excellent performance",
  },
  {
    term: "Term 2",
    year: "2025/2026",
    gpa: "3.60",
    percentage: "85.20%",
    rank: 7,
    remarks: "Very good performance",
  },
];

const subjects = [
  ["Mathematics", "A", "92"],
  ["Physics", "A-", "88"],
  ["Chemistry", "B+", "85"],
  ["English", "A", "91"],
  ["Biology", "B+", "86"],
  ["Computer Science", "A", "94"],
];

export default function AcademicRecords() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Records
          </h1>

          <p className="mt-2 text-gray-600">
            Review your academic performance and grades.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Summary title="Current GPA" value="3.72" />
            <Summary title="Percentage" value="88.50%" />
            <Summary title="Class Rank" value="#5" />
          </div>

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Subject Grades
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Mark</th>
                  </tr>
                </thead>

                <tbody>
                  {subjects.map(([subject, grade, mark]) => (
                    <tr key={subject} className="border-b last:border-0">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {subject}
                      </td>
                      <td className="px-4 py-4 text-gray-700">{grade}</td>
                      <td className="px-4 py-4 text-gray-700">{mark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Previous Terms
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Academic Year</th>
                    <th className="px-4 py-3">GPA</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr
                      key={`${record.term}-${record.year}`}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-4">{record.term}</td>
                      <td className="px-4 py-4">{record.year}</td>
                      <td className="px-4 py-4 font-semibold">
                        {record.gpa}
                      </td>
                      <td className="px-4 py-4">{record.percentage}</td>
                      <td className="px-4 py-4">#{record.rank}</td>
                      <td className="px-4 py-4">{record.remarks}</td>
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