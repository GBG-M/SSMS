import { useEffect, useState } from 'react'
import {
  fetchAssessments,
  createAssessment,
} from '../../services/academicService'

export default function Assessments() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    class_section: '',
    name: '',
    assessment_type: 'QUIZ',
    due_date: '',
    max_marks: 100,
    weight: 10,
    description: '',
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')
  const types = ['QUIZ', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PRACTICAL']

  useEffect(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
    try {
      const data = await fetchAssessments(token)
      setAssessments(data.results || data)
    } catch (err) {
      setError('Failed to load assessments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createAssessment(token, formData)
      setFormData({
        class_section: '',
        name: '',
        assessment_type: 'QUIZ',
        due_date: '',
        max_marks: 100,
        weight: 10,
        description: '',
      })
      setShowForm(false)
      loadAssessments()
    } catch (err) {
      setError('Failed to create assessment')
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Assessments</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Assessment'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Create Assessment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Class Section ID"
                value={formData.class_section}
                onChange={(e) =>
                  setFormData({ ...formData, class_section: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Assessment Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <select
                value={formData.assessment_type}
                onChange={(e) =>
                  setFormData({ ...formData, assessment_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Max Marks"
                value={formData.max_marks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_marks: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                min="1"
              />
              <input
                type="number"
                placeholder="Weight (%)"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                min="0"
                max="100"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
              >
                Create Assessment
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {assessments.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No assessments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Assessment Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                      Max Marks
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                      Weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {assessment.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {assessment.assessment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {assessment.due_date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {assessment.max_marks}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {assessment.weight}%
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
  )
}
