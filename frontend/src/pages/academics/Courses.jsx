import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSubjects,
  getAcademicYears,
} from '../../services/academicService'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    subject: '',
    academic_year: '',
    level: 'SECONDARY',
    credit_hours: 3,
    description: '',
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const levels = ['PRIMARY', 'SECONDARY', 'COLLEGE', 'UNIVERSITY']

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [coursesData, subjectsData, yearsData] = await Promise.all([
        getCourses(),
        getSubjects(),
        getAcademicYears(),
      ])
      setCourses(coursesData)
      setSubjects(subjectsData)
      setAcademicYears(yearsData)
    } catch (err) {
      setError(err.message || 'Failed to load courses data')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingCourse(null)
    const defaultYear = academicYears.find((y) => y.is_active)?.id || academicYears[0]?.id || ''
    const defaultSub = subjects[0]?.id || ''
    setFormData({
      course_code: '',
      title: '',
      subject: defaultSub,
      academic_year: defaultYear,
      level: 'SECONDARY',
      credit_hours: 3,
      description: '',
      is_active: true,
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(course) {
    setEditingCourse(course)
    setFormData({
      course_code: course.course_code,
      title: course.title,
      subject: course.subject || course.subject_id || '',
      academic_year: course.academic_year || course.academic_year_id || '',
      level: course.level || 'SECONDARY',
      credit_hours: course.credit_hours || 1,
      description: course.description || '',
      is_active: course.is_active,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.subject || !formData.academic_year) {
      setError('Please select both a Subject and an Academic Year.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData)
        setSuccess(`Course "${formData.title}" updated successfully.`)
      } else {
        await createCourse(formData)
        setSuccess(`Course "${formData.title}" created successfully.`)
      }
      setModalOpen(false)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete course "${title}"?`)) {
      return
    }
    try {
      await deleteCourse(id)
      setSuccess(`Course "${title}" deleted.`)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete course')
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.subject_name && course.subject_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = levelFilter === 'ALL' || course.level === levelFilter
    return matchesSearch && matchesLevel
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Link to="/academics" className="hover:text-indigo-600 transition">Academics</Link>
                <span>/</span>
                <span className="text-indigo-600">Courses</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                📚 Course Catalog
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/academics"
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Overview
              </Link>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <span>+</span> Add Course
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span className="font-medium text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 font-bold hover:text-red-700">✕</button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <span>✓</span>
              <span className="font-medium text-sm">{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 font-bold hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search code, title, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 uppercase flex-shrink-0">Level:</span>
            {['ALL', ...levels].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0 ${
                  levelFilter === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading course catalog...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl">📚</span>
            <h3 className="text-lg font-bold text-slate-800">No Courses Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm || levelFilter !== 'ALL'
                ? 'Try adjusting your search criteria.'
                : 'Create your first course to begin scheduling classes and enrolling students.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition"
            >
              + Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg tracking-wider font-mono">
                      {course.course_code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        course.is_active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mt-3">{course.title}</h3>

                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      <span>📐</span> {course.subject_name ? `${course.subject_name} (${course.subject_code})` : 'Subject linked'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span>📅</span> Term: {course.academic_year_name || 'Academic Year'}
                    </p>
                  </div>

                  {course.description && (
                    <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                      <span>🎓</span> {course.level}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-100">
                      <span>⏱️</span> {course.credit_hours} Cr
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(course)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit Course"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.title)}
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Course"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCourse ? `Edit Course: ${editingCourse.course_code}` : 'Create New Course'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    placeholder="BIO-201"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Biology"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Parent Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Choose Term Year --</option>
                    {academicYears.map((yr) => (
                      <option key={yr.id} value={yr.id}>
                        {yr.name} {yr.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Education Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Hours *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credit_hours}
                    onChange={(e) => setFormData({ ...formData, credit_hours: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Description
                </label>
                <textarea
                  placeholder="Outline syllabus, key topics, prerequisites..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Course Status</span>
                  <span className="text-[11px] text-slate-500">Available for enrollment and scheduling</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

