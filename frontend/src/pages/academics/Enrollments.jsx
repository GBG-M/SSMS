import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getClassSections,
  getStudentsLookup,
} from '../../services/academicService'

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [classSections, setClassSections] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [formData, setFormData] = useState({
    student: '',
    class_section: '',
    status: 'ACTIVE',
    remarks: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const statuses = ['ACTIVE', 'PENDING', 'DROPPED', 'COMPLETED']

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [enrollmentsData, sectionsData, studentsData] = await Promise.all([
        getEnrollments(),
        getClassSections(),
        getStudentsLookup(),
      ])
      setEnrollments(enrollmentsData)
      setClassSections(sectionsData)
      setStudents(studentsData)
    } catch (err) {
      setError(err.message || 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingEnrollment(null)
    setFormData({
      student: students[0]?.id || '',
      class_section: classSections[0]?.id || '',
      status: 'ACTIVE',
      remarks: '',
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(enr) {
    setEditingEnrollment(enr)
    setFormData({
      student: enr.student || enr.student_id || '',
      class_section: enr.class_section || enr.class_section_id || '',
      status: enr.status || 'ACTIVE',
      remarks: enr.remarks || '',
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.student || !formData.class_section) {
      setError('Please select both a Student and a Class Section.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (editingEnrollment) {
        await updateEnrollment(editingEnrollment.id, formData)
        setSuccess('Enrollment record updated successfully.')
      } else {
        await createEnrollment(formData)
        setSuccess('Student successfully enrolled in section.')
      }
      setModalOpen(false)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save enrollment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickStatusChange(enr, newStatus) {
    try {
      await updateEnrollment(enr.id, {
        ...enr,
        status: newStatus,
      })
      setSuccess(`Enrollment status updated to ${newStatus}.`)
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update status')
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to remove the enrollment for ${name || 'this student'}?`)) {
      return
    }
    try {
      await deleteEnrollment(id)
      setSuccess('Enrollment removed.')
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete enrollment')
    }
  }

  const filteredEnrollments = enrollments.filter((enr) => {
    const studentName = enr.student_name || ''
    const studentId = enr.student_id_number || ''
    const className = enr.class_name || ''
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || enr.status === statusFilter
    const matchesSection =
      sectionFilter === 'ALL' ||
      String(enr.class_section) === String(sectionFilter)
    return matchesSearch && matchesStatus && matchesSection
  })

  function getStatusBadge(status) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'DROPPED':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

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
                <span className="text-indigo-600">Enrollments</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                👥 Student Course Enrollments
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
                <span>+</span> Enroll Student
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
              placeholder="Search student name, ID, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Section:</span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sections</option>
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.section_code} - {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
              {['ALL', ...statuses].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Loading enrollment records...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="text-4xl">👥</span>
              <h3 className="text-lg font-bold text-slate-800">No Enrollments Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'ALL' || sectionFilter !== 'ALL'
                  ? 'Try adjusting your search query or filters.'
                  : 'Enroll students in class sections to activate their attendance and academic grade records.'}
              </p>
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition"
              >
                + Enroll Student
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Class Section</th>
                    <th className="px-6 py-3.5">Enrolled Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Remarks</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {enr.student_name?.charAt(0) || 'S'}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{enr.student_name || `Student #${enr.student}`}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {enr.student_id_number || 'STU'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{enr.class_name || `Section #${enr.class_section}`}</p>
                          <p className="text-xs text-indigo-600 font-medium">
                            {enr.subject_name ? `${enr.subject_name} • ` : ''}{enr.academic_year_name || ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {enr.enrolled_on}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(enr.status)}`}>
                          {enr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {enr.remarks || '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(enr)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Enrollment"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(enr.id, enr.student_name)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Enrollment"
                        >
                          🗑️
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEnrollment ? 'Edit Student Enrollment' : 'Enroll Student in Class Section'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Student *
                </label>
                <select
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name || `${st.first_name} ${st.last_name}`} ({st.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Class Section *
                </label>
                <select
                  value={formData.class_section}
                  onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose Section --</option>
                  {classSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.section_code} - {sec.name} ({sec.subject_name || 'Subject'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enrollment Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  placeholder="Special accommodations, transfer details..."
                  rows="3"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  {submitting ? 'Saving...' : editingEnrollment ? 'Update Enrollment' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

