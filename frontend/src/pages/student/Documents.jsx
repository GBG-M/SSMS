import { useEffect, useState } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";
import {
  getDocuments,
  getMyStudentProfile,
  uploadStudentDocument,
} from "../../services/studentService";

const DOC_TYPES = [
  { value: "BIRTH_CERT", label: "Birth Certificate", icon: "📜" },
  { value: "REPORT_CARD", label: "Report Card", icon: "📊" },
  { value: "TRANSFER_CERT", label: "Transfer Certificate", icon: "📑" },
  { value: "MEDICAL", label: "Medical Record", icon: "🩺" },
  { value: "ID_CARD", label: "ID Card Photo", icon: "🪪" },
  { value: "OTHER", label: "Other Document", icon: "📄" },
];

function getDocIcon(type) {
  const match = DOC_TYPES.find((d) => d.value === type);
  return match ? match.icon : "📄";
}

function getDocTypeLabel(type) {
  const match = DOC_TYPES.find((d) => d.value === type);
  return match ? match.label : type;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("BIRTH_CERT");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [docsData, studentData] = await Promise.all([
        getDocuments(),
        getMyStudentProfile().catch(() => null),
      ]);
      setDocuments(docsData);
      setStudent(studentData);
    } catch (err) {
      console.error("Documents loading error:", err);
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!student?.id) {
      setUploadError("Student record not identified for upload.");
      return;
    }

    try {
      setSubmitting(true);
      setUploadError("");
      setUploadSuccess("");

      const formData = new FormData();
      formData.append("student", student.id);
      formData.append("title", uploadTitle);
      formData.append("document_type", uploadType);
      formData.append("description", uploadDescription);
      formData.append("file", uploadFile);

      await uploadStudentDocument(formData);
      setUploadSuccess("Document uploaded successfully!");
      setUploadTitle("");
      setUploadDescription("");
      setUploadFile(null);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess("");
        loadData();
      }, 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Top Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <span>📄</span>
                <span>Verification & Files</span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
                Student Documents
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Access official certificates, identity documents, and upload forms.
              </p>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <span>📤</span>
              <span>Upload Document</span>
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm font-medium text-slate-600">Loading student documents...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-base font-bold">Unable to load documents</h2>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                📂
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No Documents Uploaded Yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md">
                You currently have no documents on file. Click "Upload Document" above to submit certificates or ID scans.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => {
                const icon = getDocIcon(doc.document_type);
                const typeLabel = getDocTypeLabel(doc.document_type);
                const uploadDate = doc.uploaded_at
                  ? new Date(doc.uploaded_at).toLocaleDateString()
                  : "On File";

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl shadow-inner">
                          {icon}
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {typeLabel}
                        </span>
                      </div>

                      <h2 className="mt-4 text-base font-bold text-slate-900 truncate">
                        {doc.title}
                      </h2>

                      {doc.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span>Uploaded: {uploadDate}</span>
                        {doc.uploaded_by_name && (
                          <span className="block mt-0.5">By: {doc.uploaded_by_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      {doc.file ? (
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-sm transition"
                        >
                          <span>👁️</span>
                          <span>View / Download Document</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                        >
                          File Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Upload Student Document</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grade 10 National Exam Certificate"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or issue details..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 shadow transition disabled:opacity-60"
                >
                  {submitting ? "Uploading..." : "Submit Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}