import { Link } from "react-router-dom";
import StudentSidebar from "../../components/student/StudentSidebar";

const student = {
  first_name: "Aemiro",
  last_name: "Belete",
  student_id: "STU000001",
  current_grade: "Grade 10",
  current_class: "10A",
  academic_year: "2026/2027",
  status: "ACTIVE",
};

const stats = [
  { label: "Attendance", value: "94%", description: "This academic year" },
  { label: "GPA", value: "3.72", description: "Current GPA" },
  { label: "Class Rank", value: "#5", description: "Out of 40 students" },
  { label: "Subjects", value: "8", description: "Current subjects" },
];

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Welcome, {student.first_name}!
            </h1>

            <p className="mt-2 text-gray-600">
              Here's an overview of your academic information.
            </p>
          </div>

          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {student.first_name} {student.last_name}
                </h2>

                <p className="mt-1 text-gray-500">
                  Student ID: {student.student_id}
                </p>
              </div>

              <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Active Student
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Grade</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {student.current_grade}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Class</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {student.current_class}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Academic Year</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {student.academic_year}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Access
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <QuickLink
                to="/student/academics"
                title="Academic Records"
                description="View grades, GPA and class rank."
              />

              <QuickLink
                to="/student/attendance"
                title="Attendance"
                description="Check your attendance history."
              />

              <QuickLink
                to="/student/documents"
                title="Documents"
                description="View your important documents."
              />

              <QuickLink
                to="/student/profile"
                title="My Profile"
                description="View your personal information."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickLink({ to, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <p className="mt-4 text-sm font-medium text-gray-900">
        View details →
      </p>
    </Link>
  );
}