import { useEffect, useState } from 'react'
import {
  fetchEnrollments,
  createEnrollment,
} from '../../services/academicService'

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    student: '',
    class_section: '',
    status: 'ACTIVE',
    remarks: '',
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')
  const statuses = ['ACTIVE', 'PENDING', 'DROPPED', 'COMPLETED']

  useEffect(() => {
    loadEnrollments()
  }, [])

  async function loadEnrollments() {
    try {
      const data = await fetchEnrollments(token)
      setEnrollments(data.results || data)
    } catch (err) {
      setError('Failed to load enrollments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createEnrollment(token, formData)
      setFormData({
        student: '',
        class_section: '',
        status: 'ACTIVE',
        remarks: '',
      })
      setShowForm(false)
      loadEnrollments()
    } catch (err) {
      setError('Failed to create enrollment')
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
          <h1 className="text-3xl font-bold text-slate-900">Enrollments</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Enrollment'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Enroll Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Student ID"
                value={formData.student}
                onChange={(e) =>
                  setFormData({ ...formData, student: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
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
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Remarks (optional)"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
              >
                Enroll Student
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No enrollments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Class Section
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Enrolled Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm">
                        {enrollment.student?.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {enrollment.class_section?.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {enrollment.enrolled_on}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            enrollment.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : enrollment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : enrollment.status === 'DROPPED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {enrollment.status}
                        </span>
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
