import StudentSidebar from "../../components/student/StudentSidebar";

const student = {
  first_name: "Aemiro",
  last_name: "Belete",
  middle_name: "K.",
  student_id: "STU000001",
  date_of_birth: "2009-05-14",
  gender: "Male",
  email: "aemiro@example.com",
  phone_number: "+251 900 000 000",
  address: "Jima, Ethiopia",
  current_grade: "Grade 10",
  current_class: "10A",
  academic_year: "2026/2027",
  guardian_name: "Parent Name",
  guardian_relationship: "Father",
  guardian_phone: "+251 911 000 000",
  guardian_email: "parent@example.com",
  emergency_contact_name: "Emergency Contact",
  emergency_contact_phone: "+251 922 000 000",
  nationality: "Ethiopian",
  status: "ACTIVE",
};

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function StudentProfile() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            View your personal and student information.
          </p>

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Personal Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Info label="First Name" value={student.first_name} />
              <Info label="Middle Name" value={student.middle_name} />
              <Info label="Last Name" value={student.last_name} />
              <Info label="Student ID" value={student.student_id} />
              <Info label="Date of Birth" value={student.date_of_birth} />
              <Info label="Gender" value={student.gender} />
              <Info label="Nationality" value={student.nationality} />
              <Info label="Email" value={student.email} />
              <Info label="Phone" value={student.phone_number} />
              <Info label="Address" value={student.address} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Academic Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Info label="Grade" value={student.current_grade} />
              <Info label="Class" value={student.current_class} />
              <Info label="Academic Year" value={student.academic_year} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Guardian Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="Guardian Name" value={student.guardian_name} />
              <Info
                label="Relationship"
                value={student.guardian_relationship}
              />
              <Info label="Phone" value={student.guardian_phone} />
              <Info label="Email" value={student.guardian_email} />
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
        </div>
      </main>
    </div>
  );
}