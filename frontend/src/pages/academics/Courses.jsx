import { useEffect, useState } from 'react'
import { fetchCourses, createCourse } from '../../services/academicService'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    subject: '',
    academic_year: '',
    level: 'SECONDARY',
    credit_hours: 1,
    description: '',
    is_active: true,
  })
  const [error, setError] = useState('')

  const token = localStorage.getItem('authToken')
  const levels = ['PRIMARY', 'SECONDARY', 'COLLEGE', 'UNIVERSITY']

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const data = await fetchCourses(token)
      setCourses(data.results || data)
    } catch (err) {
      setError('Failed to load courses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createCourse(token, formData)
      setFormData({
        course_code: '',
        title: '',
        subject: '',
        academic_year: '',
        level: 'SECONDARY',
        credit_hours: 1,
        description: '',
        is_active: true,
      })
      setShowForm(false)
      loadCourses()
    } catch (err) {
      setError('Failed to create course')
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
          <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Course'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Create Course</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Course Code"
                value={formData.course_code}
                onChange={(e) =>
                  setFormData({ ...formData, course_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Course Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
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
                placeholder="Academic Year ID"
                value={formData.academic_year}
                onChange={(e) =>
                  setFormData({ ...formData, academic_year: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
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
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                Create Course
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {courses.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-slate-500">
              No courses found
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {course.course_code} - {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {course.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                      <span>Level: {course.level}</span>
                      <span>Credit Hours: {course.credit_hours}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      course.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {course.is_active ? 'Active' : 'Inactive'}
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
