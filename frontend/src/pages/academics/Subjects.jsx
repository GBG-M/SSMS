import { useEffect, useState } from 'react'
import { fetchSubjects, createSubject } from '../../services/academicService'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credit_hours: 1,
    department: '',
    is_active: true,
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const data = await fetchSubjects(token)
      setSubjects(data.results || data)
    } catch (err) {
      setError('Failed to load subjects')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createSubject(token, formData)
      setFormData({
        code: '',
        name: '',
        description: '',
        credit_hours: 1,
        department: '',
        is_active: true,
      })
      setShowForm(false)
      loadSubjects()
    } catch (err) {
      setError('Failed to create subject')
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
          <h1 className="text-3xl font-bold text-slate-900">Subjects</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Subject'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Create Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Subject Code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Subject Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Credit Hours"
                value={formData.credit_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credit_hours: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                min="1"
              />
              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="mr-2"
                />
                <span>Active</span>
              </label>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
              >
                Create Subject
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {subjects.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-slate-500">
              No subjects found
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {subject.code} - {subject.name}
                    </h3>
                    {subject.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {subject.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                      <span>Credit Hours: {subject.credit_hours}</span>
                      {subject.department && (
                        <span>Department: {subject.department}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      subject.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {subject.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
