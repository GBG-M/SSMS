import StudentSidebar from "../../components/student/StudentSidebar";

const documents = [
  {
    title: "Birth Certificate",
    type: "Birth Certificate",
    date: "Aug 10, 2026",
  },
  {
    title: "Term 1 Report Card",
    type: "Report Card",
    date: "Jul 20, 2026",
  },
  {
    title: "Student ID Card",
    type: "ID Card Photo",
    date: "Jun 15, 2026",
  },
];

export default function Documents() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>

          <p className="mt-2 text-gray-600">
            View your student documents.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {documents.map((document) => (
              <div
                key={document.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xl">
                  📄
                </div>

                <h2 className="mt-5 font-semibold text-gray-900">
                  {document.title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {document.type}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  Uploaded: {document.date}
                </p>

                <button
  type="button"
  disabled
  className="mt-5 w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500"
>
  View Document
</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}