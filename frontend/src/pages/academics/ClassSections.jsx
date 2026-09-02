import { useEffect, useState } from 'react'
import {
  fetchClassSections,
  createClassSection,
} from '../../services/academicService'

export default function ClassSections() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    section_code: '',
    name: '',
    academic_year: '',
    subject: '',
    teacher: '',
    room_number: '',
    capacity: 30,
    is_active: true,
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')

  useEffect(() => {
    loadClassSections()
  }, [])

  async function loadClassSections() {
    try {
      const data = await fetchClassSections(token)
      setSections(data.results || data)
    } catch (err) {
      setError('Failed to load class sections')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createClassSection(token, formData)
      setFormData({
        section_code: '',
        name: '',
        academic_year: '',
        subject: '',
        teacher: '',
        room_number: '',
        capacity: 30,
        is_active: true,
      })
      setShowForm(false)
      loadClassSections()
    } catch (err) {
      setError('Failed to create class section')
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
          <h1 className="text-3xl font-bold text-slate-900">Class Sections</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Class Section'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Create Class Section</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Section Code"
                value={formData.section_code}
                onChange={(e) =>
                  setFormData({ ...formData, section_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Section Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Academic Year ID"
                value={formData.academic_year}
                onChange={(e) =>
                  setFormData({ ...formData, academic_year: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Subject ID"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Teacher ID (optional)"
                value={formData.teacher}
                onChange={(e) =>
                  setFormData({ ...formData, teacher: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Room Number"
                value={formData.room_number}
                onChange={(e) =>
                  setFormData({ ...formData, room_number: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                min="1"
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
                Create Class Section
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {sections.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-slate-500">
              No class sections found
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {section.section_code} - {section.name}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                      {section.room_number && (
                        <span>Room: {section.room_number}</span>
                      )}
                      <span>Capacity: {section.capacity}</span>
                      <span>Enrolled: {section.enrolled_students_count}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      section.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {section.is_active ? 'Active' : 'Inactive'}
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
