import { useEffect, useState } from 'react'
import {
  fetchAssessments,
  fetchGradeRecords,
  createGradeRecord,
  updateGradeRecord,
} from '../../services/academicService'

export default function GradeBook() {
  const [assessments, setAssessments] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [editingGrade, setEditingGrade] = useState(null)
  const [formData, setFormData] = useState({
    enrollment: '',
    assessment: '',
    score: '',
    feedback: '',
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [assessmentsData, gradesData] = await Promise.all([
        fetchAssessments(token),
        fetchGradeRecords(token),
      ])
      setAssessments(assessmentsData.results || assessmentsData)
      setGrades(gradesData.results || gradesData)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingGrade) {
        await updateGradeRecord(token, editingGrade, formData)
        setEditingGrade(null)
      } else {
        await createGradeRecord(token, formData)
      }
      setFormData({
        enrollment: '',
        assessment: '',
        score: '',
        feedback: '',
      })
      loadData()
    } catch (err) {
      setError('Failed to save grade')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Grade Book</h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grade Entry Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">
              {editingGrade ? 'Edit Grade' : 'Add Grade'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enrollment ID"
                value={formData.enrollment}
                onChange={(e) =>
                  setFormData({ ...formData, enrollment: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <select
                value={formData.assessment}
                onChange={(e) =>
                  setFormData({ ...formData, assessment: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Select Assessment</option>
                {assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Score"
                value={formData.score}
                onChange={(e) =>
                  setFormData({ ...formData, score: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                step="0.01"
                required
              />
              <textarea
                placeholder="Feedback (optional)"
                value={formData.feedback}
                onChange={(e) =>
                  setFormData({ ...formData, feedback: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
              >
                {editingGrade ? 'Update Grade' : 'Add Grade'}
              </button>
              {editingGrade && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGrade(null)
                    setFormData({
                      enrollment: '',
                      assessment: '',
                      score: '',
                      feedback: '',
                    })
                  }}
                  className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 w-full"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* Grades List */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Recent Grades</h2>
              {grades.length === 0 ? (
                <div className="text-center text-slate-500">No grades found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-4 font-semibold">
                          Student
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Assessment
                        </th>
                        <th className="text-center py-2 px-4 font-semibold">
                          Score
                        </th>
                        <th className="text-center py-2 px-4 font-semibold">
                          Grade
                        </th>
                        <th className="text-center py-2 px-4 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((grade) => (
                        <tr
                          key={grade.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-2 px-4">
                            {grade.enrollment?.student?.full_name}
                          </td>
                          <td className="py-2 px-4">
                            {grade.assessment?.name}
                          </td>
                          <td className="py-2 px-4 text-center">{grade.score}</td>
                          <td className="py-2 px-4 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {grade.grade}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => {
                                setEditingGrade(grade.id)
                                setFormData({
                                  enrollment: grade.enrollment?.id,
                                  assessment: grade.assessment?.id,
                                  score: grade.score,
                                  feedback: grade.feedback,
                                })
                              }}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
