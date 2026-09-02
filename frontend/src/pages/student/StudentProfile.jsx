import { useEffect, useState } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase text-gray-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStudent() {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("You are not authenticated.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/students/me/", {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Failed to load student profile."
          );
        }

        setStudent(data);
      } catch (err) {
        console.error("Student profile error:", err);
        setError(
          err.message || "Unable to load student profile."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-6xl">

          <h1 className="text-3xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-gray-600">
            View your personal and student information.
          </p>

          {loading && (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-gray-600">
                Loading your profile...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">
              <p className="font-medium">
                Unable to load profile
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          )}

          {student && !loading && !error && (
            <>
              {/* Personal Information */}
              <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Info
                    label="First Name"
                    value={student.first_name}
                  />

                  <Info
                    label="Middle Name"
                    value={student.middle_name}
                  />

                  <Info
                    label="Last Name"
                    value={student.last_name}
                  />

                  <Info
                    label="Student ID"
                    value={student.student_id}
                  />

                  <Info
                    label="Date of Birth"
                    value={student.date_of_birth}
                  />

                  <Info
                    label="Gender"
                    value={student.gender}
                  />

                  <Info
                    label="Nationality"
                    value={student.nationality}
                  />

                  <Info
                    label="Email"
                    value={student.email}
                  />

                  <Info
                    label="Phone"
                    value={student.phone_number}
                  />

                  <Info
                    label="Address"
                    value={student.address}
                  />
                </div>
              </section>

              {/* Academic Information */}
              <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Academic Information
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Info
                    label="Grade"
                    value={student.current_grade}
                  />

                  <Info
                    label="Class"
                    value={student.current_class}
                  />

                  <Info
                    label="Academic Year"
                    value={student.academic_year}
                  />

                  <Info
                    label="Status"
                    value={student.status}
                  />
                </div>
              </section>

              {/* Guardian Information */}
              <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Guardian Information
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Info
                    label="Guardian Name"
                    value={student.guardian_name}
                  />

                  <Info
                    label="Relationship"
                    value={student.guardian_relationship}
                  />

                  <Info
                    label="Phone"
                    value={student.guardian_phone}
                  />

                  <Info
                    label="Email"
                    value={student.guardian_email}
                  />

                  <Info
                    label="Emergency Contact"
                    value={student.emergency_contact_name}
                  />

                  <Info
                    label="Emergency Phone"
                    value={student.emergency_contact_phone}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}