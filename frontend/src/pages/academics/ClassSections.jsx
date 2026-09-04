import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getClassSections,
  createClassSection,
  updateClassSection,
  deleteClassSection,
  getClassSectionRoster,
  getSubjects,
  getAcademicYears,
  getUsersLookup,
} from '../../services/academicService'

export default function ClassSections() {
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [rosterModalOpen, setRosterModalOpen] = useState(false)
  const [activeRoster, setActiveRoster] = useState({ section: null, students: [], loading: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('ALL')
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [sectionsData, subjectsData, yearsData, usersData] = await Promise.all([
        getClassSections(),
        getSubjects(),
        getAcademicYears(),
        getUsersLookup().catch(() => []),
      ])
      setSections(sectionsData)
      setSubjects(subjectsData)
      setAcademicYears(yearsData)
      // Filter teachers or users
      setTeachers(usersData)
    } catch (err) {
      setError(err.message || 'Failed to load class sections')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingSection(null)
    const defaultYear = academicYears.find((y) => y.is_active)?.id || academicYears[0]?.id || ''
    const defaultSub = subjects[0]?.id || ''
    setFormData({
      section_code: '',
      name: '',
      academic_year: defaultYear,
      subject: defaultSub,
      teacher: '',
      room_number: '',
      capacity: 30,
      is_active: true,
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(sec) {
    setEditingSection(sec)
    setFormData({
      section_code: sec.section_code,
      name: sec.name,
      academic_year: sec.academic_year || sec.academic_year_id || '',
      subject: sec.subject || sec.subject_id || '',
      teacher: sec.teacher || sec.teacher_id || '',
      room_number: sec.room_number || '',
      capacity: sec.capacity || 30,
      is_active: sec.is_active,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleViewRoster(sec) {
    setActiveRoster({ section: sec, students: [], loading: true })
    setRosterModalOpen(true)
    try {
      const students = await getClassSectionRoster(sec.id)
      setActiveRoster({ section: sec, students, loading: false })
    } catch (err) {
      setActiveRoster({ section: sec, students: [], loading: false, error: err.message })
    }
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
      const payload = {
        ...formData,
        teacher: formData.teacher ? parseInt(formData.teacher) : null,
      }
      if (editingSection) {
        await updateClassSection(editingSection.id, payload)
        setSuccess(`Class Section "${formData.name}" updated successfully.`)
      } else {
        await createClassSection(payload)
        setSuccess(`Class Section "${formData.name}" created successfully.`)
      }
      setModalOpen(false)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save class section')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete class section "${name}"? Enrollments and assessments linked to this section may be affected.`)) {
      return
    }
    try {
      await deleteClassSection(id)
      setSuccess(`Section "${name}" deleted.`)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete section')
    }
  }

  const filteredSections = sections.filter((sec) => {
    const matchesSearch =
      sec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.section_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sec.subject_name && sec.subject_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sec.teacher_name && sec.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesYear =
      selectedYear === 'ALL' ||
      String(sec.academic_year) === String(selectedYear) ||
      sec.academic_year_name === selectedYear
    return matchesSearch && matchesYear
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
                <span className="text-indigo-600">Sections</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                🏫 Class Sections & Rooms
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
                <span>+</span> Add Class Section
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

        {/* Search & Year Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search code, section name, teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase flex-shrink-0">Academic Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.name} {yr.is_active ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sections Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading class sections...</div>
        ) : filteredSections.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-4xl">🏫</span>
            <h3 className="text-lg font-bold text-slate-800">No Class Sections Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedYear !== 'ALL'
                ? 'Try adjusting your search criteria.'
                : 'Create your first class section to begin assigning teachers and students.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition"
            >
              + Create Class Section
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((sec) => {
              const enrolled = sec.enrolled_students_count || 0
              const capacity = sec.capacity || 30
              const percent = Math.min(100, Math.round((enrolled / capacity) * 100))
              const isFull = enrolled >= capacity

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg tracking-wider font-mono">
                        {sec.section_code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          sec.is_active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sec.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 mt-3">{sec.name}</h3>

                    <div className="mt-3 space-y-1 text-xs">
                      <p className="font-semibold text-indigo-700 flex items-center gap-1.5">
                        <span>📐</span> {sec.subject_name ? `${sec.subject_name} (${sec.subject_code})` : 'Subject'}
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <span>👨‍🏫</span> Teacher: <span className="font-medium text-slate-800">{sec.teacher_name || 'Unassigned'}</span>
                      </p>
                      <p className="text-slate-500 flex items-center gap-1.5">
                        <span>🚪</span> Room: <span className="font-medium text-slate-800">{sec.room_number || 'TBA'}</span>
                      </p>
                      <p className="text-slate-500 flex items-center gap-1.5">
                        <span>📅</span> Year: <span className="font-medium text-slate-800">{sec.academic_year_name || 'Term'}</span>
                      </p>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">Enrollment Fill:</span>
                        <span className={isFull ? 'text-rose-600' : 'text-slate-800'}>
                          {enrolled} / {capacity} seats ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isFull ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewRoster(sec)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                    >
                      👥 Roster ({enrolled})
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(sec)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Section"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(sec.id, sec.name)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Section"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Roster Modal */}
      {rosterModalOpen && activeRoster.section && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Student Roster: {activeRoster.section.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Code: {activeRoster.section.section_code} | Teacher: {activeRoster.section.teacher_name || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => setRosterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {activeRoster.loading ? (
                <p className="text-center py-8 text-sm text-slate-500 animate-pulse">Fetching enrolled students...</p>
              ) : activeRoster.students.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <span className="text-3xl">👥</span>
                  <p className="text-sm font-medium text-slate-600">No students currently enrolled in this section.</p>
                  <Link
                    to="/academics/enrollments"
                    className="inline-block text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Go to Student Enrollments →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeRoster.students.map((st, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {st.full_name?.charAt(0) || 'S'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{st.full_name}</p>
                          <p className="text-xs text-slate-400 font-mono">ID: {st.student_id_number || st.student_id}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {st.status || 'ACTIVE'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSection ? `Edit Section: ${editingSection.section_code}` : 'Create Class Section'}
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
                    Section Code *
                  </label>
                  <input
                    type="text"
                    placeholder="SEC-10A"
                    value={formData.section_code}
                    onChange={(e) => setFormData({ ...formData, section_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 10 - Science Section A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Select Subject --</option>
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
                    <option value="">-- Select Term Year --</option>
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
                    Assigned Teacher
                  </label>
                  <select
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.username || t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 3 / Room 204"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="pt-5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Active Status</span>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
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
                  {submitting ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

