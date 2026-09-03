import { useEffect, useState } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getCurrentUserProfile } from "../../services/authService";
import { getMyStudentProfile } from "../../services/studentService";

function InfoField({ label, value, icon }) {
  return (
    <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-4 transition hover:bg-slate-100/50">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-800 break-words">
        {value || "—"}
      </p>
    </div>
  );
}

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError("");

        const [userData, studentData] = await Promise.all([
          getCurrentUserProfile(),
          getMyStudentProfile().catch(() => null),
        ]);

        setUser(userData);
        setStudent(studentData);
      } catch (err) {
        console.error("Student profile loading error:", err);
        setError(err.message || "Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, []);

  const fullName =
    student?.full_name ||
    `${student?.first_name || user?.first_name || ""} ${student?.last_name || user?.last_name || ""}`.trim() ||
    user?.username ||
    "Student";

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>👤</span>
              <span>Student Profile</span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Personal records, academic enrollment details, and guardian contacts.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm font-medium text-slate-600">Loading student profile...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-base font-bold">Unable to load profile</h2>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Hero */}
              <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl font-bold text-white shadow-md">
                    {student?.profile_picture ? (
                      <img
                        src={student.profile_picture}
                        alt={fullName}
                        className="h-full w-full object-cover rounded-2xl"
                      />
                    ) : (
                      (student?.first_name?.[0] || user?.username?.[0] || "S").toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Student ID: <span className="font-semibold text-slate-800">{student?.student_id || "STU2026-001"}</span>
                      {" • "}
                      Username: <span className="font-semibold text-slate-800">{user?.username}</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                        {student?.status || "ACTIVE"}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800">
                        Grade {student?.current_grade || "10"} • {student?.current_class || "10-A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Account Type</p>
                  <p className="font-bold text-slate-800 mt-0.5">Enrolled Student</p>
                  <p className="mt-2">Enrolled Date</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {student?.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : "Active"}
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                  <span className="text-lg">🪪</span>
                  <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="First Name" value={student?.first_name || user?.first_name} />
                  <InfoField label="Middle Name" value={student?.middle_name} />
                  <InfoField label="Last Name" value={student?.last_name || user?.last_name} />
                  <InfoField label="Date of Birth" value={student?.date_of_birth} />
                  <InfoField label="Gender" value={student?.gender} />
                  <InfoField label="Nationality" value={student?.nationality || "Ethiopian"} />
                  <InfoField label="Religion" value={student?.religion} />
                  <InfoField label="Medical Conditions" value={student?.medical_conditions || "None reported"} />
                  <InfoField label="Allergies" value={student?.allergies || "None reported"} />
                </div>
              </section>

              {/* Contact Information */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                  <span className="text-lg">📞</span>
                  <h2 className="text-base font-bold text-slate-900">Contact & Address</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="Student Email" value={student?.email || user?.email} />
                  <InfoField label="Phone Number" value={student?.phone_number} />
                  <InfoField label="Residential Address" value={student?.address} />
                  <InfoField label="Emergency Contact Name" value={student?.emergency_contact_name} />
                  <InfoField label="Emergency Contact Phone" value={student?.emergency_contact_phone} />
                </div>
              </section>

              {/* Academic Enrollment Details */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                  <span className="text-lg">🏫</span>
                  <h2 className="text-base font-bold text-slate-900">Academic Enrollment</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoField label="Current Grade" value={student?.current_grade} />
                  <InfoField label="Current Class / Section" value={student?.current_class} />
                  <InfoField label="Academic Year" value={student?.academic_year || "2025/2026"} />
                  <InfoField label="Enrollment Status" value={student?.status || "ACTIVE"} />
                </div>
              </section>

              {/* Guardian Information */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <h2 className="text-base font-bold text-slate-900">Guardian & Parent Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoField label="Guardian Name" value={student?.guardian_name} />
                  <InfoField label="Relationship" value={student?.guardian_relationship || "Parent"} />
                  <InfoField label="Guardian Phone" value={student?.guardian_phone} />
                  <InfoField label="Guardian Email" value={student?.guardian_email} />
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}