import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getClassSections,
} from '../../services/academicService'

export default function Assessments() {
  const [assessments, setAssessments] = useState([])
  const [classSections, setClassSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState(null)
  const [editingAssessment, setEditingAssessment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    class_section: '',
    name: '',
    assessment_type: 'QUIZ',
    due_date: '',
    max_marks: 100,
    weight: 10,
    description: '',
  })

  const assessmentTypes = [
    { value: 'QUIZ', label: 'Quiz', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'ASSIGNMENT', label: 'Assignment', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'MIDTERM', label: 'Midterm Exam', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'FINAL', label: 'Final Exam', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { value: 'PRACTICAL', label: 'Practical Lab', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [assessmentsData, sectionsData] = await Promise.all([
        getAssessments(),
        getClassSections(),
      ])
      setAssessments(assessmentsData)
      setClassSections(sectionsData)
    } catch (err) {
      setError(err.message || 'Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingAssessment(null)
    setFormData({
      class_section: classSections[0]?.id || '',
      name: '',
      assessment_type: 'QUIZ',
      due_date: '',
      max_marks: 100,
      weight: 10,
      description: '',
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditingAssessment(item)
    setFormData({
      class_section: item.class_section || '',
      name: item.name || '',
      assessment_type: item.assessment_type || 'QUIZ',
      due_date: item.due_date || '',
      max_marks: item.max_marks || 100,
      weight: item.weight || 10,
      description: item.description || '',
    })
    setError('')
    setModalOpen(true)
  }

  function confirmDelete(item) {
    setAssessmentToDelete(item)
    setDeleteModalOpen(true)
  }

  async function handleDelete() {
    if (!assessmentToDelete) return
    setSubmitting(true)
    setError('')
    try {
      await deleteAssessment(assessmentToDelete.id)
      setSuccess(`Assessment "${assessmentToDelete.name}" deleted successfully`)
      setDeleteModalOpen(false)
      setAssessmentToDelete(null)
      await loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete assessment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (!formData.class_section) {
        throw new Error('Please select a valid class section')
      }
      if (!formData.name.trim()) {
        throw new Error('Assessment name cannot be empty')
      }
      if (Number(formData.max_marks) <= 0) {
        throw new Error('Max marks must be greater than 0')
      }
      if (Number(formData.weight) < 0 || Number(formData.weight) > 100) {
        throw new Error('Weight must be between 0% and 100%')
      }

      const payload = {
        class_section: parseInt(formData.class_section),
        name: formData.name.trim(),
        assessment_type: formData.assessment_type,
        due_date: formData.due_date || null,
        max_marks: parseFloat(formData.max_marks),
        weight: parseFloat(formData.weight),
        description: formData.description.trim(),
      }

      if (editingAssessment) {
        await updateAssessment(editingAssessment.id, payload)
        setSuccess(`Assessment "${payload.name}" updated successfully`)
      } else {
        await createAssessment(payload)
        setSuccess(`Assessment "${payload.name}" created successfully`)
      }

      setModalOpen(false)
      await loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save assessment')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAssessments = assessments.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      typeFilter === 'ALL' || item.assessment_type === typeFilter

    const matchesSection =
      sectionFilter === 'ALL' || String(item.class_section) === String(sectionFilter)

    return matchesSearch && matchesType && matchesSection
  })

  // KPI Calculations
  const totalCount = assessments.length
  const quizCount = assessments.filter(a => a.assessment_type === 'QUIZ' || a.assessment_type === 'ASSIGNMENT').length
  const examCount = assessments.filter(a => a.assessment_type === 'MIDTERM' || a.assessment_type === 'FINAL').length
  const avgWeight = totalCount > 0
    ? (assessments.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0) / totalCount).toFixed(1)
    : 0

  function getTypeBadge(type) {
    const found = assessmentTypes.find(t => t.value === type)
    if (!found) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {type}
        </span>
      )
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${found.color}`}>
        {found.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-1">
              <Link to="/academics" className="hover:text-blue-600 transition-colors">Academics</Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Assessments</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Assessments & Evaluations
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure quizzes, assignments, midterms, finals, and practical assessments for academic tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/academics/grades"
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Go to Grade Book
            </Link>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Assessment
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-sm font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Assessments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quizzes & Homework</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{quizCount}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Major Exams</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{examCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Weight %</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{avgWeight}%</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search assessment name, subject, or class section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ALL">All Class Sections ({classSections.length})</option>
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} {sec.subject_name ? `(${sec.subject_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-xs font-medium text-slate-400 mr-1 uppercase">Type:</span>
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Types ({assessments.length})
            </button>
            {assessmentTypes.map((t) => {
              const count = assessments.filter(a => a.assessment_type === t.value).length
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    typeFilter === t.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Assessments Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-slate-500">Loading assessments...</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-base font-semibold text-slate-900">No assessments found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || typeFilter !== 'ALL' || sectionFilter !== 'ALL'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Get started by creating your first assessment.'}
              </p>
              {!searchTerm && typeFilter === 'ALL' && sectionFilter === 'ALL' && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  + Add Assessment
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Assessment Name</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Class & Subject</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Type</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Due Date</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-center">Max Marks</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-center">Weight</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssessments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {item.class_name || `Section #${item.class_section}`}
                        </div>
                        {item.subject_name && (
                          <div className="text-xs text-slate-500">
                            {item.subject_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(item.assessment_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {item.due_date ? (
                          <span className="inline-flex items-center text-xs font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {item.due_date}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No deadline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          {item.max_marks} pts
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.weight}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline px-2 py-1"
                        >
                          Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Class Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.class_section}
                  onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Class Section --</option>
                  {classSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec.subject_name ? `• ${sec.subject_name}` : ''} ({sec.academic_year_name || 'Active'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assessment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination, Quiz 1: Matrices"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={formData.assessment_type}
                    onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {assessmentTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date / Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100"
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Weight (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="10"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder="Optional guidelines or instructions for students/teachers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && assessmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete assessment <strong className="text-slate-900">"{assessmentToDelete.name}"</strong>?
              Associated student grades will also be removed.
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setAssessmentToDelete(null)
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
