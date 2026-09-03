import { useEffect, useState } from "react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getAcademicRecords } from "../../services/studentService";

function getLetterGrade(mark) {
  const score = Number(mark);
  if (isNaN(score)) return mark || "—";
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 50) return "C";
  return "F";
}

export default function AcademicRecords() {
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecords() {
      try {
        setLoading(true);
        setError("");
        const data = await getAcademicRecords();
        setRecords(data);
        if (data.length > 0) {
          setSelectedRecordId(data[0].id);
        }
      } catch (err) {
        console.error("Academic records loading error:", err);
        setError(err.message || "Failed to load academic records.");
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const selectedRecord =
    records.find((r) => r.id === selectedRecordId) || records[0] || null;

  // Compute subjects list from the selected record
  const subjectEntries = selectedRecord?.subjects
    ? typeof selectedRecord.subjects === "object" && !Array.isArray(selectedRecord.subjects)
      ? Object.entries(selectedRecord.subjects)
      : Array.isArray(selectedRecord.subjects)
      ? selectedRecord.subjects.map((s, idx) => [
          s.subject || s.name || `Subject ${idx + 1}`,
          s.mark || s.score || s.grade || "N/A",
        ])
      : []
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />

      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>📚</span>
              <span>Academics & Performance</span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Records
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review official term grade cards, GPA trends, and subject evaluations.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm font-medium text-slate-600">Loading academic records...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
              <h2 className="text-base font-bold">Failed to load academic records</h2>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                📝
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No Academic Records Published Yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md">
                Your grades and term assessments will appear here once finalized and published by your academic coordinator.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                <SummaryCard
                  title="Term GPA"
                  value={selectedRecord?.gpa || "N/A"}
                  subtitle={selectedRecord ? `${selectedRecord.term}` : "Latest"}
                  color="blue"
                />
                <SummaryCard
                  title="Percentage"
                  value={selectedRecord?.percentage ? `${selectedRecord.percentage}%` : "N/A"}
                  subtitle="Average weighted score"
                  color="emerald"
                />
                <SummaryCard
                  title="Class Rank"
                  value={selectedRecord?.class_rank ? `#${selectedRecord.class_rank}` : "N/A"}
                  subtitle="Section standing"
                  color="indigo"
                />
                <SummaryCard
                  title="Total Records"
                  value={records.length}
                  subtitle="Terms completed"
                  color="amber"
                />
              </div>

              {/* Term Selector & Subject Breakdown */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Subject Marks & Evaluation
                    </h2>
                    <p className="text-xs text-slate-500">
                      Viewing {selectedRecord?.term} ({selectedRecord?.academic_year})
                    </p>
                  </div>

                  {/* Term Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Select Term:</label>
                    <select
                      value={selectedRecord?.id || ""}
                      onChange={(e) => setSelectedRecordId(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.term} ({r.academic_year})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {subjectEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 bg-slate-50/50">
                          <th className="px-5 py-3.5 font-semibold">Subject</th>
                          <th className="px-5 py-3.5 font-semibold text-center">Score / 100</th>
                          <th className="px-5 py-3.5 font-semibold text-center">Letter Grade</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subjectEntries.map(([subj, score]) => {
                          const num = Number(score);
                          const letter = getLetterGrade(score);
                          const isDistinction = !isNaN(num) && num >= 90;
                          return (
                            <tr key={subj} className="hover:bg-slate-50/60 transition">
                              <td className="px-5 py-4 font-semibold text-slate-800">{subj}</td>
                              <td className="px-5 py-4 text-center font-bold text-slate-900">
                                {score}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                  isDistinction ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {letter}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right text-xs font-medium">
                                {!isNaN(num) ? (
                                  num >= 85 ? (
                                    <span className="text-emerald-600 font-semibold">Excellent</span>
                                  ) : num >= 70 ? (
                                    <span className="text-blue-600 font-semibold">Good</span>
                                  ) : (
                                    <span className="text-amber-600 font-semibold">Satisfactory</span>
                                  )
                                ) : (
                                  <span className="text-slate-400">Completed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    No individual subject scores entered for this term record.
                  </div>
                )}

                {selectedRecord?.remarks && (
                  <div className="mt-6 rounded-xl bg-blue-50/70 border border-blue-100 p-4 text-xs text-blue-900">
                    <p className="font-bold uppercase tracking-wider text-blue-800 mb-1">Official Remarks:</p>
                    <p>{selectedRecord.remarks}</p>
                  </div>
                )}
              </section>

              {/* All Terms History Table */}
              <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Terms History & GPA Progression
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 bg-slate-50/50">
                        <th className="px-5 py-3.5 font-semibold">Term</th>
                        <th className="px-5 py-3.5 font-semibold">Academic Year</th>
                        <th className="px-5 py-3.5 font-semibold text-center">GPA</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Percentage</th>
                        <th className="px-5 py-3.5 font-semibold text-center">Class Rank</th>
                        <th className="px-5 py-3.5 font-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRecordId(r.id)}
                          className={`cursor-pointer transition ${
                            r.id === selectedRecordId ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="px-5 py-4 text-slate-900">{r.term}</td>
                          <td className="px-5 py-4 text-slate-600">{r.academic_year}</td>
                          <td className="px-5 py-4 text-center font-bold text-blue-600">{r.gpa || "—"}</td>
                          <td className="px-5 py-4 text-center text-slate-700">{r.percentage ? `${r.percentage}%` : "—"}</td>
                          <td className="px-5 py-4 text-center text-slate-700">{r.class_rank ? `#${r.class_rank}` : "—"}</td>
                          <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-xs">{r.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
  const colorMap = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-2 text-3xl font-extrabold ${colorMap[color] || "text-slate-900"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}