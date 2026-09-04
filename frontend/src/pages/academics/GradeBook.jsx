import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAssessments,
  getGradeRecords,
  createGradeRecord,
  updateGradeRecord,
  deleteGradeRecord,
  getEnrollments,
} from '../../services/academicService'

export default function GradeBook() {
  const [assessments, setAssessments] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState(null)
  const [editingGrade, setEditingGrade] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [assessmentFilter, setAssessmentFilter] = useState('ALL')
  const [gradeLetterFilter, setGradeLetterFilter] = useState('ALL')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    enrollment: '',
    assessment: '',
    score: '',
    feedback: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [assessmentsData, gradesData, enrollmentsData] = await Promise.all([
        getAssessments(),
        getGradeRecords(),
        getEnrollments(),
      ])
      setAssessments(assessmentsData)
      setGrades(gradesData)
      setEnrollments(enrollmentsData)
    } catch (err) {
      setError(err.message || 'Failed to load grade book data')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingGrade(null)
    setFormData({
      enrollment: enrollments[0]?.id || '',
      assessment: assessments[0]?.id || '',
      score: '',
      feedback: '',
    })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(grade) {
    setEditingGrade(grade)
    setFormData({
      enrollment: grade.enrollment || '',
      assessment: grade.assessment || '',
      score: grade.score || '',
      feedback: grade.feedback || '',
    })
    setError('')
    setModalOpen(true)
  }

  function confirmDelete(grade) {
    setGradeToDelete(grade)
    setDeleteModalOpen(true)
  }

  async function handleDelete() {
    if (!gradeToDelete) return
    setSubmitting(true)
    setError('')
    try {
      await deleteGradeRecord(gradeToDelete.id)
      setSuccess('Grade record deleted successfully')
      setDeleteModalOpen(false)
      setGradeToDelete(null)
      await loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to delete grade record')
    } finally {
      setSubmitting(false)
    }
  }

  // Selected assessment object for modal helper
  const selectedAssessmentObj = assessments.find(
    (a) => String(a.id) === String(formData.assessment)
  )

  // Filter enrollments based on selected assessment section if available
  const availableEnrollments = selectedAssessmentObj
    ? enrollments.filter(
        (e) => String(e.class_section) === String(selectedAssessmentObj.class_section)
      )
    : enrollments

  // Calculate preview percentage
  const previewPercentage =
    selectedAssessmentObj && formData.score !== ''
      ? ((parseFloat(formData.score) / parseFloat(selectedAssessmentObj.max_marks)) * 100).toFixed(1)
      : null

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (!formData.enrollment) {
        throw new Error('Please select a student enrollment')
      }
      if (!formData.assessment) {
        throw new Error('Please select an assessment')
      }
      if (formData.score === '' || isNaN(formData.score)) {
        throw new Error('Please enter a valid numeric score')
      }

      const scoreNum = parseFloat(formData.score)
      if (scoreNum < 0) {
        throw new Error('Score cannot be negative')
      }

      if (selectedAssessmentObj && scoreNum > parseFloat(selectedAssessmentObj.max_marks)) {
        throw new Error(`Score (${scoreNum}) cannot exceed max marks (${selectedAssessmentObj.max_marks})`)
      }

      const payload = {
        enrollment: parseInt(formData.enrollment),
        assessment: parseInt(formData.assessment),
        score: scoreNum,
        feedback: formData.feedback.trim(),
      }

      if (editingGrade) {
        await updateGradeRecord(editingGrade.id, payload)
        setSuccess('Grade record updated successfully')
      } else {
        await createGradeRecord(payload)
        setSuccess('Grade record logged successfully')
      }

      setModalOpen(false)
      await loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save grade record')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredGrades = grades.filter((item) => {
    const matchesSearch =
      item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assessment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.class_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAssessment =
      assessmentFilter === 'ALL' || String(item.assessment) === String(assessmentFilter)

    const matchesLetter =
      gradeLetterFilter === 'ALL' || item.grade === gradeLetterFilter

    return matchesSearch && matchesAssessment && matchesLetter
  })

  // KPI Calculations
  const totalGrades = grades.length
  const avgScorePct = totalGrades > 0
    ? (grades.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0) / totalGrades).toFixed(1)
    : 0
  const countA = grades.filter(g => g.grade === 'A').length
  const countPassing = grades.filter(g => g.grade && g.grade !== 'F').length
  const passRate = totalGrades > 0 ? ((countPassing / totalGrades) * 100).toFixed(0) : 0

  function getGradeBadge(gradeLetter) {
    switch (gradeLetter) {
      case 'A':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Grade A</span>
      case 'B':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Grade B</span>
      case 'C':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Grade C</span>
      case 'D':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">Grade D</span>
      case 'F':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Grade F</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{gradeLetter || 'N/A'}</span>
    }
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
              <span className="text-slate-800 font-medium">Grade Book</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Grade Book & Performance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Record assessment scores, evaluate student academic performance, and provide formative feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/academics/assessments"
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Assessments
            </Link>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Record Grade
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Graded Submissions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalGrades}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Class Score</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{avgScorePct}%</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Grade A (Distinction)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{countA}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Passing Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{passRate}%</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                placeholder="Search by student name, ID number, assessment, or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="w-full sm:w-72">
              <select
                value={assessmentFilter}
                onChange={(e) => setAssessmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ALL">All Assessments ({assessments.length})</option>
                {assessments.map((ass) => (
                  <option key={ass.id} value={ass.id}>
                    {ass.name} ({ass.class_name || `Sec #${ass.class_section}`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Letter Grade Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-xs font-medium text-slate-400 mr-1 uppercase">Grade:</span>
            {['ALL', 'A', 'B', 'C', 'D', 'F'].map((g) => {
              const count = g === 'ALL' ? grades.length : grades.filter(gr => gr.grade === g).length
              return (
                <button
                  key={g}
                  onClick={() => setGradeLetterFilter(g)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    gradeLetterFilter === g
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'ALL' ? 'All Grades' : `Grade ${g}`} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-slate-500">Loading grade book records...</p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-16 px-4">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-base font-semibold text-slate-900">No grade records found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || assessmentFilter !== 'ALL' || gradeLetterFilter !== 'ALL'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start grading by recording student scores on assessments.'}
              </p>
              {!searchTerm && assessmentFilter === 'ALL' && gradeLetterFilter === 'ALL' && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  + Record First Grade
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Student</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Assessment</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-center">Score / Max</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-center">Percentage</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-center">Grade</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700">Feedback</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredGrades.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.student_name || `Enrollment #${item.enrollment}`}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {item.student_id_number && <span>ID: {item.student_id_number}</span>}
                          {item.class_name && <span>• {item.class_name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {item.assessment_name || `Assessment #${item.assessment}`}
                        </div>
                        {item.assessment_type && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.assessment_type} ({item.weight}% weight)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-slate-900">{item.score}</span>
                        <span className="text-xs text-slate-500"> / {item.max_marks || 100}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-semibold text-slate-800">{item.percentage}%</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${
                                parseFloat(item.percentage) >= 80
                                  ? 'bg-emerald-500'
                                  : parseFloat(item.percentage) >= 60
                                  ? 'bg-blue-500'
                                  : parseFloat(item.percentage) >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, parseFloat(item.percentage) || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getGradeBadge(item.grade)}
                      </td>
                      <td className="px-6 py-4 max-w-xs text-xs text-slate-600">
                        {item.feedback ? (
                          <span className="italic">"{item.feedback}"</span>
                        ) : (
                          <span className="text-slate-400">No feedback</span>
                        )}
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

      {/* Record / Edit Grade Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGrade ? 'Edit Grade Record' : 'Record Student Grade'}
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
                  Assessment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assessment}
                  onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Assessment --</option>
                  {assessments.map((ass) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.name} ({ass.class_name || `Section #${ass.class_section}`}) • Max: {ass.max_marks} pts • {ass.weight}% wt
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Enrollment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.enrollment}
                  onChange={(e) => setFormData({ ...formData, enrollment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Enrolled Student --</option>
                  {availableEnrollments.map((enr) => (
                    <option key={enr.id} value={enr.id}>
                      {enr.student_name || `Student #${enr.student}`} ({enr.student_id_number || 'No ID'}) • {enr.class_name}
                    </option>
                  ))}
                </select>
                {selectedAssessmentObj && availableEnrollments.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No active student enrollments found in this assessment's class section.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Score / Marks <span className="text-red-500">*</span>
                  </label>
                  {selectedAssessmentObj && (
                    <span className="text-xs text-slate-500">
                      Max Marks: <strong className="text-slate-800">{selectedAssessmentObj.max_marks}</strong>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedAssessmentObj ? selectedAssessmentObj.max_marks : 1000}
                    placeholder="e.g. 85.5"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {previewPercentage !== null && (
                    <div className="absolute right-3 top-2 text-xs font-semibold text-blue-600">
                      {previewPercentage}%
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teacher Feedback / Remarks
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Outstanding comprehension of fundamental concepts. Needs slight improvement on question 4."
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
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
                  {submitting ? 'Saving...' : editingGrade ? 'Update Grade' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && gradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Grade Deletion</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the grade record for student <strong className="text-slate-900">"{gradeToDelete.student_name || 'Enrolled Student'}"</strong> on assessment <strong className="text-slate-900">"{gradeToDelete.assessment_name || 'Assessment'}"</strong>?
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setGradeToDelete(null)
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
